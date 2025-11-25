import TelegramBot from 'node-telegram-bot-api';
import prisma from '../config/database.js';
import { sendOTPEmail } from '../utils/email.js';
import config from '../config/index.js';
import logger from '../config/logger.js';

const bot = new TelegramBot(config.telegram.botToken, { polling: true });

const userSessions = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const mainKeyboard = {
  reply_markup: {
    keyboard: [['Create Order', 'My Orders'], ['Profile', 'Logout'], ['Help']],
    resize_keyboard: true,
  },
};

bot.onText(/\/start/, async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const client = await prisma.clients.findUnique({
      where: { telegram_id: telegramId },
    });

    if (client) {
      if (!client.is_active) {
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.clients.update({
          where: { telegram_id: telegramId },
          data: { otp_code: otp, otp_expires: otpExpires },
        });

        if (client.email && client.email.includes('@')) {
          try {
            await sendOTPEmail(client.email, otp);
            logger.info(`OTP sent to ${client.email}`);
          } catch (emailError) {
            logger.error(`Email failed: ${emailError.message}`);
          }
        }

        bot.sendMessage(
          chatId,
          `Welcome back ${client.full_name}\n\nVerification required\n\nYour OTP: ${otp}\n${
            client.email ? `Sent to: ${client.email}\n` : ''
          }Expires in 10 minutes`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: 'Verify Now', callback_data: `verify_${telegramId}` }]],
            },
          },
        );
      } else {
        bot.sendMessage(chatId, `Welcome back, ${client.full_name}`, mainKeyboard);
      }
    } else {
      bot.sendMessage(chatId, 'Welcome\n\nPlease register to continue.', {
        reply_markup: {
          keyboard: [['Register']],
          resize_keyboard: true,
        },
      });
    }
  } catch (error) {
    logger.error('Start error:', error);
    bot.sendMessage(chatId, 'Error occurred. Try again.');
  }
});

bot.onText(/\/register/, async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const existing = await prisma.clients.findUnique({
      where: { telegram_id: telegramId },
    });

    if (existing) {
      bot.sendMessage(chatId, 'You are already registered\n\nUse /start to login.');
      return;
    }

    userSessions.set(telegramId, { step: 'full_name' });
    bot.sendMessage(chatId, 'Registration\n\nPlease enter your full name:');
  } catch (error) {
    logger.error('Register error:', error);
    bot.sendMessage(chatId, 'Error occurred. Try again.');
  }
});

bot.on('callback_query', async query => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const telegramId = query.from.id.toString();

  if (data.startsWith('verify_')) {
    const targetId = data.split('_')[1];

    try {
      const client = await prisma.clients.findUnique({
        where: { telegram_id: targetId },
      });

      if (!client) {
        bot.answerCallbackQuery(query.id, { text: 'Client not found' });
        return;
      }

      if (client.is_active) {
        bot.answerCallbackQuery(query.id, { text: 'Already verified' });
        bot.sendMessage(chatId, 'Account already verified', mainKeyboard);
        return;
      }

      if (!client.otp_code || !client.otp_expires) {
        bot.answerCallbackQuery(query.id, { text: 'No OTP found' });
        return;
      }

      if (new Date() > client.otp_expires) {
        bot.answerCallbackQuery(query.id, { text: 'OTP expired' });
        bot.sendMessage(chatId, 'OTP expired\n\nUse /start to get new code.');
        return;
      }

      await prisma.clients.update({
        where: { telegram_id: targetId },
        data: {
          is_active: true,
          otp_code: null,
          otp_expires: null,
        },
      });

      bot.answerCallbackQuery(query.id, { text: 'Verified' });
      bot.sendMessage(chatId, 'Account verified successfully', mainKeyboard);
    } catch (error) {
      logger.error('Verify error:', error);
      bot.answerCallbackQuery(query.id, { text: 'Verification failed' });
    }
  }

  if (data === 'logout_delete') {
    try {
      const client = await prisma.clients.findUnique({
        where: { telegram_id: telegramId },
      });

      if (client) {
        await prisma.clients.delete({
          where: { telegram_id: telegramId },
        });
        bot.answerCallbackQuery(query.id, { text: 'Profile deleted' });
        bot.sendMessage(
          chatId,
          'Profile deleted successfully\n\nUse /register to create new account.',
          {
            reply_markup: { remove_keyboard: true },
          },
        );
      }
    } catch (error) {
      logger.error('Delete profile error:', error);
      bot.answerCallbackQuery(query.id, { text: 'Error occurred' });
    }
  }

  if (data === 'logout_keep') {
    await prisma.clients.update({
      where: { telegram_id: telegramId },
      data: { is_active: false },
    });
    bot.answerCallbackQuery(query.id, { text: 'Logged out' });
    bot.sendMessage(chatId, 'Logged out successfully\n\nUse /start to login again.', {
      reply_markup: { remove_keyboard: true },
    });
  }
});

