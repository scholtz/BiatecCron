import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    type: string | undefined;
    defaultValue: number | bigint | string;
  };
}
const varV1 = (input: IInput, buildContent: IBuildContent) => {
  const defineVar = buildContent?.variables[input.inputs.var] === undefined ? 'let ' : '';
  // eslint-disable-next-line no-param-reassign
  buildContent.variables[input.inputs.var] = input.inputs.var;
  if (input.inputs.type) {
    return `// varV1
    ${defineVar}${input.inputs.var}: ${input.inputs.type} = ${input.inputs.defaultValue};`;
  }
  return `// varV1
  ${defineVar}${input.inputs.var} = ${input.inputs.defaultValue};`;
};
export default varV1;
