import express from 'express';
import {
  createOperation,
  getOperationsByOrder,
  getAllOperations,
} from '../controllers/operation.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', checkPermission('operations', 'write'), createOperation);
router.get('/', checkPermission('operations', 'read'), getAllOperations);
router.get('/order/:orderId', checkPermission('operations', 'read'), getOperationsByOrder);

export default router;
