import express from 'express';

import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import logger from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import MainRouter from './routes/index.js';
import './services/telegram.bot.js';

const app = express();

BigInt.prototype.toJSON = function () {
  return this.toString();
};


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Tizim tashlab yubordi',
});

app.use('/api', limiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Express cargo API',
  });
});

app.use('/', MainRouter);

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Serveron port ${PORT}`);
  console.log(`Server:http://localhost:${PORT}`);
});

export default app;
