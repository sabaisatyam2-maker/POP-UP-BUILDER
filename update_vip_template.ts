import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'VIP Early Access' }
  });

  if (template) {
    const config = JSON.parse(template.config as string);
    config.styles.border = "none";
    
    await prisma.template.update({
      where: { id: template.id },
      data: {
        config: JSON.stringify(config)
      }
    });
    console.log("VIP Early Access template updated in DB.");
  } else {
    console.log("Template not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
