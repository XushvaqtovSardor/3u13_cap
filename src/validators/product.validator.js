import Joi from 'joi';

const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().required(),
  is_available: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  price: Joi.number().positive().optional(),
  is_available: Joi.boolean().optional(),
});

export { createProductSchema, updateProductSchema };
