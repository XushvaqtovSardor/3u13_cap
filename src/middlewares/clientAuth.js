import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from './errorHandler.js';
import prisma from '../config/database.js';

export const clientAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.client_token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required. Please register or login', 401);
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const client = await prisma.clients.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { id: true, email: true, full_name: true, is_active: true },
    });

    if (!client || !client.is_active) {
      throw new AppError('Invalid or inactive client', 401);
    }

    req.client = {
      id: client.id,
      email: client.email,
      full_name: client.full_name,
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
