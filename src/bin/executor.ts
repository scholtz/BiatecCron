/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import algosdk, { Transaction } from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { BiatecCronJobClient } from '../../contracts/clients/BiatecCronJobClient';
import getAlgod from '../scripts/algo/getAlgod';
import getIndexer from '../scripts/algo/getIndexer';

/**
 * Executor is the runnable app which executes all scheduler tasks
 */
const app = async () => {
  algokit.Config.configure({ populateAppCallResources: true });

  try {
    console.log(`${new Date()} Executor started`);
    const indexer = getIndexer(process.env.env ?? 'testnet-v1.0');
    const algod = getAlgod(process.env.env ?? 'testnet-v1.0');
    const txs = await indexer
      .lookupAccountTransactions('SCPSTM7HIYCTAXLFFGSOKQRW24RKSPIEWSYSG52PKR2LESGRYTUGNBS7S4')
      .do();
    if (!process.env.signer) throw Error('Env variable signer is missing');
    const signerAccount = algosdk.mnemonicToSecretKey(process.env.signer ?? '');
    const signer = {
      addr: signerAccount.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(signerAccount.sk));
      },
    };

    // eslint-disable-next-line no-restricted-syntax
    for (const tx of txs.transactions) {
      if (tx['application-transaction']) {
        const appId = tx['application-transaction']['application-id'];
        console.log('tx', tx['application-transaction']['application-id']);
        const appInfo = await algod.getApplicationByID(appId).do();
        console.log('appInfo', appInfo.params['global-state']);
        const lastRun = appInfo.params['global-state'].find((a: any) => a.key === 'cw==');
        const interval = appInfo.params['global-state'].find((a: any) => a.key === 'cA==');
        const nextRun = lastRun.value.uint + interval.value.uint;
        const nextRunDate = new Date(nextRun * 1000);
        console.log('nextRun', nextRun, nextRunDate);
        if (nextRunDate <= new Date()) {
          const client = new BiatecCronJobClient(
            {
              id: appId,
              resolveBy: 'id',
              sender: signer,
            },
            algod
          );
          const exec = client.exec(
            {},
            {
              sendParams: {
                fee: algokit.microAlgos(4000),
              },
            }
          );
          console.log('exec', exec);
        }
      }
    }
  } catch (e) {
    console.error('fatal: ', e);
  }
};

app();
