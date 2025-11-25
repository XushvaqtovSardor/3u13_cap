import express from 'express';
import {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  changeAdminPassword,
  deleteAdmin,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createAdminSchema,
  updateAdminSchema,
  changePasswordSchema,
} from '../validators/admin.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('MANAGER'), validate(createAdminSchema), createAdmin);
router.get('/', authorize('MANAGER', 'ADMIN'), getAllAdmins);
router.get('/:id', authorize('MANAGER', 'ADMIN'), getAdminById);
router.put('/:id', authorize('MANAGER'), validate(updateAdminSchema), updateAdmin);
router.put(
  '/:id/password',
  authorize('MANAGER'),
  validate(changePasswordSchema),
  changeAdminPassword,
);
router.delete('/:id', authorize('MANAGER'), deleteAdmin);

export default router;
