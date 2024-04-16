/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
// eslint-disable-next-line import/no-extraneous-dependencies
import { Router, Request as ExpressRequest, Response } from 'express';
import { exec } from 'node:child_process';
import util from 'node:util';
import fs from 'fs';
import algosdk, { AtomicTransactionComposer, Transaction } from 'algosdk';
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account';
// eslint-disable-next-line import/no-extraneous-dependencies
import YAML from 'yaml';
import * as algokit from '@algorandfoundation/algokit-utils';
import ICronJobDocument from '../interface/ICronJobDocument';
import { taskRenderer } from '../scripts/task/taskRenderer';
import sha256 from '../scripts/crypto/sha256';
import IBuildContent from '../interface/IBuildContent';
import getAlgod from '../scripts/algo/getAlgod';
import { BiatecCronJob23d23Client } from '../../data/23d23b32ff78b57a8913be64961ff7b29fed3bd973b46f3556de56f1fbf387be/clients/BiatecCronJob23d23Client';

export const builderRouter = Router();

builderRouter.post('/convertYaml2Json', async (req: ExpressRequest, res: Response) => {
  /*  #swagger.requestBody = {
          required: true,
          content: {
                "application/yaml": {
                    schema: {
                        $ref: "#/components/schemas/ICronJobDocument"
                    }  
                }
            }

  } */
  if (
    !req.is('application/yaml') &&
    !req.is('application/x-yaml') &&
    !req.is('application/yml') &&
    !req.is('application/x-yml') &&
    !req.is('text/yaml') &&
    !req.is('text/yml') &&
    !req.is('text/x-yaml') &&
    !req.is('text/x-yml')
  ) {
    res.status(400).send('Not YAML!');
    return;
  }
  // Do other stuff

  try {
    res.set('content-type', 'application/json');
    res.send(YAML.parse(req.body));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
  }
});
builderRouter.post('/convertJson2Yaml', async (req: ExpressRequest, res: Response) => {
  /*  #swagger.requestBody = {
          required: true,
          content: {
                "application/json": {
                    schema: {
                        $ref: "#/components/schemas/ICronJobDocument"
                    }  
                }
            }

  } */
  try {
    const doc = JSON.parse(JSON.stringify(req.body)) as ICronJobDocument;
    res.set('content-type', 'application/yaml');
    res.send(YAML.stringify(doc));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
  }
});

