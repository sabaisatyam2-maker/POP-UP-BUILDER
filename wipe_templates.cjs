const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.template.deleteMany();
  console.log('Deleted all templates');
}

main().catch(console.error).finally(() => prisma.$disconnect());
