import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    token: string | undefined;
  };
}
const scBalanceV1 = (input: IInput, buildContent: IBuildContent) => {
  const defineVar = buildContent?.variables[input.inputs.var] === undefined ? 'let ' : '';
  // eslint-disable-next-line no-param-reassign
  buildContent.variables[input.inputs.var] = input.inputs.var;
  if (input.inputs.token === '0') {
    return `${defineVar}${input.inputs.var} = globals.currentApplicationAddress.balance;`;
  }
  if (defineVar) {
    return `${defineVar}${input.inputs.var} = 0; if(input.inputs.token === 0){${input.inputs.var} = globals.currentApplicationAddress.balance;}else{${input.inputs.var} = globals.currentApplicationAddress.assetBalance(AssetID.fromUint64())}`;
  }
  return `if(input.inputs.token === 0){${input.inputs.var} = globals.currentApplicationAddress.balance;}else{${input.inputs.var} = globals.currentApplicationAddress.assetBalance(AssetID.fromUint64())}`;
};
export default scBalanceV1;
