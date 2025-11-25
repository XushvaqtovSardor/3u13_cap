import Joi from 'joi';

export const adminValidator = {
  login: Joi.object({
    user_name: Joi.string().required(),
    password: Joi.string().required(),
  }),

  createAdmin: Joi.object({
    full_name: Joi.string().required(),
    user_name: Joi.string().required(),
    password: Joi.string().min(6).required(),
    phone_number: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('MANAGER', 'ADMIN', 'COOK').optional(),
    permissions: Joi.object({
      products: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      orders: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      clients: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      admins: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      operations: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      statuses: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      currency: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
    }).optional(),
    tg_link: Joi.string().optional(),
    description: Joi.string().optional(),
  }),

  updateAdmin: Joi.object({
    full_name: Joi.string().optional(),
    user_name: Joi.string().optional(), 
    phone_number: Joi.string().optional(),
    email: Joi.string().email().optional(),
    role: Joi.string().valid('MANAGER', 'ADMIN', 'COOK').optional(),
    permissions: Joi.object({
      products: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      orders: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      clients: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      admins: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      operations: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      statuses: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
      currency: Joi.object({ read: Joi.boolean(), write: Joi.boolean() }).optional(),
    }).optional(),
    tg_link: Joi.string().allow('').optional(),
    description: Joi.string().allow('').optional(),
    is_active: Joi.boolean().optional(),
  }),

  updatePassword: Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
  }),
};
