import algosdk from 'algosdk';

const getBoxReferenceApp = (appPoolId: number, taskAppId: number) => {
  return {
    appIndex: appPoolId,
    name: new Uint8Array(Buffer.concat([Buffer.from('t', 'ascii'), algosdk.bigIntToBytes(taskAppId, 8)])),
  };
};
export default getBoxReferenceApp;
