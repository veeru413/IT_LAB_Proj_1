import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { adminCreateTaskSchema, adminStudentQuerySchema } from '../schemas/admin.schema';
import { adminTaskQuerySchema, idParamSchema } from '../schemas/task.schema';

const router = Router();

/**
 * Router-level guard: authenticate first, then require the ADMIN role.
 * Any student token hitting these paths gets 403 Forbidden - hiding the links
 * in React is a UX nicety, this is the actual control.
 */
router.use(authenticate, requireAdmin);

router.get('/statistics', adminController.getStatistics);

router.get('/students', validate(adminStudentQuerySchema, 'query'), adminController.listStudents);
router.get('/students/:id', validate(idParamSchema, 'params'), adminController.getStudent);

router.get('/tasks', validate(adminTaskQuerySchema, 'query'), adminController.listAllTasks);
router.post('/tasks', validate(adminCreateTaskSchema), adminController.createAssignment);

export default router;
