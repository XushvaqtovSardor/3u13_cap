import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { getPaginationParams, paginate } from '../utils/pagination.js';

export const createProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, is_available } = req.body;

  const product = await prisma.products.create({
    data: {
      name,
      description,
      price,
      is_available,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...product,
      id: product.id.toString(),
      price: product.price.toString(),
    },
  });
});

export const getAllProducts = asyncHandler(async (req, res, next) => {
  const { page, limit, is_available } = req.query;
  const {
    skip,
    take,
    page: currentPage,
    limit: currentLimit,
  } = getPaginationParams(page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);

  const where = is_available !== undefined ? { is_available: is_available === 'true' } : {};

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.products.count({ where }),
  ]);

  const formattedProducts = products.map(product => ({
    ...product,
    id: product.id.toString(),
    price: product.price.toString(),
  }));

  res.json({
    success: true,
    ...paginate(formattedProducts, total, currentPage, currentLimit),
  });
});

export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await prisma.products.findUnique({
    where: { id: BigInt(id) },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...product,
      id: product.id.toString(),
      price: product.price.toString(),
    },
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const existingProduct = await prisma.products.findUnique({
    where: { id: BigInt(id) },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  const product = await prisma.products.update({
    where: { id: BigInt(id) },
    data: req.body,
  });

  res.json({
    success: true,
    data: {
      ...product,
      id: product.id.toString(),
      price: product.price.toString(),
    },
  });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await prisma.products.findUnique({
    where: { id: BigInt(id) },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await prisma.products.delete({
    where: { id: BigInt(id) },
  });

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});
