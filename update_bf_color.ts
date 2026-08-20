import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'Ultimate Black Friday' }
  });

  if (template) {
    const config = JSON.parse(template.config as string);
    config.colors.primary = "#dd8801";
    
    await prisma.template.update({
      where: { id: template.id },
      data: {
        config: JSON.stringify(config)
      }
    });
    console.log("Ultimate Black Friday template primary color updated to #dd8801.");
  } else {
    console.log("Template not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
