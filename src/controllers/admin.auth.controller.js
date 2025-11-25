import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { createAccessToken, createRefreshToken } from '../utils/auth.js';
import { AppError } from '../middlewares/errorHandler.js';

const SUPER_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

export const adminAuthController = {
  login: async (req, res, next) => {
    try {
      const { user_name, password } = req.body;
      let admin;

      if (user_name === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
        admin = await prisma.admins.findFirst({ where: { is_creator: true } });

        if (!admin) {
          const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);
          admin = await prisma.admins.create({
            data: {
              full_name: 'Super Admin',
              user_name: SUPER_ADMIN.username,
              password: hashedPassword,
              phone_number: '+998',
              email: 'superadmin@gmail.com',
              is_creator: true,
              is_active: true,
              role: 'ADMIN',
              permissions: {
                products: { read: true, write: true },
                orders: { read: true, write: true },
                clients: { read: true, write: true },
                admins: { read: true, write: true },
                operations: { read: true, write: true },
                statuses: { read: true, write: true },
                currency: { read: true, write: true },
              },
            },
          });
        }
      } else {
        admin = await prisma.admins.findUnique({ where: { user_name } });

        if (!admin || !admin.is_active) throw new AppError('Invalid username or password', 401);

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) throw new AppError('Invalid username or password', 401);
      }

      const accessToken = createAccessToken({
        id: admin.id.toString(),
        user_name: admin.user_name,
        role: admin.role,
        is_creator: admin.is_creator,
        permissions: admin.permissions,
      });

      const refreshToken = createRefreshToken({
        id: admin.id.toString(),
        user_name: admin.user_name,
      });

      await prisma.admins.update({
        where: { id: admin.id },
        data: { token: refreshToken },
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,

          admin: {
            id: admin.id.toString(),
            full_name: admin.full_name,
            user_name: admin.user_name,
            role: admin.role,
            is_creator: admin.is_creator,
            permissions: admin.permissions,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  createAdmin: async (req, res, next) => {
    try {
      const {
        full_name,
        user_name,
        password,
        phone_number,
        email,
        role,
        permissions,
        tg_link,
        description,
      } = req.body;

      const existingAdmin = await prisma.admins.findFirst({
        where: {
          OR: [{ user_name }, { email }],
        },
      });

      if (existingAdmin) {
        throw new AppError('Username or email already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdmin = await prisma.admins.create({
        data: {
          full_name,
          user_name,
          password: hashedPassword,
          phone_number,
          email,
          role: role || 'COOK',
          permissions: permissions || {
            products: { read: true, write: false },
            orders: { read: true, write: false },
            clients: { read: true, write: false },
            admins: { read: false, write: false },
            operations: { read: true, write: true },
            statuses: { read: true, write: false },
            currency: { read: true, write: false },
          },
          tg_link,
          description,
          is_creator: false,
          is_active: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: newAdmin.id,
          full_name: newAdmin.full_name,
          user_name: newAdmin.user_name,
          email: newAdmin.email,
          phone_number: newAdmin.phone_number,
          role: newAdmin.role,
          permissions: newAdmin.permissions,
          is_active: newAdmin.is_active,
          createdAt: newAdmin.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getAllAdmins: async (req, res, next) => {
    try {
      const admins = await prisma.admins.findMany({
        select: {
          id: true,
          full_name: true,
          user_name: true,
          email: true,
          phone_number: true,
          role: true,
          permissions: true,
          is_active: true,
          is_creator: true,
          tg_link: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: admins,
      });
    } catch (error) {
      next(error);
    }
  },

  getAdminById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const admin = await prisma.admins.findUnique({
        where: { id: BigInt(id) },
        select: {
          id: true,
          full_name: true,
          user_name: true,
          email: true,
          phone_number: true,
          role: true,
          permissions: true,
          is_active: true,
          is_creator: true,
          tg_link: true,
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
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  },

  updateAdmin: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        full_name,
        user_name,
        phone_number,
        email,
        role,
        permissions,
        tg_link,
        description,
        is_active,
      } = req.body;

      const admin = await prisma.admins.findUnique({
        where: { id: BigInt(id) },
      });

      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      if (admin.is_creator) {
        throw new AppError('Cannot update super admin', 403);
      }

      const updateData = {};
      if (full_name) updateData.full_name = full_name;
      if (user_name) updateData.user_name = user_name;
      if (phone_number) updateData.phone_number = phone_number;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (permissions) updateData.permissions = permissions;
      if (tg_link !== undefined) updateData.tg_link = tg_link;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;

      const updatedAdmin = await prisma.admins.update({
        where: { id: BigInt(id) },
        data: updateData,
        select: {
          id: true,
          full_name: true,
          user_name: true,
          email: true,
          phone_number: true,
          role: true,
          permissions: true,
          is_active: true,
          tg_link: true,
          description: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedAdmin,
      });
    } catch (error) {
      next(error);
    }
  },

  updateAdminPassword: async (req, res, next) => {
    try {
      const id = req.admin.id;
      const { old_password, new_password } = req.body;

      const admin = await prisma.admins.findUnique({
        where: { id: BigInt(id) },
      });

      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      const isPasswordValid = await bcrypt.compare(old_password, admin.password);
      console.log(old_password, admin.password);

      if (!isPasswordValid) {
        throw new AppError('Invalid old password', 401);
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await prisma.admins.update({
        where: { id: BigInt(id) },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  deleteAdmin: async (req, res, next) => {
    try {
      const { id } = req.params;

      const admin = await prisma.admins.findUnique({
        where: { id: BigInt(id) },
      });

      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      if (admin.is_creator) {
        throw new AppError('Cannot delete super admin', 403);
      }

      await prisma.admins.delete({
        where: { id: BigInt(id) },
      });

      res.json({
        success: true,
        message: 'Admin deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];

      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      const refreshToken = authHeader.split(' ')[1];

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      const admin = await prisma.admins.findFirst({
        where: { token: refreshToken },
      });

      if (!admin) {
        throw new AppError('Invalid token', 404);
      }

      await prisma.admins.update({
        where: { id: admin.id },
        data: { token: null },
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;

      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      const refreshToken = authHeader.split(' ')[1];

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      const admin = await prisma.admins.findFirst({
        where: { token: refreshToken },
      });

      if (!admin || !admin.is_active) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      const newAccessToken = createAccessToken({
        id: admin.id.toString(),
        user_name: admin.user_name,
        role: admin.role,
        is_creator: admin.is_creator,
        permissions: admin.permissions,
      });

      const newRefreshToken = createRefreshToken({
        id: admin.id.toString(),
        user_name: admin.user_name,
      });

      await prisma.admins.update({
        where: { id: admin.id },
        data: { token: newRefreshToken },
      });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
