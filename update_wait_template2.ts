import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const template = await prisma.template.findFirst({
    where: { name: 'Wait! Before you go...' }
  });

  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: {
        previewImage: '/3d_purple_bag.png',
        config: JSON.stringify({
          layout: 'image-bottom-right',
          hasEmailInput: true,
          imageUrl: '/3d_purple_bag.png',
          colors: {
            background: '#f4ebff',
            text: '#000000',
            primary: '#6223e1',
            buttonText: '#ffffff'
          },
          styles: {
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(109, 40, 217, 0.25)',
            border: 'none'
          },
          content: {
            headline: 'Wait! Before\nyou go...',
            description: 'Get 15% OFF on your order.',
            buttonText: 'Get 15% Off'
          }
        })
      }
    });
    console.log('Template updated successfully!');
  } else {
    console.log('Template not found!');
  }
}

main().catch(console.error);
