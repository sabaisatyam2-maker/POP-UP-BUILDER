const fs = require('fs');

try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  prisma.template.findMany().then(templates => {
    const names = templates.map(t => t.name).join('\n');
    fs.writeFileSync('db_check.txt', `Total: ${templates.length}\n${names}`);
  }).catch(e => {
    fs.writeFileSync('db_check.txt', `Error during findMany: ${e.message}\n${e.stack}`);
  });

} catch (e) {
  fs.writeFileSync('db_check.txt', `Error initializing: ${e.message}\n${e.stack}`);
}
