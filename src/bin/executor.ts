import { taskRenderer } from '../scripts/task/taskRenderer';

/* eslint-disable no-console */
const app = async () => {
  console.log(`${new Date()} App started`);

  const input = {
    schedule: {
      period: 3600,
      start: 0,
    },
    tasks: [
      {
        task: 'var@v1',
        displayName: 'Oracle price',
        inputs: {
          var: 'var1',
          type: 'uint64',
          defaultValue: 0,
        },
      },
      {
        task: 'var@v1',
        displayName: 'Oracle price 2x',
        inputs: {
          var: 'var2',
          type: 'uint64',
          defaultValue: '0',
        },
      },
      {
        task: 'folks-oracle@v1',
        displayName: 'Set oracle price to variable',
        inputs: {
          contract: 123,
          token: 1234,
          var: 'var1',
        },
      },
      {
        task: 'math@v1',
        displayName: 'Multiply price',
        inputs: {
          formula: '2 * var1',
          var: 'var2',
        },
      },
      {
        task: 'if@v1',
        displayName: 'Check if ',
        inputs: {
          condition: '2 * var1 > var2',
          ifTrue: [
            {
              task: 'pay@v1',
              displayName: 'Pay to X',
              inputs: {
                receiver: 'SCH',
                amount: 'var1',
                token: 1234,
              },
            },
          ],
          ifFalse: [
            {
              task: 'pay@v1',
              displayName: 'Pay to X',
              inputs: {
                receiver: 'SCH',
                amount: 123,
                token: 1234,
              },
            },
          ],
        },
      },
    ],
  };
  console.log(JSON.stringify(input));
  const out = taskRenderer(input.tasks);

  console.log(out);
};

app();
