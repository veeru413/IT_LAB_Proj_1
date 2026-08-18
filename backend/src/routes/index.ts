import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import { examAdminRoutes } from './exam.routes';
import taskRoutes from './task.routes';
import examRoutes from './exam.routes';
import { sendSuccess } from '../utils/response';

const router = Router();

/** Lightweight liveness probe - useful when demoing that the API is up. */
router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'exam-system-api',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/exam', examRoutes);
router.use('/tasks', taskRoutes);
router.use('/admin/exam', examAdminRoutes);
router.use('/admin', adminRoutes);

export default router;
