import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const createAccessToken = payload => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpires,
  });
};

export const createRefreshToken = payload => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
};

export const verifyToken = token => {
  return jwt.verify(token, config.jwt.accessSecret);
};
