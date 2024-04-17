/* eslint-disable @typescript-eslint/no-explicit-any */
import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    contract: string;
    sendToken: string;
    sendAmount: string;
    receiveToken: string;
    receiveAmountMin: string;
  };
}
function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}
// eslint-disable-next-line no-unused-vars
const pactSwapV1 = (input: IInput, buildContent: IBuildContent) => {
  let ret = '// pactSwapV1';
  if (isNumeric(input.inputs.sendToken)) {
    if (Number(input.inputs.sendToken) > 0) {
      ret += `\nthis.pendingGroup.addAssetTransfer({isFirstTxn:true,fee:0,assetReceiver:AppID.fromUint64(${input.inputs.contract}).address,xferAsset:AssetID.fromUint64(${input.inputs.sendToken}),assetAmount:${input.inputs.sendAmount}});`;
    } else {
      ret += `\nthis.pendingGroup.addPayment({isFirstTxn:true,fee:0,receiver:AppID.fromUint64(${input.inputs.contract}).address,amount:${input.inputs.sendAmount}});`;
    }
  } else {
    ret += `\nif(${input.inputs.sendToken} === 0){
      this.pendingGroup.addPayment({isFirstTxn:true,fee:0,receiver:AppID.fromUint64(${input.inputs.contract}).address,amount:${input.inputs.sendAmount}});
    }else{
      this.pendingGroup.addAssetTransfer({isFirstTxn:true,assetReceiver:AppID.fromUint64(${input.inputs.contract}).address,xferAsset:AssetID.fromUint64(${input.inputs.sendToken}),assetAmount:${input.inputs.sendAmount}});
    }`;
  }

  return `${ret}
  this.pendingGroup.addAppCall({
    applicationID: AppID.fromUint64(${input.inputs.contract}),
    onCompletion: OnCompletion.NoOp,
    fee: 0,
    applicationArgs: ['SWAP', itob(${input.inputs.receiveAmountMin})],
    assets: [AssetID.fromUint64(${input.inputs.sendToken}), AssetID.fromUint64(${input.inputs.receiveToken})]
  });
  this.pendingGroup.submit()
  `;
};
export default pactSwapV1;
