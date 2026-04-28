import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as bookingsController from '../controllers/bookings.controller';

const router = Router();

router.use(authenticate);

router.get('/', bookingsController.list);
router.get('/:id', bookingsController.get);

router.post('/', requireRoles('ADMIN', 'MANAGER'), auditLog, bookingsController.create);
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, bookingsController.update);

export default router;
