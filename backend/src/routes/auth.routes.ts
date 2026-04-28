import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/password-reset/request', authController.requestPasswordReset);
router.post('/password-reset/confirm', authController.confirmPasswordReset);

export default router;
