import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createTaskSchema,
  idParamSchema,
  taskQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/task.schema';

const router = Router();

// Every task route requires a valid token. Ownership is enforced again in the
// service layer, so an authenticated user still cannot reach another's tasks.
router.use(authenticate, requireRole('STUDENT', 'ADMIN'));

router.get('/', validate(taskQuerySchema, 'query'), taskController.listTasks);
router.get('/summary', taskController.getSummary);
router.post('/', validate(createTaskSchema), taskController.createTask);

router.get('/:id', validate(idParamSchema, 'params'), taskController.getTask);

router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateTaskSchema),
  taskController.updateTask,
);

router.patch(
  '/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus,
);

router.delete('/:id', validate(idParamSchema, 'params'), taskController.deleteTask);

export default router;
