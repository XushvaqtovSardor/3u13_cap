import Joi from 'joi';

const createOrderSchema = Joi.object({
  client_id: Joi.number().integer().positive().required(),
  product_link: Joi.string().optional().allow(''),
  currency_type_id: Joi.number().integer().positive().required(),
  truck: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().required(),
      }),
    )
    .min(1)
    .required(),
});

const cancelOrderSchema = Joi.object({
  reason: Joi.string().optional().allow(''),
});

export { createOrderSchema, cancelOrderSchema };
