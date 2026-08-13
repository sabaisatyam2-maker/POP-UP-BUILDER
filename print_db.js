console.log('START');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('MAIN');
  try {
    const templates = await prisma.template.findMany();
    console.log('TEMPLATES IN DB:', templates.map(t => t.name).join(', '));
  } catch(e) {
    console.error('ERROR:', e.message);
  }
}
main();
