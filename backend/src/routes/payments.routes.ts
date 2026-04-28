import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as paymentsController from '../controllers/payments.controller';

const router = Router();

router.use(authenticate, requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'));

router.get('/', paymentsController.list);
router.get('/tenant/:tenantId', paymentsController.tenantLedger);
router.get('/:id', paymentsController.get);

router.post('/', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), auditLog, paymentsController.create);

export default router;
