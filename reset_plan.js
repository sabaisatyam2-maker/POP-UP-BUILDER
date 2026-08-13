import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
  await prisma.subscription.updateMany({ data: { plan: 'FREE' } }); 
  console.log('All subscriptions set to FREE'); 
} 
main().finally(() => prisma.$disconnect());
