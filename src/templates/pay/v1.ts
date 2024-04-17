/* eslint-disable @typescript-eslint/no-explicit-any */
import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    receiver: string;
    amount: string;
    token: string | undefined;
    note: string | undefined;
    fee: string | undefined;
  };
}

function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}
// eslint-disable-next-line no-unused-vars
const payV1 = (input: IInput, buildContent: IBuildContent) => {
  let addFeeStr = '';
  if (input.inputs.fee) {
    addFeeStr = `,fee:${input.inputs.fee}`;
  }
  let addNoteStr = '';
  if (input.inputs.note) {
    addNoteStr = `,fee:${input.inputs.note}`;
  }
  let ret = '// payV1';
  if (isNumeric(input.inputs.token)) {
    if (input.inputs.token) {
      ret += `\nthis.pendingGroup.addAssetTransfer({isFirstTxn: true,assetReceiver:addr(${input.inputs.receiver}),xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}${addFeeStr}${addNoteStr}});`;
    } else {
      ret += `\nthis.pendingGroup.addPayment({isFirstTxn: true,receiver:addr(${input.inputs.receiver}),amount:${input.inputs.amount}${addFeeStr}${addNoteStr}});`;
    }
  } else {
    ret += `\nif(${input.inputs.token} === 0){
      this.pendingGroup.addPayment({isFirstTxn: true,receiver:addr(${input.inputs.receiver}),amount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
    }else{
      this.pendingGroup.addAssetTransfer({isFirstTxn: true,assetReceiver:addr(${input.inputs.receiver}),xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
    }`;
  }
  ret += '\nthis.pendingGroup.submit();';
  return ret;
};
export default payV1;
