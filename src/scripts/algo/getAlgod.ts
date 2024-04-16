import algosdk from 'algosdk';

const getAlgod = (env: string): algosdk.Algodv2 => {
  switch (env) {
    case 'mainnet-v1.0':
      return new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', '443');
    case 'testnet-v1.0':
      return new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '443');
    case 'voitest-v1':
      return new algosdk.Algodv2('', 'https://testnet-api.voi.nodly.io', '443');
    case 'localhost':
    default:
      return new algosdk.Algodv2(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'http://localhost',
        '4001'
      );
  }
};
export default getAlgod;
