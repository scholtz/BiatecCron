import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    token: string | undefined;
  };
}
function isNumeric(value: any) {
  return /^-?\d+$/.test(value);
}
const scBalanceV1 = (input: IInput, buildContent: IBuildContent) => {
  const defineVar = buildContent?.variables[input.inputs.var] === undefined ? 'let ' : '';
  // eslint-disable-next-line no-param-reassign
  buildContent.variables[input.inputs.var] = input.inputs.var;
  if (isNumeric(input.inputs.token)) {
    if (input.inputs.token) {
      return `
      // scBalanceV1
      ${defineVar}${input.inputs.var} = globals.currentApplicationAddress.assetBalance(AssetID.fromUint64(${input.inputs.token}));`;
    }
    return `
      // scBalanceV1
      ${defineVar}${input.inputs.var} = globals.currentApplicationAddress.balance;`;
  }
  if (defineVar) {
    return `// scBalanceV1
    ${defineVar}${input.inputs.var} = 0; if(${input.inputs.token} === 0){${input.inputs.var} = globals.currentApplicationAddress.balance;}else{${input.inputs.var} = globals.currentApplicationAddress.assetBalance(AssetID.fromUint64(${input.inputs.token}))}`;
  }
  return `// scBalanceV1
  if(${input.inputs.token} === 0){${input.inputs.var} = globals.currentApplicationAddress.balance;}else{${input.inputs.var} = globals.currentApplicationAddress.assetBalance(AssetID.fromUint64(${input.inputs.token}))}`;
};
export default scBalanceV1;
