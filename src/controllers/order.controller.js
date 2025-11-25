import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { getPaginationParams, paginate } from '../utils/pagination.js';

export const createOrder = asyncHandler(async (req, res, next) => {
  const { client_id, product_link, currency_type_id, truck, description, items } = req.body;

  const client = await prisma.clients.findUnique({
    where: { id: BigInt(client_id) },
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const currencyType = await prisma.currency_types.findUnique({
    where: { id: BigInt(currency_type_id) },
  });

  if (!currencyType) {
    throw new AppError('Currency type not found', 404);
  }

  const productIds = items.map(item => BigInt(item.product_id));
  const products = await prisma.products.findMany({
    where: {
      id: { in: productIds },
      is_available: true,
    },
  });

  if (products.length !== items.length) {
    throw new AppError('Some products not found or unavailable', 400);
  }

  let totalSum = 0;
  const orderItems = items.map(item => {
    const product = products.find(p => p.id === BigInt(item.product_id));
    if (!product) {
      throw new AppError(`Product ${item.product_id} not found`, 404);
    }
    const itemTotal = Number(product.price) * item.quantity;
    totalSum += itemTotal;
    return {
      product_id: product.id,
      quantity: item.quantity,
      price: product.price,
    };
  });

  const order = await prisma.$transaction(async tx => {
    const newOrder = await tx.order.create({
      data: {
        client_id: BigInt(client_id),
        product_link,
        currency_type_id: BigInt(currency_type_id),
        truck,
        description,
        summa: totalSum,
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
        client: true,
        currency_type: true,
      },
    });

    return newOrder;
  });

  res.status(201).json({
    success: true,
    data: {
      ...order,
      id: order.id,
      client_id: order.client_id.toString(),
      currency_type_id: order.currency_type_id.toString(),
      summa: order.summa.toString(),
      orderItems: order.orderItems.map(item => ({
        ...item,
        id: item.id.toString(),
        product_id: item.product_id.toString(),
        price: item.price.toString(),
        product: {
          ...item.product,
          id: item.product.id.toString(),
          price: item.product.price.toString(),
        },
      })),
      client: {
        ...order.client,
        id: order.client.id.toString(),
      },
      currency_type: {
        ...order.currency_type,
        id: order.currency_type.id.toString(),
      },
    },
  });
});

export const getAllOrders = asyncHandler(async (req, res, next) => {
  const { page, limit, client_id, is_cancelled } = req.query;

  const {
    skip,
    take,
    page: currentPage,
    limit: currentLimit,
  } = getPaginationParams(page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);

  const where = {};
  if (client_id) where.client_id = BigInt(client_id);
  if (is_cancelled !== undefined) where.is_cancelled = is_cancelled === 'true';

  const [orders, total] = await Promise.all([
    prisma.orders.findMany({
      where,
      skip,
      take,
      include: {
        client: true,
        currency_type: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        operations: {
          include: {
            status: true,
            admin: {
              select: {
                id: true,
                full_name: true,
                role: true,
              },
            },
          },
          orderBy: {
            operation_date: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.orders.count({ where }),
  ]);

  const formattedOrders = orders.map(order => ({
    ...order,
    client_id: order.client_id.toString(),
    currency_type_id: order.currency_type_id.toString(),
    summa: order.summa.toString(),
    quantity: order.quantity?.toString(),
    client: {
      ...order.client,
      id: order.client.id.toString(),
    },
    currency_type: {
      ...order.currency_type,
      id: order.currency_type.id.toString(),
    },
    orderItems: order.orderItems.map(item => ({
      ...item,
      id: item.id.toString(),
      product_id: item.product_id.toString(),
      price: item.price.toString(),
      product: {
        ...item.product,
        id: item.product.id.toString(),
        price: item.product.price.toString(),
      },
    })),
    operations: order.operations.map(op => ({
      ...op,
      id: op.id.toString(),
      status_id: op.status_id.toString(),
      admin_id: op.admin_id.toString(),
      status: {
        ...op.status,
        id: op.status.id.toString(),
      },
      admin: {
        ...op.admin,
        id: op.admin.id.toString(),
      },
    })),
  }));

  res.json({
    success: true,
    ...paginate(formattedOrders, total, currentPage, currentLimit),
  });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await prisma.orders.findUnique({
    where: { id },
    include: {
      client: true,
      currency_type: true,
      orderItems: {
        include: {
          product: true,
        },
      },
      operations: {
        include: {
          status: true,
          admin: {
            select: {
              id: true,
              full_name: true,
              role: true,
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
    throw new AppError('Order not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...order,
      client_id: order.client_id.toString(),
      currency_type_id: order.currency_type_id.toString(),
      summa: order.summa.toString(),
      quantity: order.quantity?.toString(),
      client: {
        ...order.client,
        id: order.client.id.toString(),
      },
      currency_type: {
        ...order.currency_type,
        id: order.currency_type.id.toString(),
      },
      orderItems: order.orderItems.map(item => ({
        ...item,
        id: item.id.toString(),
        product_id: item.product_id.toString(),
        price: item.price.toString(),
        product: {
          ...item.product,
          id: item.product.id.toString(),
          price: item.product.price.toString(),
        },
      })),
      operations: order.operations.map(op => ({
        ...op,
        id: op.id.toString(),
        status_id: op.status_id.toString(),
        admin_id: op.admin_id.toString(),
        status: {
          ...op.status,
          id: op.status.id.toString(),
        },
        admin: {
          ...op.admin,
          id: op.admin.id.toString(),
        },
      })),
    },
  });
});

export const cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.orders.findUnique({
    where: { id },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.is_cancelled) {
    throw new AppError('Order already cancelled', 400);
  }

  const updatedOrder = await prisma.orders.update({
    where: { id },
    data: {
      is_cancelled: true,
      description: reason ? `Cancelled: ${reason}` : order.description,
    },
  });

  res.json({
    success: true,
    data: {
      ...updatedOrder,
      client_id: updatedOrder.client_id.toString(),
      currency_type_id: updatedOrder.currency_type_id.toString(),
      summa: updatedOrder.summa.toString(),
      quantity: updatedOrder.quantity?.toString(),
    },
    message: 'Order cancelled successfully',
  });
});
