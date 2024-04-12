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
const payV1 = (input: IInput) => {
  let addFeeStr = '';
  if (input.inputs.fee) {
    addFeeStr = `,fee:${input.inputs.fee}`;
  }
  let addNoteStr = '';
  if (input.inputs.note) {
    addNoteStr = `,fee:${input.inputs.note}`;
  }
  return `if(AssetID.fromUint64(${input.inputs.token ?? 0}).id === 0){
  sendPayment({receiver:addr(${input.inputs.receiver}),amount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
}else{
  sendAssetTransfer({assetReceiver:addr(${input.inputs.receiver}),xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}${addFeeStr}${addNoteStr}});
}`;
};
export default payV1;
