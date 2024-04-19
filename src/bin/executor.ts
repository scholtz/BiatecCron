/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import algosdk, { AtomicTransactionComposer, Transaction } from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { setTimeout } from 'node:timers/promises';
import getAlgod from '../scripts/algo/getAlgod';
import getPoolManagerApp from '../scripts/scheduler/getPoolManagerApp';
import parseBoxData from '../scripts/scheduler/parseBoxData';
import { ITaskBox } from '../interface/ITaskBox';
import { BiatecTaskManagerClient } from '../../contracts/clients/BiatecTaskManagerClient';
import { BiatecCronJobShortHashClient } from '../../contracts/clients/BiatecCronJob__SHORT_HASH__Client';
import simulateAndCountTxs from '../scripts/algo/simulateAndCountTxs';

/**
 * Executor is the runnable app which executes all scheduler tasks
 */
const app = async () => {
  //  algokit.Config.configure({ populateAppCallResources: true });
  const fairUsageTimeout = 500;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (!process.env.signer) throw Error('Env variable signer is missing');
      const signerAccount = algosdk.mnemonicToSecretKey(process.env.signer ?? '');
      const signer = {
        addr: signerAccount.addr,
        // eslint-disable-next-line no-unused-vars
        signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
          return txnGroup.map((tx) => tx.signTxn(signerAccount.sk));
        },
      };

      console.log(`${new Date()} Executor started`);
      const env = process.env.env ?? 'localhost';
      const algod = getAlgod(env);
      const appPoolId = getPoolManagerApp(env);
      const boexes = await algod.getApplicationBoxes(appPoolId).do();
      await setTimeout(fairUsageTimeout); // fair usage policy to algod node

      const toExec: { [key: string]: ITaskBox } = {};

      // eslint-disable-next-line no-restricted-syntax
      for (const boxName of boexes.boxes) {
        try {
          const boxData = await algod.getApplicationBoxByName(appPoolId, boxName.name).do();
          await setTimeout(fairUsageTimeout); // fair usage policy to algod node
          const data = parseBoxData(boxData.value);
          if (data.fee < 1000) continue;

          const appInfo = await algod.getApplicationByID(data.app).do();
          // console.log('appInfo', appInfo.params['global-state']);
          const lastRun = appInfo.params['global-state'].find((a: any) => a.key === 'bA==');
          const interval = appInfo.params['global-state'].find((a: any) => a.key === 'cA==');
          const nextRun = lastRun.value.uint + interval.value.uint;
          const nextRunDate = new Date(nextRun * 1000);
          console.log(`nextRun for app ${data.app}`, nextRun, nextRunDate);
          await setTimeout(fairUsageTimeout); // fair usage policy to algod node
          if (nextRunDate <= new Date()) {
            toExec[data.app.toString()] = data;
          }
          console.log(data);
        } catch (e: any) {
          console.error(e.message);
        }
      }

      console.log('toExec', toExec);

      const execClient = new BiatecTaskManagerClient(
        {
          id: appPoolId,
          resolveBy: 'id',
          sender: signer,
        },
        algod
      );
      const execClientState = await execClient.getGlobalState();
      // eslint-disable-next-line no-restricted-syntax
      for (const run of Object.values(toExec)) {
        try {
          const client = new BiatecCronJobShortHashClient(
            {
              id: run.app,
              resolveBy: 'id',
              sender: signer,
            },
            algod
          );
          const atc = new AtomicTransactionComposer();
          const assets = [0];
          await client.exec(
            {},
            {
              sendParams: {
                fee: algokit.microAlgos(1000000),
                atc,
              },
              apps: [],
              assets,
            }
          );
          const txsGroup = atc.buildGroup().map((tx) => tx.txn);
          const signed = txsGroup.map((tx) => tx.signTxn(signerAccount.sk));
          const simulate = await atc.simulate(
            algod,
            new algosdk.modelsv2.SimulateRequest({
              allowUnnamedResources: true,
              allowEmptySignatures: true,
              allowMoreLogging: true,
              execTraceConfig: new algosdk.modelsv2.SimulateTraceConfig({
                enable: true,
                scratchChange: true,
                stackChange: true,
                stateChange: true,
              }),
              txnGroups: [
                new algosdk.modelsv2.SimulateRequestTransactionGroup({
                  txns: signed.map((txn) => algosdk.decodeObj(txn)) as algosdk.EncodedSignedTransaction[],
                }),
              ],
            })
          );
          // console.log('simulate', JSON.stringify(simulate));

          // console.log('simulate', simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed);
          const assetsSim =
            simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.assets?.map((a) => Number(a)) ?? [];
          assetsSim.forEach((a) => assets.push(a));
          const boxes =
            simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.boxes?.map((a) => a as any) ?? [];
          boxes.push({
            appIndex: appPoolId,
            name: algosdk.bigIntToBytes(run.app, 8),
          });
          const apps =
            simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.apps?.map((a) => Number(a)) ?? [];
          apps.push(appPoolId);
          apps.push(run.app);
          // console.log('assets', assets);
          const atc2 = new AtomicTransactionComposer();
          await client.exec(
            {},
            {
              sendParams: {
                fee: algokit.microAlgos(1000000),
                atc: atc2,
              },
              assets,
              accounts: simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.accounts,
              apps,
              boxes,
            }
          );
          const txs = atc2.buildGroup().map((tx) => tx.txn);

          const txCount = await simulateAndCountTxs(txs, algod, signerAccount);
          const fee = 1000 * (txCount + 2);
          console.log(`fee: ${fee}`);
          // if (2 > 1) {
          //   throw Error('fail here');
          // }

          const atc3 = new AtomicTransactionComposer();
          await client.exec(
            {},
            {
              sendParams: {
                fee: algokit.microAlgos(0),
                atc: atc3,
              },
              assets,
              accounts: simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.accounts,
              apps,
              boxes,
            }
          );
          const txsFinal = atc3.buildGroup().map((tx) => tx.txn);

          assets.push(Number(execClientState.fa?.asNumber() ?? 0));
          console.log('going to execute');
          await execClient.executeTask(
            {
              taskAppCall: txsFinal[0],
            },
            {
              sendParams: {
                fee: algokit.microAlgos(fee),
              },
              assets,
              accounts: simulate.simulateResponse.txnGroups[0].unnamedResourcesAccessed?.accounts,
              apps,
              boxes,
            }
          );
          console.log('execute successfull');
        } catch (e) {
          console.error(`Error while executing app ${run.app}`, e);
        }
      }
    } catch (e) {
      console.error('fatal: ', e);
    }
    console.log(new Date());
    await setTimeout(20000 + Math.round(Math.random() * 10000));
  }
};

app();
