import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'));
router.get('/', reportsController.auditLogs);

export default router;
