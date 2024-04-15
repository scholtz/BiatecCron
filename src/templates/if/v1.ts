// eslint-disable-next-line import/no-cycle
import IBuildContent from '../../interface/IBuildContent';
import ITask from '../../interface/ITask';
// eslint-disable-next-line import/no-cycle
import { taskRenderer } from '../../scripts/task/taskRenderer';

interface IInput {
  task: string;
  diplayName: string;
  inputs: {
    var: string;
    condition: string;
    ifTrue: ITask[];
    ifFalse: ITask[] | undefined;
  };
}
const ifV1 = (input: IInput, buildContent: IBuildContent) => {
  if (!input.inputs.ifFalse || input.inputs.ifFalse.length === 0) {
    return `// ifV1
    if(${input.inputs.condition}){
  ${taskRenderer(input.inputs.ifTrue, buildContent)}
}`;
  }
  return `// ifV1
  if(${input.inputs.condition}){
  ${taskRenderer(input.inputs.ifTrue, buildContent)}
}else{
  ${taskRenderer(input.inputs.ifFalse, buildContent)}
}`;
};
export default ifV1;
