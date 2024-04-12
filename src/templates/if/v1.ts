// eslint-disable-next-line import/no-cycle
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
const ifV1 = (input: IInput) => {
  if (!input.inputs.ifFalse || input.inputs.ifFalse.length === 0) {
    return `if(${input.inputs.condition}){
  ${taskRenderer(input.inputs.ifTrue)}
}`;
  }
  return `if(${input.inputs.condition}){
  ${taskRenderer(input.inputs.ifTrue)}
}else{
  ${taskRenderer(input.inputs.ifFalse)}
}`;
};
export default ifV1;
