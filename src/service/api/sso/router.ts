import express from 'express';
import GoogleRouter from './google/router.js';

const SSORouter = express.Router();

SSORouter.use("/google", GoogleRouter);

export default SSORouter;   