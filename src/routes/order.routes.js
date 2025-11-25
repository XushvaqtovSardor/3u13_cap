import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  cancelOrder,
} from '../controllers/order.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createOrderSchema, cancelOrderSchema } from '../validators/order.validator.js';

const router = express.Router();

router.use(authenticate);

router.post('/', checkPermission('orders', 'write'), validate(createOrderSchema), createOrder);
router.get('/', checkPermission('orders', 'read'), getAllOrders);
router.get('/:id', checkPermission('orders', 'read'), getOrderById);
router.patch(
  '/:id/cancel',
  checkPermission('orders', 'write'),
  validate(cancelOrderSchema),
  cancelOrder,
);

export default router;
