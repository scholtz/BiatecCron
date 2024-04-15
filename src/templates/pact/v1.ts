import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    contract: string;
    token: string;
    amount: string;
    minAssetB: string;
  };
}
// eslint-disable-next-line no-unused-vars
const pactSwapV1 = (input: IInput, buildContent: IBuildContent) => {
  return `
  // pactSwapV1
  if(AssetID.fromUint64(${input.inputs.token ?? 0}).id === 0){
    sendPayment({receiver:AppID.fromUint64(${input.inputs.contract}).address,amount:${input.inputs.amount}});
  }else{
    sendAssetTransfer({assetReceiver:AppID.fromUint64(${input.inputs.contract}).address,xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}});
  }
  sendAppCall({
    applicationID: AppID.fromUint64(${input.inputs.contract}),
    onCompletion: OnCompletion.NoOp,
    fee: 0,
    applicationArgs: ['SWAP', itob(${input.inputs.amount})],
  });
  `;
};
export default pactSwapV1;
