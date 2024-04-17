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
  if (Number.isInteger(input.inputs.token)) {
    if (input.inputs.token) {
      ret += `\nsendAssetTransfer({assetReceiver:addr(${input.inputs.receiver}),xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}${addFeeStr}${addNoteStr}});`;
    } else {
      ret += `\nsendPayment({receiver:addr(${input.inputs.receiver}),amount:${input.inputs.amount}${addFeeStr}${addNoteStr}});`;
    }
  } else {
    ret += `\nif(${input.inputs.token} === 0){
      sendPayment({receiver:addr(${input.inputs.receiver}),amount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
    }else{
      sendAssetTransfer({assetReceiver:addr(${input.inputs.receiver}),xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
    }`;
  }
  return ret;
};
export default payV1;
