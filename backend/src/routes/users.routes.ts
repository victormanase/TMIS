import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as usersController from '../controllers/users.controller';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'), auditLog);

router.get('/', usersController.list);
router.post('/', usersController.create);
router.get('/:id', usersController.get);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.remove);
router.patch('/:id/toggle-active', usersController.toggleActive);

export default router;
