import express from 'express';
import { home, inTransaction, outTransaction } from '../controllers/appControllers.js';
import authorizationMiddleware from '../middlewares/authorizationMiddleware.js';
import { transactionMiddleware } from '../middlewares/transactionMiddleware.js';

const appRoutes = express.Router();
appRoutes.get('/home', authorizationMiddleware, home);
appRoutes.post('/in', authorizationMiddleware, transactionMiddleware, inTransaction);
appRoutes.post('/out', authorizationMiddleware, transactionMiddleware, outTransaction);

export default appRoutes;