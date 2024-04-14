/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import IBuildContent from '../../interface/IBuildContent';
import ITask from '../../interface/ITask';

interface ITaskDictionary {
  [key: string]: (task: ITask, buildContent: IBuildContent) => string;
}
const tasksDictionary: ITaskDictionary = {};

export const taskRegister = (name: string, callback: (task: ITask) => string) => {
  tasksDictionary[name] = callback;
  console.log(`task ${name} registered`);
};

export const taskRenderer = (tasks: ITask[], buildContent: IBuildContent) => {
  let ret = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasks) {
    if (!tasksDictionary[task.task]) {
      console.error(`Task ${task.task} not found`);
    } else {
      ret += `${tasksDictionary[task.task](task as any, buildContent)}\n`;
    }
  }
  return ret;
};
