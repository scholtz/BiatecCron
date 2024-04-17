/* eslint-disable @typescript-eslint/no-explicit-any */
import { isNumberObject } from 'util/types';
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
function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}
// eslint-disable-next-line no-unused-vars
const pactSwapV1 = (input: IInput, buildContent: IBuildContent) => {
  let ret = '// pactSwapV1';
  if (isNumeric(input.inputs.token)) {
    if (input.inputs.token) {
      ret += `\nsendAssetTransfer({assetReceiver:AppID.fromUint64(${input.inputs.contract}).address,xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}});`;
    } else {
      ret += `\nsendPayment({receiver:AppID.fromUint64(${input.inputs.contract}).address,amount:${input.inputs.amount}});`;
    }
  } else {
    ret += `\nif(${input.inputs.token} === 0){
      sendPayment({receiver:AppID.fromUint64(${input.inputs.contract}).address,amount:${input.inputs.amount}});
    }else{
      sendAssetTransfer({assetReceiver:AppID.fromUint64(${input.inputs.contract}).address,xferAsset:AssetID.fromUint64(${input.inputs.token}),assetAmount:${input.inputs.amount}});
    }`;
  }
  return `${ret}
  sendAppCall({
    applicationID: AppID.fromUint64(${input.inputs.contract}),
    onCompletion: OnCompletion.NoOp,
    fee: 0,
    applicationArgs: ['SWAP', itob(${input.inputs.amount})],
  });
  `;
};
export default pactSwapV1;
