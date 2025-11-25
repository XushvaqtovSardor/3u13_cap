import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { AppError, asyncHandler } from '../middlewares/errorHandler.js';
import { getPaginationParams, paginate } from '../utils/pagination.js';

export const createAdmin = asyncHandler(async (req, res, next) => {
  const { full_name, user_name, password, phone_number, email, tg_link, role, description } =
    req.body;

  const existingAdmin = await prisma.admins.findFirst({
    where: {
      OR: [{ user_name }, { email }],
    },
  });

  if (existingAdmin) {
    throw new AppError('Username or email already exists', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admins.create({
    data: {
      full_name,
      user_name,
      password: hashedPassword,
      phone_number,
      email,
      tg_link,
      role,
      description,
    },
  });

  const { password: _, token: __, ...adminData } = admin;

  res.status(201).json({
    success: true,
    data: {
      ...adminData,
      id: adminData.id.toString(),
    },
  });
});

export const getAllAdmins = asyncHandler(async (req, res, next) => {
  const { page, limit } = req.query;
  const {
    skip,
    take,
    page: currentPage,
    limit: currentLimit,
  } = getPaginationParams(page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);

  const [admins, total] = await Promise.all([
    prisma.admins.findMany({
      skip,
      take,
      select: {
        id: true,
        full_name: true,
        user_name: true,
        phone_number: true,
        email: true,
        tg_link: true,
        role: true,
        is_active: true,
        is_creator: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.admins.count(),
  ]);

  const formattedAdmins = admins.map(admin => ({
    ...admin,
    id: admin.id.toString(),
  }));

  res.json({
    success: true,
    ...paginate(formattedAdmins, total, currentPage, currentLimit),
  });
});

export const getAdminById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const admin = await prisma.admins.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      full_name: true,
      user_name: true,
      phone_number: true,
      email: true,
      tg_link: true,
      role: true,
      is_active: true,
      is_creator: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  res.json({
    success: true,
    data: {
      ...admin,
      id: admin.id.toString(),
    },
  });
});

export const updateAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const existingAdmin = await prisma.admins.findUnique({
    where: { id: BigInt(id) },
  });

  if (!existingAdmin) {
    throw new AppError('Admin not found', 404);
  }

  if (updateData.user_name || updateData.email) {
    const duplicate = await prisma.admins.findFirst({
      where: {
        AND: [
          { id: { not: BigInt(id) } },
          {
            OR: [{ user_name: updateData.user_name }, { email: updateData.email }],
          },
        ],
      },
    });

    if (duplicate) {
      throw new AppError('Username or email already exists', 400);
    }
  }

  delete updateData.password;

  const admin = await prisma.admins.update({
    where: { id: BigInt(id) },
    data: updateData,
    select: {
      id: true,
      full_name: true,
      user_name: true,
      phone_number: true,
      email: true,
      tg_link: true,
      role: true,
      is_active: true,
      is_creator: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    success: true,
    data: {
      ...admin,
      id: admin.id.toString(),
    },
  });
});

export const changeAdminPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { old_password, new_password } = req.body;

  const admin = await prisma.admins.findUnique({
    where: { id: BigInt(id) },
  });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const isValidPassword = await bcrypt.compare(old_password, admin.password);
  if (!isValidPassword) {
    throw new AppError('Invalid old password', 401);
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);

  await prisma.admins.update({
    where: { id: BigInt(id) },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const deleteAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const admin = await prisma.admins.findUnique({
    where: { id: BigInt(id) },
  });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  if (admin.is_creator) {
    throw new AppError('Cannot delete creator admin', 403);
  }

  await prisma.admins.delete({
    where: { id: BigInt(id) },
  });

  res.json({
    success: true,
    message: 'Admin deleted successfully',
  });
});
