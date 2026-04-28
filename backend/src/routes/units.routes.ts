import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as unitsController from '../controllers/units.controller';

const router = Router();

router.use(authenticate);

router.get('/', unitsController.list);
router.get('/:id', unitsController.get);

router.post('/', requireRoles('ADMIN', 'MANAGER'), auditLog, unitsController.create);
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, unitsController.update);
router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, unitsController.remove);

export default router;
