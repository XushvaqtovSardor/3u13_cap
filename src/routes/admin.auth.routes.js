import express from 'express';
import { adminAuthController } from '../controllers/admin.auth.controller.js';
import { authMiddleware, isSuperAdmin } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { adminValidator } from '../validators/admin.auth.validator.js';

const router = express.Router();

router.post('/login', validate(adminValidator.login), adminAuthController.login);
router.post('/refresh', adminAuthController.refreshToken);
router.post('/logout', adminAuthController.logout);
router.post(
  '/admins',
  authMiddleware,
  isSuperAdmin,
  validate(adminValidator.createAdmin),
  adminAuthController.createAdmin,
);
router.get('/admins', authMiddleware, adminAuthController.getAllAdmins);
router.get('/admins/:id', authMiddleware, adminAuthController.getAdminById);
router.put(
  '/admins/:id',
  authMiddleware,
  isSuperAdmin,
  validate(adminValidator.updateAdmin),
  adminAuthController.updateAdmin,
);
router.put(
  '/admins/password',
  authMiddleware,
  validate(adminValidator.updatePassword),
  adminAuthController.updateAdminPassword,
);
router.delete('/admins/:id', authMiddleware, isSuperAdmin, adminAuthController.deleteAdmin);

export default router;
