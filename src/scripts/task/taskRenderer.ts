/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ITask from '../../interface/ITask';

interface ITaskDictionary {
  [key: string]: (task: ITask) => string;
}
const tasksDictionary: ITaskDictionary = {};

export const taskRegister = (name: string, callback: (task: ITask) => string) => {
  tasksDictionary[name] = callback;
  console.log(`task ${name} registered`);
};

export const taskRenderer = (tasks: ITask[]) => {
  let ret = '';
  // eslint-disable-next-line no-restricted-syntax
  for (const task of tasks) {
    if (!tasksDictionary[task.task]) {
      console.error(`Task ${task.task} not found`);
    } else {
      ret += `${tasksDictionary[task.task](task as any)}\n`;
    }
  }
  return ret;
};
