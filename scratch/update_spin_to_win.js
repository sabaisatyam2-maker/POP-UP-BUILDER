import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  const configStr = JSON.stringify({
    layout: "background",
    hasEmailInput: false,
    imageUrl: "/new_year_fireworks.jpg",
    colors: {
      background: "#050505",
      text: "#ffffff",
      primary: "#E0C070",
      buttonText: "#000000"
    },
    styles: {
      borderRadius: "16px",
      padding: "32px",
      border: "1px solid #E0C070",
      boxShadow: "0 10px 30px rgba(224, 192, 112, 0.15)"
    },
    content: {
      subheadline: "New Year Sale",
      headline: "Flat 30% OFF",
      description: "On All Orders",
      buttonText: "Shop Now"
    }
  });

  const res = await db.template.updateMany({
    where: {
      name: 'Spin To Win'
    },
    data: {
      name: 'New Year Sale',
      description: 'Celebrate the new year with a special offer.',
      category: 'Sale',
      previewImage: '/new_year_fireworks.jpg',
      config: configStr
    }
  });
  console.log(`Updated ${res.count} templates.`);
  
  const res2 = await db.popup.updateMany({
    where: {
      name: 'Spin To Win'
    },
    data: {
      name: 'New Year Sale',
      config: configStr
    }
  });
  console.log(`Updated ${res2.count} popups.`);
}

main().catch(console.error).finally(() => db.$disconnect());
