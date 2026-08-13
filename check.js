import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.template.count();
  console.log('Template count:', count);
  const first = await prisma.template.findFirst();
  console.log('First template name:', first?.name);
}
main();
