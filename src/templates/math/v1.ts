interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    formula: string;
  };
}
const mathV1 = (input: IInput) => {
  return `${input.inputs.var} = ${input.inputs.formula};`;
};
export default mathV1;
