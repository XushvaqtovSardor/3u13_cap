import prisma from '../config/database.js';
import { createAccessToken } from '../utils/auth.js';

export const clientOrderController = {
  registerClient: async (req, res, next) => {
    try {
      const { full_name, phone_number, email, address, location } = req.body;

      const existingClient = await prisma.clients.findFirst({
        where: {
          OR: [{ email }, { phone_number }],
        },
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: 'Client with this email or phone already exists',
        });
      }

      const client = await prisma.clients.create({
        data: {
          full_name,
          phone_number,
          email,
          address,
          location,
          is_active: true,
        },
      });

      const token = createAccessToken({
        id: client.id.toString(),
        email: client.email,
        full_name: client.full_name,
      });

      await prisma.clients.update({
        where: { id: client.id },
        data: { token },
      });

      res.cookie('client_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      res.status(201).json({
        success: true,
        data: {
          client: {
            id: client.id.toString(),
            full_name: client.full_name,
            email: client.email,
            phone_number: client.phone_number,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  loginClient: async (req, res, next) => {
    try {
      const { email, phone_number } = req.body;

      if (!email && !phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required',
        });
      }

      const client = await prisma.clients.findFirst({
        where: {
          OR: [{ email }, { phone_number }],
          is_active: true,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      const token = createAccessToken({
        id: client.id.toString(),
        email: client.email,
        full_name: client.full_name,
      });

      await prisma.clients.update({
        where: { id: client.id },
        data: { token },
      });

      res.cookie('client_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      });

      res.json({
        success: true,
        data: {
          client: {
            id: client.id.toString(),
            full_name: client.full_name,
            email: client.email,
            phone_number: client.phone_number,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  createOrder: async (req, res, next) => {
    try {
      const { product_link, currency_type_id, truck, description, items } = req.body;
      const clientId = req.client.id;

      const result = await prisma.$transaction(async tx => {
        const client = await tx.clients.findUnique({
          where: { id: BigInt(clientId) },
        });

        if (!client || !client.is_active) {
          throw new Error('Client not found or not active');
        }

        const currencyType = await tx.currency_types.findUnique({
          where: { id: BigInt(currency_type_id) },
        });

        if (!currencyType) {
          throw new Error('Currency type not found');
        }

        const productIds = items.map(item => BigInt(item.product_id));
        const products = await tx.products.findMany({
          where: {
            id: { in: productIds },
            is_available: true,
          },
        });

        if (products.length !== items.length) {
          throw new Error('Some products not found or unavailable');
        }

        let totalSum = 0;
        const orderItems = items.map(item => {
          const product = products.find(p => p.id === BigInt(item.product_id));
          if (!product) {
            throw new Error(`Product ${item.product_id} not found`);
          }
          const itemTotal = Number(product.price) * item.quantity;
          totalSum += itemTotal;
          return {
            product_id: product.id,
            quantity: item.quantity,
            price: product.price,
          };
        });

        const order = await tx.orders.create({
          data: {
            client_id: client.id,
            product_link,
            summa: totalSum,
            currency_type_id: BigInt(currency_type_id),
            truck,
            description,
            orderItems: {
              create: orderItems,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            currency_type: true,
          },
        });

        return { order, currencyType };
      });

      res.status(201).json({
        success: true,
        data: {
          order_id: result.order.id,
          order_unique_id: result.order.order_unique_id,
          total_amount: result.order.summa.toString(),
          currency: result.currencyType.name,
          items: result.order.orderItems.length,
          created_at: result.order.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getMyOrders: async (req, res, next) => {
    try {
      const clientId = req.client.id;

      const orders = await prisma.orders.findMany({
        where: { client_id: BigInt(clientId) },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          currency_type: true,
          operations: {
            include: {
              status: true,
              admin: {
                select: {
                  full_name: true,
                },
              },
            },
            orderBy: {
              operation_date: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: orders.map(order => ({
          order_id: order.id,
          order_unique_id: order.order_unique_id,
          total_amount: order.summa.toString(),
          currency: order.currency_type.name,
          status: order.operations[0]?.status?.name || 'Pending',
          items_count: order.orderItems.length,
          is_cancelled: order.is_cancelled,
          created_at: order.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  getOrderDetail: async (req, res, next) => {
    try {
      const { order_id } = req.params;
      const clientId = req.client.id;

      const order = await prisma.orders.findFirst({
        where: {
          id: order_id,
          client_id: BigInt(clientId),
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          currency_type: true,
          operations: {
            include: {
              status: true,
              admin: {
                select: {
                  full_name: true,
                },
              },
            },
            orderBy: {
              operation_date: 'desc',
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json({
        success: true,
        data: {
          order_id: order.id,
          order_unique_id: order.order_unique_id,
          total_amount: order.summa.toString(),
          currency: order.currency_type.name,
          truck: order.truck,
          description: order.description,
          is_cancelled: order.is_cancelled,
          created_at: order.createdAt,
          items: order.orderItems.map(item => ({
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.price.toString(),
            total: (Number(item.price) * item.quantity).toString(),
          })),
          operations: order.operations.map(op => ({
            status: op.status.name,
            admin: op.admin.full_name,
            description: op.description,
            date: op.operation_date,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getAvailableProducts: async (req, res, next) => {
    try {
      const products = await prisma.products.findMany({
        where: { is_available: true },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: products.map(product => ({
          id: product.id.toString(),
          name: product.name,
          description: product.description,
          price: product.price.toString(),
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  getCurrencyTypes: async (req, res, next) => {
    try {
      const currencies = await prisma.currency_types.findMany({
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: currencies.map(currency => ({
          id: currency.id.toString(),
          name: currency.name,
          description: currency.description,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

  logoutClient: async (req, res, next) => {
    try {
      const clientId = req.client.id;

      await prisma.clients.update({
        where: { id: BigInt(clientId) },
        data: { token: null },
      });

      res.clearCookie('client_token');

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
