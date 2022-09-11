import express from 'express';
import authRoutes from './authRoutes.js';
import appRoutes from './appRoutes.js';

const router = express.Router();
router.use(authRoutes);
router.use(appRoutes);
export default router;