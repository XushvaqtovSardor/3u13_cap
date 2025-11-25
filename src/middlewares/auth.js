import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from './errorHandler.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const admin = await prisma.admins.findUnique({
      where: { id: BigInt(decoded.id) },
      select: {
        id: true,
        role: true,
        email: true,
        is_active: true,
        is_creator: true,
        permissions: true,
        password:true
      },
    });

    if (!admin || !admin.is_active) {
      throw new AppError('Invalid or inactive admin', 401);
    }

    req.admin = {
      id: admin.id,
      role: admin.role,
      email: admin.email,
      is_creator: admin.is_creator,
      permissions: admin.permissions,
      password:admin.password
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authMiddleware = authenticate;

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.admin.role)) {
      return next(new AppError('Not allowed', 403));
    }

    next();
  };
};

export const isSuperAdmin = (req, res, next) => {
  if (!req.admin) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.admin.is_creator) {
    return next(new AppError('Access denied. Super admin only', 403));
  }

  next();
};

export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new AppError('Authentication required', 401));
    }

    if (req.admin.is_creator) {
      return next();
    }

    const permissions = req.admin.permissions;
    if (!permissions || !permissions[resource]) {
      return next(new AppError(`Access denied. No permission for ${resource}`, 403));
    }

    if (!permissions[resource][action]) {
      return next(new AppError(`Access denied. No ${action} permission for ${resource}`, 403));
    }

    next();
  };
};
