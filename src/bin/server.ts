/* eslint-disable import/no-extraneous-dependencies */

import express from 'express';
import * as bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import { rateLimit } from 'express-rate-limit';
import winston from 'winston';
import expressWinston from 'express-winston';
import { routes } from '../routes';
import swaggerOutput from '../swagger/swagger_output.json';
import registerDefaultTasks from '../scripts/task/registerDefaultTasks';

registerDefaultTasks();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60, // Limit each IP to 100 requests per `window`
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.text({
    type: [
      'application/yaml',
      'application/x-yaml',
      'application/yml',
      'application/x-yml',
      'text/yaml',
      'text/yml',
      'text/x-yaml',
      'text/x-yml',
    ],
  })
);

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: 'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  })
);
app.use(limiter);

app.all('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

app.use('/', routes);

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerOutput));

app.listen(8080, () => {
  console.log('Server started at port 8080');
});
