import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { getPaginationParams, paginate } from '../utils/pagination.js';

export const createOperation = asyncHandler(async (req, res, next) => {
  const { order_id, status_id, description } = req.body;

  const order = await prisma.orders.findUnique({
    where: { id: order_id },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.is_cancelled) {
    throw new AppError('Cannot add operation to cancelled order', 400);
  }

  const status = await prisma.statuses.findUnique({
    where: { id: BigInt(status_id) },
  });

  if (!status) {
    throw new AppError('Status not found', 404);
  }

  const operation = await prisma.operations.create({
    data: {
      order_id,
      status_id: BigInt(status_id),
      admin_id: req.admin.id,
      description,
    },
    include: {
      status: true,
      admin: {
        select: {
          id: true,
          full_name: true,
          role: true,
        },
      },
      order: true,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...operation,
      id: operation.id.toString(),
      status_id: operation.status_id.toString(),
      admin_id: operation.admin_id.toString(),
      status: {
        ...operation.status,
        id: operation.status.id.toString(),
      },
      admin: {
        ...operation.admin,
        id: operation.admin.id.toString(),
      },
      order: {
        ...operation.order,
        client_id: operation.order.client_id.toString(),
        currency_type_id: operation.order.currency_type_id.toString(),
        summa: operation.order.summa.toString(),
        quantity: operation.order.quantity?.toString(),
      },
    },
  });
});

export const getOperationsByOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const { page, limit } = req.query;

  const {
    skip,
    take,
    page: currentPage,
    limit: currentLimit,
  } = getPaginationParams(page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const [operations, total] = await Promise.all([
    prisma.operations.findMany({
      where: { order_id: orderId },
      skip,
      take,
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
      orderBy: { operation_date: 'desc' },
    }),
    prisma.operations.count({ where: { order_id: orderId } }),
  ]);

  const formattedOperations = operations.map(op => ({
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
  }));

  res.json({
    success: true,
    ...paginate(formattedOperations, total, currentPage, currentLimit),
  });
});

export const getAllOperations = asyncHandler(async (req, res, next) => {
  const { page, limit, status_id } = req.query;

  const {
    skip,
    take,
    page: currentPage,
    limit: currentLimit,
  } = getPaginationParams(page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);

  const where = status_id ? { status_id: BigInt(status_id) } : {};

  const [operations, total] = await Promise.all([
    prisma.operations.findMany({
      where,
      skip,
      take,
      include: {
        status: true,
        admin: {
          select: {
            id: true,
            full_name: true,
            role: true,
          },
        },
        order: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { operation_date: 'desc' },
    }),
    prisma.operations.count({ where }),
  ]);

  const formattedOperations = operations.map(op => ({
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
    order: {
      ...op.order,
      client_id: op.order.client_id.toString(),
      currency_type_id: op.order.currency_type_id.toString(),
      summa: op.order.summa.toString(),
      quantity: op.order.quantity?.toString(),
      client: {
        ...op.order.client,
        id: op.order.client.id.toString(),
      },
    },
  }));

  res.json({
    success: true,
    ...paginate(formattedOperations, total, currentPage, currentLimit),
  });
});
