import algosdk from 'algosdk';

const getBoxReferenceUser = (appPoolId: number, userAddress: algosdk.Address) => {
  return {
    appIndex: appPoolId,
    name: new Uint8Array(Buffer.concat([Buffer.from('u', 'ascii'), Buffer.from(userAddress.publicKey)])),
  };
};
export default getBoxReferenceUser;
