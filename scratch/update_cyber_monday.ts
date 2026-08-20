import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: "CYBER MONDAY" }
  });

  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: { plan: "PRO" }
    });
    console.log("Updated CYBER MONDAY template to PRO plan in database.");
  } else {
    console.log("CYBER MONDAY template not found in database.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
