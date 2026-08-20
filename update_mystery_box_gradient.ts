import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'Mystery Box' }
  });

  if (template) {
    const config = JSON.parse(template.config as string);
    config.colors.background = "radial-gradient(circle at 30% 50%, #0f4b23 0%, #041a0b 100%)";
    config.colors.headlineText = "#3ae168";
    config.colors.primary = "#00a845";
    
    await prisma.template.update({
      where: { id: template.id },
      data: {
        config: JSON.stringify(config)
      }
    });
    console.log("Mystery Box template background updated to gradient.");
  } else {
    console.log("Template not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
