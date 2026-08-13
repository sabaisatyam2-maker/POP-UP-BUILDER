const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shop = 'pop-up-builder-dydsyzj6.myshopify.com';
  await prisma.subscription.upsert({
    where: { shop },
    update: { plan: 'PRO', status: 'ACTIVE' },
    create: { shop, plan: 'PRO', status: 'ACTIVE' }
  });
  console.log('Upgraded to PRO');
}
main().catch(console.error).finally(() => prisma.$disconnect());
