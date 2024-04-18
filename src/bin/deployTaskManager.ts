/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import algosdk, { Transaction } from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import getAlgod from '../scripts/algo/getAlgod';
import { BiatecTaskManagerClient } from '../../contracts/clients/BiatecTaskManagerClient';

/**
 * This script deploys the task manager
 */
const app = async () => {
  algokit.Config.configure({ populateAppCallResources: true });

  try {
    if (!process.env.signer) throw Error('Env variable signer is missing');
    const appFromEnv = parseInt(process.env.taskManagerAppId ?? '0', 10);
    const signerAccount = algosdk.mnemonicToSecretKey(process.env.signer ?? '');
    const signer = {
      addr: signerAccount.addr,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return txnGroup.map((tx) => tx.signTxn(signerAccount.sk));
      },
    };
    const env = process.env.env ?? 'testnet-v1.0';
    let feeAssetId = 0;
    if (env === 'mainnet-v1.0') {
      feeAssetId = 1241944285;
    } else if (env === 'testnet-v1.0') {
      feeAssetId = 450822081;
    } else if (env === 'voitest-v1') {
      feeAssetId = 26174498;
    }

    const algod = getAlgod(env);

    const client = new BiatecTaskManagerClient(
      {
        id: appFromEnv,
        resolveBy: 'id',
        sender: signer,
      },
      algod
    );

    if (appFromEnv === 0) {
      console.log('deploying new app');
      await client.create.createApplication({});
      const ref = await client.appClient.getAppReference();
      console.log('app deployed to', ref.appId);
      const suggestedParams = await algod.getTransactionParams().do();
      await client.bootstrap(
        {
          feeAssetId,
          txBaseDeposit: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            amount: 1_000_000,
            from: signer.addr,
            to: ref.appAddress,
            suggestedParams,
          }),
        },
        {
          sendParams: {
            fee: algokit.microAlgos(2000),
          },
        }
      );
      console.log('done');
    } else {
      console.log(`updating app ${appFromEnv}`);
      await client.update.updateApplication({
        version: 'BIATEC-CRON-POOL-01-01-01',
      });
      console.log('done');
    }
  } catch (e) {
    console.error('fatal: ', e);
  }
};

app();
