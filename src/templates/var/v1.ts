interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    type: string | undefined;
    defaultValue: number | bigint | string;
  };
}
const varV1 = (input: IInput) => {
  if (input.inputs.type) {
    return `let ${input.inputs.var}: ${input.inputs.type} = ${input.inputs.defaultValue};`;
  }
  return `let ${input.inputs.var} = ${input.inputs.defaultValue};`;
};
export default varV1;
