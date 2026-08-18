import { Router } from 'express';
import * as examController from '../controllers/exam.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  examQuestionSchema,
  submitExamSchema,
  updateExamQuestionSchema,
} from '../schemas/exam.schema';
import { idParamSchema } from '../schemas/task.schema';

const router = Router();

router.use(authenticate, requireRole('STUDENT'));

router.get('/session', examController.getSession);
router.post('/submit', validate(submitExamSchema), examController.submit);

export default router;

export const examAdminRoutes = Router();

examAdminRoutes.use(authenticate, requireRole('ADMIN', 'EXAMINER'));

examAdminRoutes.get('/dashboard', examController.getDashboard);
examAdminRoutes.get('/questions', examController.listQuestions);
examAdminRoutes.post('/questions', validate(examQuestionSchema), examController.createQuestion);
examAdminRoutes.put(
  '/questions/:id',
  validate(idParamSchema, 'params'),
  validate(updateExamQuestionSchema),
  examController.updateQuestion,
);
examAdminRoutes.delete('/questions/:id', validate(idParamSchema, 'params'), examController.deleteQuestion);
