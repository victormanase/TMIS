import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as tenantsController from '../controllers/tenants.controller';

const router = Router();

router.use(authenticate);

router.get('/', tenantsController.list);
router.get('/:id', tenantsController.get);

router.post('/', requireRoles('ADMIN', 'MANAGER'), auditLog, tenantsController.create);
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, tenantsController.update);
router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, tenantsController.remove);

export default router;
