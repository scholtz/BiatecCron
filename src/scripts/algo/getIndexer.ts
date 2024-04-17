import algosdk from 'algosdk';

const getIndexer = (env: string): algosdk.Indexer => {
  switch (env) {
    case 'mainnet-v1.0':
      return new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '443');
    case 'testnet-v1.0':
      return new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '443');
    case 'voitest-v1':
      return new algosdk.Indexer('', 'https://testnet-idx.voi.nodly.io', '443');
    case 'localhost':
    default:
      return new algosdk.Indexer(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'http://localhost',
        '8980'
      );
  }
};
export default getIndexer;
