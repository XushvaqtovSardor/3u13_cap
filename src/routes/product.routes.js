import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { authenticate, checkPermission } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validator.js';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  checkPermission('products', 'write'),
  validate(createProductSchema),
  createProduct,
);
router.get('/', checkPermission('products', 'read'), getAllProducts);
router.get('/:id', checkPermission('products', 'read'), getProductById);
router.put(
  '/:id',
  checkPermission('products', 'write'),
  validate(updateProductSchema),
  updateProduct,
);
router.delete('/:id', checkPermission('products', 'write'), deleteProduct);

export default router;
