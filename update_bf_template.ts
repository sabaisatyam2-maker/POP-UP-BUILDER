import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'Ultimate Black Friday' }
  });

  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: {
        previewImage: '/3d_black_gift.png',
        config: JSON.stringify({
          layout: 'image-bottom-right',
          hasEmailInput: false,
          imageUrl: '/3d_black_gift.png',
          colors: {
            background: '#111111',
            text: '#ffffff',
            primary: '#d4af37',
            buttonText: '#ffffff'
          },
          styles: {
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: 'none'
          },
          content: {
            subheadline: 'BLACK FRIDAY',
            headline: 'MEGA SALE',
            description: 'Up to 50% OFF on selected items!',
            buttonText: 'Shop Now'
          }
        })
      }
    });
    console.log("Ultimate Black Friday template updated in DB.");
  } else {
    console.log("Template not found");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
