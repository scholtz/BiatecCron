interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    contract: number | bigint | string;
    token: number | bigint | string;
    var: string;
  };
}
const folksOracleV1 = (input: IInput) => {
  //  return `const ${input.inputs.var} = btoi((AppID.fromUint64(${input.inputs.contract}).globalState(itob(${input.inputs.token})) as bytes).substring(0, 8));`;
  let ret = '';
  ret += `const price = AppID.fromUint64(${input.inputs.contract}).globalState(itob(${input.inputs.token})) as bytes;\n`;
  ret += `const ${input.inputs.var} = btoi(price.substring(0, 8));`;
  return ret;
};
export default folksOracleV1;