bot.on('message', async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const text = msg.text;

  if (text?.startsWith('/')) return;

  if (text === 'Register') {
    bot.sendMessage(chatId, 'Please use /register command.');
    return;
  }

  if (['Profile', 'Create Order', 'My Orders', 'Logout', 'Help'].includes(text)) {
    return;
  }

  const session = userSessions.get(telegramId);
  if (!session) return;

  try {
    switch (session.step) {
      case 'full_name':
        session.full_name = text;
        session.step = 'phone_number';
        bot.sendMessage(chatId, 'Enter your phone number:');
        break;

      case 'phone_number':
        session.phone_number = text;
        session.step = 'email';
        bot.sendMessage(chatId, 'Enter your email:');
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          bot.sendMessage(chatId, 'Invalid email format\n\nPlease enter valid email:');
          return;
        }
        session.email = text;
        session.step = 'address';
        bot.sendMessage(chatId, 'Enter your address or send location:', {
          reply_markup: {
            keyboard: [[{ text: 'Share Location', request_location: true }]],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        });
        break;

      case 'address':
        session.address = text;
        session.step = 'confirm_registration';
        bot.sendMessage(
          chatId,
          `Confirm Registration\n\n` +
            `Name: ${session.full_name}\n` +
            `Phone: ${session.phone_number}\n` +
            `Email: ${session.email}\n` +
            `Address: ${session.address}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Confirm', callback_data: 'confirm_reg' },
                  { text: 'Cancel', callback_data: 'cancel_reg' },
                ],
              ],
            },
          },
        );
        break;

      case 'order_product_link':
        session.product_link = text;
        session.step = 'order_quantity';
        bot.sendMessage(chatId, 'Enter quantity:');
        break;

      case 'order_quantity':
        if (isNaN(text) || Number(text) <= 0) {
          bot.sendMessage(chatId, 'Invalid quantity\n\nEnter valid number:');
          return;
        }
        session.quantity = Number(text);
        session.step = 'order_description';
        bot.sendMessage(chatId, 'Enter description (optional):\n\nOr type "skip"');
        break;

      case 'order_description':
        session.description = text === 'skip' ? null : text;

        const client = await prisma.clients.findUnique({
          where: { telegram_id: telegramId },
        });

        if (!client || !client.is_active) {
          bot.sendMessage(chatId, 'Please login first');
          userSessions.delete(telegramId);
          return;
        }

        const currencies = await prisma.currency_types.findMany();
        if (currencies.length === 0) {
          bot.sendMessage(chatId, 'No currencies available');
          userSessions.delete(telegramId);
          return;
        }

        session.currency_id = currencies[0].id;
        session.step = 'order_confirm';

        bot.sendMessage(
          chatId,
          `Order Summary\n\n` +
            `Product: ${session.product_link}\n` +
            `Quantity: ${session.quantity}\n` +
            `Description: ${session.description || 'N/A'}\n` +
            `Currency: ${currencies[0].name}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Confirm', callback_data: 'confirm_order' },
                  { text: 'Cancel', callback_data: 'cancel_order' },
                ],
              ],
            },
          },
        );
        break;
    }
  } catch (error) {
    logger.error('Message error:', error);
    bot.sendMessage(chatId, 'Error occurred. Try again.');
    userSessions.delete(telegramId);
  }
});

