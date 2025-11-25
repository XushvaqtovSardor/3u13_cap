import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access_jwt',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'reshresh_jwt',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '55m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '8525401678:AAEtmtU0cUM1q6i8PJrdpuEZPplNP7D0mWc',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;
