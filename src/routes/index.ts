// eslint-disable-next-line import/no-extraneous-dependencies
import express from 'express';
import { builderRouter } from './builder';

export const routes = express.Router();
routes.use('/v1', builderRouter);
