import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'Mystery Box' }
  });

  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: {
        previewImage: '/3d_clover.png',
        config: JSON.stringify({
          layout: 'image-bottom-right',
          hasEmailInput: true,
          imageUrl: '/3d_clover.png',
          colors: {
            background: '#062f14',
            text: '#ffffff',
            headlineText: '#4ade80',
            primary: '#16a34a',
            buttonText: '#ffffff'
          },
          styles: {
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(22, 163, 74, 0.25)',
            border: 'none'
          },
          content: {
            headline: 'St. Patrick\'s Day\nSpecial Offer',
            description: 'Get 25% OFF on your order.',
            buttonText: 'Claim Offer'
          }
        })
      }
    });
    console.log("Mystery Box template updated to St. Patrick's Day design.");
  } else {
    console.log("Template not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
