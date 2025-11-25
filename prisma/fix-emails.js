import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEmails() {
  try {
    
    const invalidClients = await prisma.clients.findMany({
      where: {
        email: {
          not: {
            contains: '@',
          },
        },
      },
    });

    console.log(`Found ${invalidClients.length} clients with invalid emails`);

   
    for (const client of invalidClients) {
      console.log(`Fixing client ${client.id}: ${client.email}`);
      await prisma.clients.update({
        where: { id: client.id },
        data: { email: null },
      });
    }

    console.log('✅ All invalid emails fixed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmails();
