// server/routes/index.ts
import express from 'express';
import { healthCheck, ping } from '../controllers/healthController';

const _router = express.Router();

// Health check routes
router.get('/health', healthCheck);
router.get('/ping', ping);

export default router;
