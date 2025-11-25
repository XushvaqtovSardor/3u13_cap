import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../config/logger.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendOTPEmail = async (email, otp) => {
  if (!email || !email.trim()) {
    logger.warn('Email address is empty, skipping OTP email');
    return;
  }

  try {
    const mailOptions = {
      from: config.email.user,
      to: email.trim(),
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send OTP to ${email}: ${error.message}`);
    throw error;
  }
};
