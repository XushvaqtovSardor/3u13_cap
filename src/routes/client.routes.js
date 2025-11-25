import express from 'express';
import { clientOrderController } from '../controllers/client.order.controller.js';
import { clientAuth } from '../middlewares/clientAuth.js';
import { validate } from '../middlewares/validate.js';
import { clientValidator } from '../validators/client.validator.js';

const router = express.Router();

router.post('/register', validate(clientValidator.register), clientOrderController.registerClient);
router.post('/login', validate(clientValidator.login), clientOrderController.loginClient);

router.get('/products', clientOrderController.getAvailableProducts);
router.get('/currencies', clientOrderController.getCurrencyTypes);

router.post(
  '/orders',
  clientAuth,
  validate(clientValidator.createOrder),
  clientOrderController.createOrder,
);
router.get('/orders', clientAuth, clientOrderController.getMyOrders);
router.get('/orders/:order_id', clientAuth, clientOrderController.getOrderDetail);
router.post('/logout', clientAuth, clientOrderController.logoutClient);

export default router;
