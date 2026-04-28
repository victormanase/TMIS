import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { auditLog } from '../middleware/auditLog';
import * as propertiesController from '../controllers/properties.controller';

const router = Router();

router.use(authenticate);

router.get('/', propertiesController.list);
router.get('/:id', propertiesController.get);

router.post('/', requireRoles('ADMIN', 'MANAGER'), auditLog, propertiesController.create);
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, propertiesController.update);
router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), auditLog, propertiesController.remove);

export default router;
