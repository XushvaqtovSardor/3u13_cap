import express from 'express';
import adminAuthRoutes from './admin.auth.routes.js';
import adminRoutes from './admin.routes.js';
import clientRoutes from './client.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import operationRoutes from './operation.routes.js';

const MainRouter = express.Router();

MainRouter.use('/superadmin', adminAuthRoutes);
MainRouter.use('/admin', adminRoutes);
MainRouter.use('/client', clientRoutes);
MainRouter.use('/product', productRoutes);
MainRouter.use('/order', orderRoutes);
MainRouter.use('/operation', operationRoutes);

export default MainRouter;
