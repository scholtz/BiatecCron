import IBuildContent from '../../interface/IBuildContent';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    condition: string;
    error: string;
  };
}
// eslint-disable-next-line no-unused-vars
const assertV1 = (input: IInput, buildContent: IBuildContent) => {
  return `assert(${input.inputs.condition},${input.inputs.error});`;
};
export default assertV1;
