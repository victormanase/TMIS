import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as assignmentsController from '../controllers/assignments.controller';

const router = Router();

router.use(authenticate);

router.get('/unit/:unitId', assignmentsController.getByUnit);
router.post('/', requireRoles('ADMIN', 'MANAGER'), auditLog, assignmentsController.assign);
router.patch('/:id/checkout', requireRoles('ADMIN', 'MANAGER'), auditLog, assignmentsController.checkout);

export default router;