builderRouter.post('/build/:rebuild', async (req: ExpressRequest, res: Response) => {
  /*  #swagger.requestBody = {
          required: true,
          content: {
                "application/yaml": {
                    schema: {
                        $ref: "#/components/schemas/ICronJobDocument"
                    }  
                },
                "application/json": {
                    schema: {
                        $ref: "#/components/schemas/ICronJobDocument"
                    }  
                }
            }

  } */
  console.log('Build start');
  try {
    if (!fs.existsSync(`data`)) {
      fs.mkdirSync('data');
    }

    console.log('req.params', req.params);
    let doc: ICronJobDocument = {
      schedule: {
        period: 0,
        start: 0,
      },
      tasks: [],
    };
    if (req.is('application/yaml')) {
      doc = YAML.parse(req.body) as ICronJobDocument;
    } else {
      doc = JSON.parse(JSON.stringify(req.body)) as ICronJobDocument;
    }
    const tasksToHash = JSON.stringify(doc.tasks);
    const hash = sha256(tasksToHash);
    if (req.params.rebuild !== '1') {
      if (fs.existsSync(`data/${hash}`) && fs.existsSync(`data/${hash}/status.json`)) {
        const data = fs.readFileSync(`data/${hash}/status.json`);
        res.set('content-type', 'application/json');
        res.send(data.toString('utf-8'));
        return;
      }
    }
    if (!fs.existsSync(`data/${hash}`)) {
      fs.mkdirSync(`data/${hash}`);
      fs.mkdirSync(`data/${hash}/artifacts`);
      fs.mkdirSync(`data/${hash}/clients`);
    }
    fs.writeFileSync(`data/${hash}/input.json`, JSON.stringify(doc));
    fs.writeFileSync(`data/${hash}/input.yaml`, YAML.stringify(doc));
    const hashShort = hash.substring(0, 5);
    fs.writeFileSync(
      `data/${hash}/status.json`,
      JSON.stringify({
        hash,
        hashShort,
        status: 'building',
        statusEndpint: '/v1/file/51603c5716dd7721d303666f583d2c4aa3f5ffd9cee86708b5b405a2e9f1529d/status.json',
        files: {
          'status.json': `/v1/file/${hash}/status.json`,
          'input.json': `/v1/file/${hash}/input.json`,
          'input.yaml': `/v1/file/${hash}/input.yaml`,
        },
      })
    );
    console.log('hash', hash);
    const buildContent: IBuildContent = {
      variables: {},
      objectIter: 1,
    };
    const tealscript = taskRenderer(doc.tasks, buildContent);
    const data = fs.readFileSync('contracts/template.algo.ts').toString('utf-8');
    const outTealscript = data.replace('__SCRIPT__;', tealscript).replace('__SHORT_HASH__', hashShort);

    fs.writeFileSync(`data/${hash}/BiatecCronJob${hashShort}.algo.ts`, outTealscript);
    // promisify exec
    const execPromise = util.promisify(exec);
    fs.writeFileSync(`data/${hash}/stdout.txt`, '');
    fs.writeFileSync(`data/${hash}/stderr.txt`, '');
    let isError = false;

    try {
      // wait for exec to complete
      const { stdout, stderr } = await execPromise(`eslint data/${hash}/ --ext .ts --fix`);
      fs.appendFileSync(`data/${hash}/stdout.txt`, stdout);
      fs.appendFileSync(`data/${hash}/stderr.txt`, stderr);
      isError = !!stderr.trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      fs.appendFileSync(`data/${hash}/stderr.txt`, error.message ?? error);
      isError = true;
    }

    if (!isError) {
      try {
        // wait for exec to complete
        const { stdout, stderr } = await execPromise(
          `npx tealscript --skip-algod data/${hash}/BiatecCronJob${hashShort}.algo.ts data/${hash}/artifacts`
        );
        fs.appendFileSync(`data/${hash}/stdout.txt`, stdout);
        fs.appendFileSync(`data/${hash}/stderr.txt`, stderr);
        isError = !!stderr.trim();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(error);
        fs.appendFileSync(`data/${hash}/stderr.txt`, error.message ?? error);
        isError = true;
      }
    }

    if (!isError) {
      try {
        // wait for exec to complete
        const { stdout, stderr } = await execPromise(
          `algokit generate client data/${hash}/artifacts/ --language typescript  --output data/${hash}/clients/BiatecCronJob${hashShort}Client.ts`
        );
        fs.appendFileSync(`data/${hash}/stdout.txt`, stdout);
        fs.appendFileSync(`data/${hash}/stderr.txt`, stderr);
        isError = !!stderr.trim();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(error);
        fs.appendFileSync(`data/${hash}/stderr.txt`, error.message ?? error);
        isError = true;
      }
    }
    let ret = {};

    if (isError) {
      fs.writeFileSync(
        `data/${hash}/status.json`,
        JSON.stringify(
          (ret = {
            hash,
            hashShort,
            status: 'failed',
            statusEndpint: `/v1/file/${hash}/status.json`,
            files: {
              'status.json': `/v1/file/${hash}/status.json`,
              'input.json': `/v1/file/${hash}/input.json`,
              'input.yaml': `/v1/file/${hash}/input.yaml`,
              'stdout.txt': `/v1/file/${hash}/stdout.txt`,
              'stderr.txt': `/v1/file/${hash}/stderr.txt`,
              'BiatecCronJob.algo.ts': `/v1/file/${hash}/BiatecCronJob${hashShort}.algo.ts`,
            },
          })
        )
      );
      res.set('content-type', 'application/json');
      res.send(ret);
    } else {
      fs.writeFileSync(
        `data/${hash}/status.json`,
        JSON.stringify(
          (ret = {
            hash,
            hashShort,
            status: 'success',
            statusEndpint: `/v1/file/${hash}/status.json`,
            client: `BiatecCronJob${hashShort}Client.ts`,
            files: {
              'status.json': `/v1/file/${hash}/status.json`,
              'input.json': `/v1/file/${hash}/input.json`,
              'input.yaml': `/v1/file/${hash}/input.yaml`,
              'stdout.txt': `/v1/file/${hash}/stdout.txt`,
              'BiatecCronJobClient.ts': `/v1/file/${hash}/BiatecCronJob${hashShort}Client.ts`,
              'BiatecCronJob.algo.ts': `/v1/file/${hash}/BiatecCronJob${hashShort}.algo.ts`,
              'BiatecCronJob.approval.teal': `/v1/file/${hash}/BiatecCronJob${hashShort}.approval.teal`,
              'BiatecCronJob.clear.teal': `/v1/file/${hash}/BiatecCronJob${hashShort}.clear.teal`,
              'BiatecCronJob.arc4.json': `/v1/file/${hash}/BiatecCronJob${hashShort}.arc4.json`,
              'BiatecCronJob.arc32.json': `/v1/file/${hash}/BiatecCronJob${hashShort}.arc32.json`,
              'BiatecCronJob.src_map.json': `/v1/file/${hash}/BiatecCronJob${hashShort}.src_map.json`,
            },
          })
        )
      );
      res.set('content-type', 'application/json');
      res.send(ret);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
  }
});
const algoTsFile = /^[a-zA-Z0-9]*\.algo\.ts$/;
const clientFile = /^[a-zA-Z0-9]*Client\.ts$/;
const tealApprovalFile = /^[a-zA-Z0-9]*.approval\.teal$/;
const tealClearFile = /^[a-zA-Z0-9]*.clear\.teal$/;
const arc4File = /^[a-zA-Z0-9]*.arc4\.json$/;
const arc32File = /^[a-zA-Z0-9]*.arc32\.json$/;
const srcMapFile = /^[a-zA-Z0-9]*.src_map\.json$/;

builderRouter.get(`/file/:id/:fileName`, async (req: ExpressRequest, res: Response) => {
  try {
    let file = '';
    switch (req.params.fileName) {
      case 'stdout.txt':
      case 'stderr.txt':
        res.set('content-type', 'text/plain');
        file = `data/${req.params.id}/${req.params.fileName}`;
        break;
      case 'input.json':
      case 'status.json':
        res.set('content-type', 'application/json');
        file = `data/${req.params.id}/${req.params.fileName}`;
        break;
      case 'input.yaml':
        res.set('content-type', 'application/yaml');
        file = `data/${req.params.id}/${req.params.fileName}`;
        break;
      default:
        if (algoTsFile.test(req.params.fileName)) {
          res.set('content-type', 'application/typescript');
          file = `data/${req.params.id}/${req.params.fileName}`;
          break;
        } else if (clientFile.test(req.params.fileName)) {
          res.set('content-type', 'application/typescript');
          file = `data/${req.params.id}/clients/${req.params.fileName}`;
          break;
        } else if (tealApprovalFile.test(req.params.fileName)) {
          res.set('content-type', 'application/tealscript');
          file = `data/${req.params.id}/artifacts/${req.params.fileName}`;
          break;
        } else if (tealClearFile.test(req.params.fileName)) {
          res.set('content-type', 'application/tealscript');
          file = `data/${req.params.id}/artifacts/${req.params.fileName}`;
          break;
        } else if (arc4File.test(req.params.fileName)) {
          res.set('content-type', 'application/json');
          file = `data/${req.params.id}/artifacts/${req.params.fileName}`;
          break;
        } else if (arc32File.test(req.params.fileName)) {
          res.set('content-type', 'application/json');
          file = `data/${req.params.id}/artifacts/${req.params.fileName}`;
          break;
        } else if (srcMapFile.test(req.params.fileName)) {
          res.set('content-type', 'application/json');
          file = `data/${req.params.id}/artifacts/${req.params.fileName}`;
          break;
        } else {
          res.status(500).send(`Not allowed file`);
          return;
        }
    }
    const fileData = fs.readFileSync(file);

    res.send(fileData.toString('utf-8'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
  }
});

builderRouter.post(`/tx/:id/:env/:signer/:appId/:method/:fileName`, async (req: ExpressRequest, res: Response) => {
  try {
    if (clientFile.test(req.params.fileName)) {
      res.set('content-type', 'application/typescript');
      /*
      51603c5716dd7721d303666f583d2c4aa3f5ffd9cee86708b5b405a2e9f1529d
      AWALLETCPHQPJGCZ6AHLIFPHWBHUEHQ7VBYJVVGQRRY4MEIGWUBKCQYP4Y
      exec
      BiatecCronJob51603Client.ts
      */
      // eslint-disable-next-line import/no-dynamic-require, global-require, no-shadow

      const algod = getAlgod(req.params.env);
      const signer: TransactionSignerAccount = {
        addr: req.params.signer,
        // eslint-disable-next-line no-unused-vars
        signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
          return [new Uint8Array()];
        },
      };
      const appId = parseInt(req.params.appId ?? '0', 10);

      const file = `../../data/${req.params.id}/clients/${req.params.fileName}`;
      const clientFileImport = await import(file);
      const clientName = req.params.fileName.replace('.ts', '');
      const client = new clientFileImport[clientName](
        {
          sender: signer,
          resolveBy: 'id',
          id: appId,
        },
        algod
      );
      // const client = new BiatecCronJob23d23Client(
      //   {
      //     sender: signer,
      //     resolveBy: 'id',
      //     id: 0,
      //   },
      //   algod
      // );
      console.log('client', client);
      const params = req.body;
      params.id = req.params.id;
      const suggestedParams = await algod.getTransactionParams().do();
      if (req.params.method === 'bootstrap') {
        params.txBaseDeposit = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: 1_000_000,
          from: req.params.signer,
          to: algosdk.getApplicationAddress(appId),
          suggestedParams: { ...suggestedParams, fee: 0 },
        });
      }
      console.log(`building Method:${req.params.method} Params:${JSON.stringify(params)}`);

      let feeToken = 0;
      if (req.params.env === 'mainnet-v1.0') {
        feeToken = 1241944285; // asa.gold Mainnet
      } else if (req.params.env === 'testnet-v1.0') {
        feeToken = 450822081; // asa.gold Testnet
      } else if (req.params.env === 'voitest-v1') {
        feeToken = 26174498; // asa.gold voitest
      }

      const compose = client.compose()[req.params.method](params, {
        // const compose = client.compose().bootstrap(params, {
        sender: signer,
        accounts: ['SCPSTM7HIYCTAXLFFGSOKQRW24RKSPIEWSYSG52PKR2LESGRYTUGNBS7S4'],
        assets: [feeToken],
        sendParams: {
          fee: algokit.microAlgos(3000),
          maxFee: algokit.microAlgos(4000),
        },
      });
      const atc = await compose.atc();
      res.set('content-type', 'application/json');
      const ret = atc.buildGroup().map((tx: any) => {
        console.log('tx', tx.txn);
        return Buffer.from(algosdk.encodeUnsignedTransaction(tx.txn)).toString('base64');
      });
      res.send(JSON.stringify(ret));
      return;
    }

    res.send('ok');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
    console.error(e);
  }
});

