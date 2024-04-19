/* eslint-disable no-restricted-syntax */
import algosdk from 'algosdk';

const countInnerTxs = (result: algosdk.modelsv2.PendingTransactionResponse) => {
  let ret = 1;
  if (result?.innerTxns) {
    for (const innerTx of result.innerTxns) {
      ret += countInnerTxs(innerTx);
    }
  }
  return ret;
};
const simulateAndCountTxs = async (
  txs: algosdk.Transaction[],
  algod: algosdk.Algodv2,
  signer: algosdk.Account
): Promise<number> => {
  let txCount = 0;
  const signed = txs.map((tx) => tx.signTxn(signer.sk));
  const simulate = await algod.simulateRawTransactions(signed).do();
  for (const txGroup of simulate.txnGroups) {
    for (const result of txGroup.txnResults) {
      txCount += countInnerTxs(result.txnResult);
    }
  }
  return txCount;
};

export default simulateAndCountTxs;
