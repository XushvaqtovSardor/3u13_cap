import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('manager123', 10);

  const manager = await prisma.admins.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      full_name: 'Karol',
      user_name: 'Karol',
      password: hashedPassword,
      phone_number: '+9989999999',
      email: 'Karol@gmail.com',
      role: 'MANAGER',
      is_creator: true,
      is_active: true,
      description: 'Karol',
    },
  });

  console.log('Manager created:', manager);

  const status1 = await prisma.statuses.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: 'Pending',
      description: 'Order is pending',
    },
  });

  const status2 = await prisma.statuses.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      name: 'Processing',
      description: 'Order is being processed',
    },
  });

  const status3 = await prisma.statuses.upsert({
    where: { id: BigInt(3) },
    update: {},
    create: {
      name: 'Completed',
      description: 'Order is completed',
    },
  });

  console.log('Statuses created:', { status1, status2, status3 });

  const currency = await prisma.currency_types.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: 'USD',
      description: 'US Dollar',
    },
  });

  console.log('Currency created:', currency);

  const client = await prisma.clients.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      full_name: '',
      phone_number: '',
      address: '',
      location: 'Tashkent',
      email: 'john@example.com',
    },
  });

  console.log('Client created:', client);

  const product1 = await prisma.products.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: 'Laptop Dell Inspiron',
      description: 'Dell Inspiron 15 3000 Series',
      price: 5000000,
      is_available: true,
    },
  });

  const product2 = await prisma.products.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      name: 'Hasan',
      description: 'Hasan',
      price: 150000,
      is_available: true,
    },
  });

  console.log('Products created:', { product1, product2 });

  console.log('succes');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
