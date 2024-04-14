import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    formula: string;
  };
}
const mathV1 = (input: IInput, buildContent: IBuildContent) => {
  const defineVar = buildContent?.variables[input.inputs.var] === undefined ? 'let ' : '';
  // eslint-disable-next-line no-param-reassign
  buildContent.variables[input.inputs.var] = input.inputs.var;
  return `${defineVar}${input.inputs.var} = ${input.inputs.formula};`;
};
export default mathV1;
