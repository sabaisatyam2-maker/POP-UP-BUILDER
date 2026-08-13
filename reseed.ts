import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all templates...");
  await prisma.template.deleteMany();

  const seedTemplates = [
    // FREE
    { name: "Basic Newsletter", description: "Collect emails with a simple, high-converting form.", type: "POPUP", category: "Newsletter", plan: "FREE", previewImage: "https://via.placeholder.com/400x250/ffffff/000000?text=Basic+Newsletter", config: JSON.stringify({ hasEmailInput: true, colors: { background: "#ffffff", text: "#000000", primary: "#000000" }, styles: { borderRadius: "8px", padding: "32px" }, content: { headline: "Basic Newsletter", description: "Collect emails with a simple, high-converting form.", buttonText: "Subscribe" } }) },
    { name: "Welcome Discount", description: "Offer a discount to new visitors.", type: "POPUP", category: "Discount", plan: "FREE", previewImage: "https://via.placeholder.com/400x250/ffffff/000000?text=Welcome+Discount", config: JSON.stringify({ hasEmailInput: true, colors: { background: "#ffffff", text: "#000000", primary: "#000000" }, styles: { borderRadius: "8px", padding: "32px" }, content: { headline: "Welcome Discount", description: "Offer a discount to new visitors.", buttonText: "Get Discount" } }) },
    { name: "Thank You Offer", description: "Show appreciation with a special offer.", type: "POPUP", category: "Offer", plan: "FREE", previewImage: "https://via.placeholder.com/400x250/ffffff/000000?text=Thank+You+Offer", config: JSON.stringify({ colors: { background: "#ffffff", text: "#000000", primary: "#000000" }, styles: { borderRadius: "8px", padding: "32px" }, content: { headline: "Thank You Offer", description: "Show appreciation with a special offer.", buttonText: "Claim Offer" } }) },
    
    // GROWTH
    { name: "Cart Recovery", description: "Prevent abandonment with a targeted message.", type: "POPUP", category: "Recovery", plan: "GROWTH", previewImage: "https://via.placeholder.com/400x250/f4f0ff/7338e5?text=Cart+Recovery", config: JSON.stringify({ layout: "split", hasEmailInput: true, imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400&auto=format&fit=crop", colors: { background: "#ffffff", text: "#000000", primary: "#7338e5" }, styles: { borderRadius: "16px" }, content: { headline: "Cart Recovery", description: "Prevent abandonment with a targeted message.", buttonText: "Complete Order" } }) },
    { name: "Exit Intent Capture", description: "Catch visitors before they leave your store.", type: "POPUP", category: "Exit Intent", plan: "GROWTH", previewImage: "https://via.placeholder.com/400x250/e6f7eb/10b981?text=Exit+Intent", config: JSON.stringify({ hasEmailInput: true, colors: { background: "#e6f7eb", text: "#000000", primary: "#10b981" }, styles: { borderRadius: "16px" }, content: { headline: "Exit Intent Capture", description: "Catch visitors before they leave your store.", buttonText: "Stay & Save" } }) },
    { name: "Free Shipping Banner", description: "Promote free shipping to increase AOV.", type: "POPUP", category: "Announcement", plan: "GROWTH", previewImage: "https://via.placeholder.com/400x250/ebf4ff/3b82f6?text=Free+Shipping", config: JSON.stringify({ colors: { background: "#ebf4ff", text: "#000000", primary: "#3b82f6" }, styles: { borderRadius: "16px" }, content: { headline: "Free Shipping Banner", description: "Promote free shipping to increase AOV.", buttonText: "Shop Now" } }) },
    
    // PRO
    { name: "Flash Sale", description: "Create urgency with a limited-time flash sale.", type: "POPUP", category: "Sale", plan: "PRO", previewImage: "https://via.placeholder.com/400x250/111111/facc15?text=Flash+Sale", config: JSON.stringify({ colors: { background: "#111111", text: "#ffffff", primary: "#facc15" }, styles: { borderRadius: "20px" }, content: { headline: "Flash Sale", description: "Create urgency with a limited-time flash sale.", buttonText: "Shop Sale" } }) },
    { name: "Product Launch", description: "Highlight your newest product drop.", type: "POPUP", category: "Launch", plan: "PRO", previewImage: "https://via.placeholder.com/400x250/1a0b1c/ec4899?text=Product+Launch", config: JSON.stringify({ layout: "split", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop", colors: { background: "#1a0b1c", text: "#ffffff", primary: "#ec4899" }, styles: { borderRadius: "20px" }, content: { headline: "Product Launch", description: "Highlight your newest product drop.", buttonText: "View Product" } }) },
    { name: "Limited Time Offer", description: "Exclusive offer for VIP customers.", type: "POPUP", category: "Offer", plan: "PRO", previewImage: "https://via.placeholder.com/400x250/064e3b/10b981?text=Limited+Time+Offer", config: JSON.stringify({ colors: { background: "#064e3b", text: "#ffffff", primary: "#10b981" }, styles: { borderRadius: "20px" }, content: { headline: "Limited Time Offer", description: "Exclusive offer for VIP customers.", buttonText: "Claim Now" } }) }
  ];

  for (const t of seedTemplates) {
    await prisma.template.create({ data: t });
  }
  
  console.log("Successfully seeded 9 exact templates!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
