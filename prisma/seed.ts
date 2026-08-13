import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting existing templates...');
  await prisma.template.deleteMany();

  const templates = [
    // FREE Templates
    {
      name: "Join Our Newsletter",
      description: "Subscribe to get updates on new products and exclusive offers.",
      type: "POPUP",
      category: "Newsletter",
      plan: "FREE",
      previewImage: "https://via.placeholder.com/400x250/ffffff/000000?text=Join+Our+Newsletter",
      config: JSON.stringify({
        hasEmailInput: true,
        colors: { background: "#ffffff", text: "#000000", primary: "#000000" },
        styles: { borderRadius: "8px", padding: "32px" },
        content: { headline: "Join Our Newsletter", description: "Subscribe to get updates on new products and exclusive offers.", buttonText: "Subscribe" }
      })
    },
    {
      name: "Get 10% Off",
      description: "Sign up and get 10% off on your first purchase.",
      type: "POPUP",
      category: "Discount",
      plan: "FREE",
      previewImage: "https://via.placeholder.com/400x250/ffffff/000000?text=Get+10%25+Off",
      config: JSON.stringify({
        hasEmailInput: true,
        colors: { background: "#ffffff", text: "#000000", primary: "#000000" },
        styles: { borderRadius: "8px", padding: "32px" },
        content: { headline: "Get 10% Off", description: "Sign up and get 10% off on your first purchase.", buttonText: "Get My Discount" }
      })
    },

    // GROWTH Templates
    {
      name: "Wait! Before you go...",
      description: "Get 15% OFF on your order.",
      type: "POPUP",
      category: "Exit Intent",
      plan: "GROWTH",
      previewImage: "https://via.placeholder.com/400x250/f4f0ff/7338e5?text=Wait!+Before+you+go...",
      config: JSON.stringify({
        layout: "split",
        hasEmailInput: true,
        imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop",
        colors: { background: "#ffffff", text: "#000000", primary: "#7338e5" },
        styles: { borderRadius: "16px" },
        content: { headline: "Wait! Before you go...", description: "Get 15% OFF on your order.", buttonText: "Get 15% Off" }
      })
    },
    {
      name: "Special Offer Just For You!",
      description: "Get 20% OFF on your first order.",
      type: "POPUP",
      category: "Discount",
      plan: "GROWTH",
      previewImage: "https://via.placeholder.com/400x250/e6f7eb/10b981?text=Special+Offer",
      config: JSON.stringify({
        colors: { background: "#e6f7eb", text: "#000000", primary: "#10b981" },
        styles: { borderRadius: "16px" },
        content: { headline: "Special Offer Just For You!", description: "Get 20% OFF on your first order.", buttonText: "Claim Offer" }
      })
    },
    {
      name: "Free Shipping On All Orders",
      description: "Shop now and get free shipping on all orders.",
      type: "POPUP",
      category: "Free Shipping",
      plan: "GROWTH",
      previewImage: "https://via.placeholder.com/400x250/ebf4ff/3b82f6?text=Free+Shipping",
      config: JSON.stringify({
        colors: { background: "#ebf4ff", text: "#000000", primary: "#3b82f6" },
        styles: { borderRadius: "16px" },
        content: { headline: "Free Shipping On All Orders", description: "Shop now and get free shipping on all orders.", buttonText: "Shop Now" }
      })
    },
    {
      name: "Hurry Up!",
      description: "Grab the deal before it's gone!",
      type: "POPUP",
      category: "Sale",
      plan: "GROWTH",
      previewImage: "https://via.placeholder.com/400x250/fff5eb/f59e0b?text=Hurry+Up!",
      config: JSON.stringify({
        colors: { background: "#fff5eb", text: "#000000", primary: "#f59e0b" },
        styles: { borderRadius: "16px" },
        content: { headline: "Hurry Up!", description: "Grab the deal before it's gone!", buttonText: "Shop Now" }
      })
    },
    {
      name: "Welcome!",
      description: "Enjoy 10% OFF on your first order with us.",
      type: "POPUP",
      category: "New Launch",
      plan: "GROWTH",
      previewImage: "https://via.placeholder.com/400x250/fdf4ff/d946ef?text=Welcome!",
      config: JSON.stringify({
        colors: { background: "#fdf4ff", text: "#000000", primary: "#d946ef" },
        styles: { borderRadius: "16px" },
        content: { headline: "Welcome!", description: "Enjoy 10% OFF on your first order with us.", buttonText: "Get 10% Off" }
      })
    },

    // PRO Templates
    {
      name: "Black Friday MEGA SALE",
      description: "Up to 50% OFF on selected items!",
      type: "POPUP",
      category: "Sale",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/111111/facc15?text=Black+Friday",
      config: JSON.stringify({
        colors: { background: "#111111", text: "#ffffff", primary: "#facc15" },
        styles: { borderRadius: "20px" },
        content: { headline: "Black Friday MEGA SALE", description: "Up to 50% OFF on selected items!", buttonText: "Shop Now" }
      })
    },
    {
      name: "CYBER MONDAY",
      description: "SALE IS LIVE! Up to 60% OFF on everything.",
      type: "POPUP",
      category: "Sale",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/1a0b1c/ec4899?text=Cyber+Monday",
      config: JSON.stringify({
        colors: { background: "#1a0b1c", text: "#ffffff", primary: "#ec4899" },
        styles: { borderRadius: "20px" },
        content: { headline: "CYBER MONDAY", description: "SALE IS LIVE! Up to 60% OFF on everything.", buttonText: "Shop Now" }
      })
    },
    {
      name: "St. Patrick's Day Special Offer",
      description: "Get 25% OFF on your order.",
      type: "POPUP",
      category: "Festival",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/064e3b/10b981?text=St.+Patrick's+Day",
      config: JSON.stringify({
        colors: { background: "#064e3b", text: "#ffffff", primary: "#10b981" },
        styles: { borderRadius: "20px" },
        content: { headline: "St. Patrick's Day Special Offer", description: "Get 25% OFF on your order.", buttonText: "Claim Offer" }
      })
    },
    {
      name: "New Year Sale",
      description: "Flat 30% OFF On All Orders",
      type: "POPUP",
      category: "Festival",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/1f2937/f59e0b?text=New+Year+Sale",
      config: JSON.stringify({
        colors: { background: "#1f2937", text: "#ffffff", primary: "#f59e0b" },
        styles: { borderRadius: "20px" },
        content: { headline: "New Year Sale", description: "Flat 30% OFF On All Orders", buttonText: "Shop Now" }
      })
    },
    {
      name: "Refer & Earn",
      description: "Invite your friends and get 20% OFF on your next order.",
      type: "POPUP",
      category: "Lead Generation",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/2e1065/8b5cf6?text=Refer+%26+Earn",
      config: JSON.stringify({
        colors: { background: "#2e1065", text: "#ffffff", primary: "#8b5cf6" },
        styles: { borderRadius: "20px" },
        content: { headline: "Refer & Earn", description: "Invite your friends and get 20% OFF on your next order.", buttonText: "Invite Now" }
      })
    },
    {
      name: "EXCLUSIVE OFFER Just For You!",
      description: "Get 15% OFF on your next purchase.",
      type: "POPUP",
      category: "Discount",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/1e3a8a/3b82f6?text=EXCLUSIVE+OFFER",
      config: JSON.stringify({
        colors: { background: "#1e3a8a", text: "#ffffff", primary: "#3b82f6" },
        styles: { borderRadius: "20px" },
        content: { headline: "EXCLUSIVE OFFER Just For You!", description: "Get 15% OFF on your next purchase.", buttonText: "Unlock Offer" }
      })
    },
    {
      name: "SUMMER SALE",
      description: "Up to 40% OFF On Your Favorite Items",
      type: "POPUP",
      category: "Seasonal",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/7c2d12/f97316?text=SUMMER+SALE",
      config: JSON.stringify({
        colors: { background: "#7c2d12", text: "#ffffff", primary: "#f97316" },
        styles: { borderRadius: "20px" },
        content: { headline: "SUMMER SALE", description: "Up to 40% OFF On Your Favorite Items", buttonText: "Shop Now" }
      })
    },
    {
      name: "Don't Miss Out! Get 10% OFF",
      description: "on your first order.",
      type: "POPUP",
      category: "Exit Intent",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/0f172a/3b82f6?text=Don't+Miss+Out!",
      config: JSON.stringify({
        colors: { background: "#0f172a", text: "#ffffff", primary: "#3b82f6" },
        styles: { borderRadius: "20px" },
        content: { headline: "Don't Miss Out! Get 10% OFF", description: "on your first order.", buttonText: "Get My Discount" }
      })
    },
    {
      name: "Love is in the Air 14% OFF",
      description: "On orders over $99",
      type: "POPUP",
      category: "Festival",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/831843/f43f5e?text=Love+is+in+the+Air",
      config: JSON.stringify({
        colors: { background: "#831843", text: "#ffffff", primary: "#f43f5e" },
        styles: { borderRadius: "20px" },
        content: { headline: "Love is in the Air 14% OFF", description: "On orders over $99", buttonText: "Shop Now" }
      })
    },
    {
      name: "VIP ACCESS",
      description: "Unlock exclusive deals and early access.",
      type: "POPUP",
      category: "Lead Generation",
      plan: "PRO",
      previewImage: "https://via.placeholder.com/400x250/000000/d4af37?text=VIP+ACCESS",
      config: JSON.stringify({
        colors: { background: "#000000", text: "#ffffff", primary: "#d4af37" },
        styles: { borderRadius: "20px" },
        content: { headline: "VIP ACCESS", description: "Unlock exclusive deals and early access.", buttonText: "Unlock Now" }
      })
    }
  ];

  console.log('Seeding templates...');
  for (const t of templates) {
    await prisma.template.create({ data: t });
  }
  console.log('Done!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
