import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', reportsController.dashboard);

router.get('/rental', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportsController.rental);
router.get('/airbnb', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportsController.airbnb);
router.get('/occupancy', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportsController.occupancy);
router.get('/upcoming-collections', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportsController.upcomingCollections);
router.get('/export', requireRoles('ADMIN', 'MANAGER', 'ACCOUNTANT'), reportsController.exportReport);

export default router;
