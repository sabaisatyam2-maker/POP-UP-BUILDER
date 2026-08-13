import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.subscription.updateMany({
    data: { plan: 'PRO' },
  });
  console.log('Updated to PRO');
}
main();
