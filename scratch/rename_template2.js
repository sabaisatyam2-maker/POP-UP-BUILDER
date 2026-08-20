import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const res = await db.template.updateMany({
    where: {
      name: 'Mystery Box'
    },
    data: {
      name: 'Clover Offer'
    }
  });
  console.log(`Updated ${res.count} templates.`);
  
  const res2 = await db.popup.updateMany({
    where: {
      name: 'Mystery Box'
    },
    data: {
      name: 'Clover Offer'
    }
  });
  console.log(`Updated ${res2.count} popups.`);
}

main().catch(console.error).finally(() => db.$disconnect());
