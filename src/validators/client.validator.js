import Joi from 'joi';

export const clientValidator = {
  register: Joi.object({
    full_name: Joi.string().required(),
    phone_number: Joi.string().required(),
    email: Joi.string().email().required(),
    address: Joi.string().optional(),
    location: Joi.string().optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().optional(),
    phone_number: Joi.string().optional(),
  }).or('email', 'phone_number'),

  createOrder: Joi.object({
    product_link: Joi.string().optional(),
    currency_type_id: Joi.number().required(),
    truck: Joi.string().optional(),
    description: Joi.string().optional(),
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.number().required(),
          quantity: Joi.number().min(1).required(),
        }),
      )
      .min(1)
      .required(),
  }),
};
