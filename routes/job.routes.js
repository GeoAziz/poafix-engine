import express from 'express';
import * as jobController from '../controllers/job.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authMiddleware, jobController.createJob);
router.patch('/:jobId/status', authMiddleware, jobController.updateJobStatus);
router.get('/provider/jobs', authMiddleware, jobController.getProviderJobs);

export default router;