bot.on('location', async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();
  const session = userSessions.get(telegramId);

  if (session && session.step === 'address') {
    const location = msg.location;
    session.address = `Location: ${location.latitude}, ${location.longitude}`;
    session.location = `${location.latitude}, ${location.longitude}`;
    session.step = 'confirm_registration';

    bot.sendMessage(
      chatId,
      `Confirm Registration\n\n` +
        `Name: ${session.full_name}\n` +
        `Phone: ${session.phone_number}\n` +
        `Email: ${session.email}\n` +
        `Address: ${session.address}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Confirm', callback_data: 'confirm_reg' },
              { text: 'Cancel', callback_data: 'cancel_reg' },
            ],
          ],
        },
      },
    );
  }
});

bot.on('callback_query', async query => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const telegramId = query.from.id.toString();

  if (data === 'confirm_reg') {
    const session = userSessions.get(telegramId);
    if (!session) return;

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    try {
      await prisma.clients.create({
        data: {
          full_name: session.full_name,
          phone_number: session.phone_number,
          email: session.email,
          address: session.address,
          location: session.location || session.address,
          telegram_id: telegramId,
          otp_code: otp,
          otp_expires: otpExpires,
          is_active: false,
        },
      });

      if (session.email && session.email.includes('@')) {
        try {
          await sendOTPEmail(session.email, otp);
          logger.info(`OTP sent to ${session.email}`);
        } catch (emailError) {
          logger.error(`Email failed: ${emailError.message}`);
        }
      }

      bot.answerCallbackQuery(query.id, { text: 'Registered' });
      bot.sendMessage(
        chatId,
        `Registration successful\n\nVerification code: ${otp}\n${
          session.email ? `Sent to: ${session.email}\n` : ''
        }Expires in 10 minutes`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: 'Verify Now', callback_data: `verify_${telegramId}` }]],
          },
        },
      );

      userSessions.delete(telegramId);
    } catch (dbError) {
      if (dbError.code === 'P2002') {
        const field = dbError.meta?.target?.[0] || 'field';
        bot.answerCallbackQuery(query.id, { text: `${field} exists` });
        bot.sendMessage(
          chatId,
          `Registration failed\n\nThis ${field} is already registered.\n\nUse /start to login.`,
        );
      } else {
        bot.answerCallbackQuery(query.id, { text: 'Registration failed' });
        bot.sendMessage(chatId, 'Registration failed\n\nTry again with /register');
      }
      logger.error('Registration error:', dbError);
      userSessions.delete(telegramId);
    }
  }

  if (data === 'cancel_reg') {
    bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
    bot.sendMessage(chatId, 'Registration cancelled.');
    userSessions.delete(telegramId);
  }

  if (data === 'confirm_order') {
    const session = userSessions.get(telegramId);
    if (!session) return;

    try {
      const client = await prisma.clients.findUnique({
        where: { telegram_id: telegramId },
      });

      const order = await prisma.orders.create({
        data: {
          client_id: client.id,
          product_link: session.product_link,
          quantity: BigInt(session.quantity),
          summa: 0,
          currency_type_id: session.currency_id,
          description: session.description,
        },
      });

      bot.answerCallbackQuery(query.id, { text: 'Order created' });
      bot.sendMessage(
        chatId,
        `Order created successfully\n\nOrder ID: ${order.order_unique_id}`,
        mainKeyboard,
      );
      userSessions.delete(telegramId);
    } catch (error) {
      logger.error('Order creation error:', error);
      bot.answerCallbackQuery(query.id, { text: 'Failed' });
      bot.sendMessage(chatId, 'Order creation failed');
      userSessions.delete(telegramId);
    }
  }

  if (data === 'cancel_order') {
    bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
    bot.sendMessage(chatId, 'Order cancelled.', mainKeyboard);
    userSessions.delete(telegramId);
  }
});

bot.onText(/Profile/, async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const client = await prisma.clients.findUnique({
      where: { telegram_id: telegramId },
    });

    if (!client) {
      bot.sendMessage(chatId, 'Please register first\n\nUse /register');
      return;
    }

    bot.sendMessage(
      chatId,
      `Profile\n\n` +
        `Name: ${client.full_name}\n` +
        `Phone: ${client.phone_number}\n` +
        `Email: ${client.email || 'Not provided'}\n` +
        `Address: ${client.address}\n` +
        `Location: ${client.location}\n` +
        `Status: ${client.is_active ? 'Active' : 'Not Verified'}`,
    );
  } catch (error) {
    logger.error('Profile error:', error);
    bot.sendMessage(chatId, ' Error occurred.');
  }
});

bot.onText(/Logout/, async msg => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Logout Options\n\nChoose an option:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Logout (Keep Profile)', callback_data: 'logout_keep' }],
        [{ text: 'Logout & Delete Profile', callback_data: 'logout_delete' }],
        [{ text: 'Cancel', callback_data: 'cancel_logout' }],
      ],
    },
  });
});

bot.on('callback_query', async query => {
  if (query.data === 'cancel_logout') {
    bot.answerCallbackQuery(query.id, { text: 'Cancelled' });
    bot.sendMessage(query.message.chat.id, 'Logout cancelled.', mainKeyboard);
  }
});

bot.onText(/Create Order/, async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const client = await prisma.clients.findUnique({
      where: { telegram_id: telegramId },
    });

    if (!client || !client.is_active) {
      bot.sendMessage(chatId, 'Please login and verify first\n\nUse /start');
      return;
    }

    userSessions.set(telegramId, { step: 'order_product_link' });
    bot.sendMessage(chatId, 'Create New Order\n\nEnter product link or name:');
  } catch (error) {
    logger.error('Create order error:', error);
    bot.sendMessage(chatId, 'Error occurred.');
  }
});

bot.onText(/My Orders/, async msg => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id.toString();

  try {
    const client = await prisma.clients.findUnique({
      where: { telegram_id: telegramId },
    });

    if (!client || !client.is_active) {
      bot.sendMessage(chatId, 'Please login and verify first\n\nUse /start');
      return;
    }

    const orders = await prisma.orders.findMany({
      where: { client_id: client.id },
      include: {
        currency_type: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) {
      bot.sendMessage(chatId, 'No orders yet.\n\nUse "Create Order" to place your first order');
      return;
    }

    let message = 'Your Orders:\n\n';
    orders.forEach((order, index) => {
      message += `${index + 1}. ${order.order_unique_id}\n`;
      message += `   ${order.summa} ${order.currency_type.name}\n`;
      message += `   ${order.createdAt.toLocaleDateString()}\n`;
      message += `   ${order.is_cancelled ? 'Cancelled' : 'Active'}\n\n`;
    });

    bot.sendMessage(chatId, message);
  } catch (error) {
    logger.error('Orders error:', error);
    bot.sendMessage(chatId, 'Error occurred.');
  }
});

bot.onText(/Help/, async msg => {
  const chatId = msg.chat.id;
  const helpMessage = `
*Cargo Bot Help*

*Commands:*
/start - Login to your account
/register - Create new account

*Features:*
Create Order - Place new order
My Orders - View order history
Profile - View your profile
Logout - Logout options

*Process:*
1. Register with /register
2. Verify email with OTP
3. Create and track orders
4. Logout when done

*Support:*
Contact our team for assistance.
  `;
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

export default bot;
