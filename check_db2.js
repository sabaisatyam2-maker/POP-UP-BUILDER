import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany();
  console.log('COUNT: ' + templates.length);
  console.log('NAMES: ' + templates.map(t => t.name).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
