import algosdk from 'algosdk';
import { ITaskBox } from '../../interface/ITaskBox';

const parseBoxData = (input: Uint8Array): ITaskBox => {
  if (input.length !== 24) {
    throw new Error('Box has wrong length');
  }
  const ret: ITaskBox = {
    funds: Number(algosdk.decodeUint64(input.subarray(0, 8), 'safe')),
    app: Number(algosdk.decodeUint64(input.subarray(8, 16), 'safe')),
    fee: Number(algosdk.decodeUint64(input.subarray(16, 24), 'safe')),
  };
  return ret;
};
export default parseBoxData;
