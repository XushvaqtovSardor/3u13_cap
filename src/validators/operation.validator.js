import Joi from 'joi';

const createOperationSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  status_id: Joi.number().integer().positive().required(),
  description: Joi.string().optional().allow(''),
});

export { createOperationSchema };