builderRouter.get(`/tx-create/:id/:env/:signer/:fileName`, async (req: ExpressRequest, res: Response) => {
  try {
    if (!clientFile.test(req.params.fileName)) {
      res.status(500).send(`File not found`);
      return;
    }

    res.set('content-type', 'application/typescript');
    /*
      51603c5716dd7721d303666f583d2c4aa3f5ffd9cee86708b5b405a2e9f1529d
      AWALLETCPHQPJGCZ6AHLIFPHWBHUEHQ7VBYJVVGQRRY4MEIGWUBKCQYP4Y
      exec
      BiatecCronJob51603Client.ts
      */
    const file = `../../data/${req.params.id}/clients/${req.params.fileName}`;
    // eslint-disable-next-line import/no-dynamic-require, global-require, no-shadow
    const clientFileImport = await import(file);
    const algod = getAlgod(req.params.env);
    const signer: TransactionSignerAccount = {
      addr: req.params.signer,
      // eslint-disable-next-line no-unused-vars
      signer: async (txnGroup: Transaction[], indexesToSign: number[]) => {
        return [new Uint8Array()];
      },
    };
    console.log('signer', signer);
    const clientName = req.params.fileName.replace('.ts', '');
    const client = new clientFileImport[clientName](
      {
        sender: signer,
        resolveBy: 'id',
        id: parseInt('0', 10),
      },
      algod
    );
    // const client = new BiatecCronJob72ed2Client(
    //   {
    //     sender: signer,
    //     resolveBy: 'id',
    //     id: parseInt('0', 10),
    //   },
    //   algod
    // );
    console.log('client', client);
    const atc = new AtomicTransactionComposer();
    await client.create.createApplication(
      {},
      {
        sender: signer,
        // updatable: true,
        // deletable: true,
        sendParams: {
          fee: algokit.microAlgos(1000),
          atc,
        },
      }
    );

    res.set('content-type', 'application/json');
    const ret = atc.buildGroup().map((tx: any) => {
      console.log('tx', tx.txn);
      return Buffer.from(algosdk.encodeUnsignedTransaction(tx.txn)).toString('base64');
    });
    res.send(JSON.stringify(ret));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    res.status(500).send(`Error occured ${e.message ?? e}`);
    console.error(e);
  }
});
