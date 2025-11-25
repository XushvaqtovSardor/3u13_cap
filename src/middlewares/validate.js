import { AppError } from './errorHandler.js';

export const validate = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new AppError(`Validation error: ${errors.map(e => e.message).join(', ')}`, 400));
    }

    req.body = value;
    next();
  };
};

export const validateQuery = schema => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new AppError(`Validation error: ${errors.map(e => e.message).join(', ')}`, 400));
    }

    req.query = value;
    next();
  };
};
