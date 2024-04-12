// eslint-disable-next-line import/no-extraneous-dependencies
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    version: 'v1.0.0',
    title: 'Biatec scheduler Algorand smart contract builder',
    description:
      'Smart contract builder allows users to define tasks, build smart contract, and setup the scheduler\n\n' +
      'Links:\n' +
      '* [Source code](https://github.com/scholtz/BiatecCron/)\n' +
      '* [https://api-scheduler.biatec.io](https://api-scheduler.biatec.io)\n',
  },
  servers: [
    {
      url: 'https://api-scheduler.biatec.io',
      description: 'Web deployment',
    },
    {
      url: 'http://localhost:8080',
      description: 'Localhost',
    },
  ],
  components: {
    schemas: {
      ICronJobDocument: {
        schedule: {
          period: 3600,
          offset: 0,
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
      },
    },
  },
};

const outputFile = '../swagger/swagger_output.json';
const endpointsFiles = ['./src/routes/index.ts'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
