const getPoolManagerApp = (env: string) => {
  switch (env) {
    case 'mainnet-v1.0':
      return 1765620242;
    case 'testnet-v1.0':
      return 643872805;
    case 'voitest-v1':
      return 40433700;
    case 'sandnet-v1':
    default:
      return 1114;
  }
};
export default getPoolManagerApp;
