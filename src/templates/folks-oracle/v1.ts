import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    contract: number | bigint | string;
    token: number | bigint | string;
    var: string;
  };
}
const folksOracleV1 = (input: IInput, buildContent: IBuildContent) => {
  const defineVar = buildContent?.variables[input.inputs.var] === undefined ? 'let ' : '';
  // eslint-disable-next-line no-param-reassign
  buildContent.variables[input.inputs.var] = input.inputs.var;
  const tmpVar = `price${buildContent.objectIter}`;
  // eslint-disable-next-line no-param-reassign
  buildContent.objectIter += 1;
  //  return `const ${input.inputs.var} = btoi((AppID.fromUint64(${input.inputs.contract}).globalState(itob(${input.inputs.token})) as bytes).substring(0, 8));`;
  let ret = '// folksOracleV1';
  ret += `\nconst ${tmpVar} = AppID.fromUint64(${input.inputs.contract}).globalState(itob(${input.inputs.token})) as bytes;\n`;
  ret += `${defineVar}${input.inputs.var} = btoi(${tmpVar}.substring(0, 8));`;
  return ret;
};
export default folksOracleV1;
