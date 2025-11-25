import Joi from 'joi';

const createAdminSchema = Joi.object({
  full_name: Joi.string().required(),
  user_name: Joi.string().required(),
  password: Joi.string().min(6).required(),
  phone_number: Joi.string().required(),
  email: Joi.string().email().required(),
  tg_link: Joi.string().optional().allow(''),
  role: Joi.string().valid('MANAGER', 'ADMIN', 'COOK').required(),
  description: Joi.string().optional().allow(''),
});

const updateAdminSchema = Joi.object({
  full_name: Joi.string().optional(),
  user_name: Joi.string().optional(),
  phone_number: Joi.string().optional(),
  email: Joi.string().email().optional(),
  tg_link: Joi.string().optional().allow(''),
  is_active: Joi.boolean().optional(),
  role: Joi.string().valid('MANAGER', 'ADMIN', 'COOK').optional(),
  description: Joi.string().optional().allow(''),
});

const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
});

export { createAdminSchema, updateAdminSchema, changePasswordSchema };
