import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect, data } from "react-router";
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useMemo } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let templates = await db.template.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (templates.length !== 10) {
    console.log("Force reseeding 10 templates directly in loader...");
    await db.template.deleteMany();
    
    const seedTemplates = [
      // FREE
      { name: "Wait! Before you go...", description: "Grab attention with a stunning exit intent popup.", type: "POPUP", category: "Exit Intent", plan: "FREE", previewImage: "/3d_envelope.png", config: JSON.stringify({ layout: "split", hasEmailInput: true, imageUrl: "/3d_envelope.png", colors: { background: "linear-gradient(135deg, #1A1A24 0%, #0F0F13 100%)", text: "#FFFFFF", primary: "#9D4EDD" }, styles: { borderRadius: "24px", padding: "0", boxShadow: "0 25px 50px -12px rgba(157, 78, 221, 0.25)", border: "1px solid rgba(157, 78, 221, 0.3)" }, content: { headline: "Wait! Before you go...", description: "Join our newsletter and get 15% off your first order instantly.", buttonText: "Get 15% Off" } }) },
      
      { name: "Get 10% Off", description: "A beautiful gift box offer to welcome new visitors.", type: "POPUP", category: "Discount", plan: "FREE", previewImage: "/3d_gift_box.png", config: JSON.stringify({ layout: "split", hasEmailInput: true, imageUrl: "/3d_gift_box.png", colors: { background: "#FFEDD5", text: "#431407", primary: "#F97316" }, styles: { borderRadius: "24px", padding: "0", boxShadow: "0 20px 40px -10px rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.1)" }, content: { headline: "Get 10% Off", description: "Unwrap your exclusive welcome discount. Enter your email below.", buttonText: "Claim My Gift" } }) },
      
      { name: "Subscribe Popup", description: "A clean, modern newsletter capture.", type: "POPUP", category: "Newsletter", plan: "FREE", previewImage: "https://images.unsplash.com/photo-1577563908411-50cb98976efe?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: true, colors: { background: "#ffffff", text: "#111827", primary: "#111827" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }, content: { headline: "Stay in the loop", description: "Get the latest updates, exclusive offers, and more directly to your inbox.", buttonText: "Subscribe Now" } }) },
      
      { name: "Website Redirect", description: "Clean, minimalist redirect popup.", type: "POPUP", category: "Announcement", plan: "FREE", previewImage: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: false, colors: { background: "#ffffff", text: "#000000", primary: "#000000" }, styles: { borderRadius: "12px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "none" }, content: { headline: "Special Offer", description: "Click the button below to claim your offer on the next page.", buttonText: "Claim Offer", buttonUrl: "" } }) },
      
      // GROWTH
      { name: "CYBER MONDAY", description: "Neon styled cyber monday flash sale.", type: "POPUP", category: "Sale", plan: "GROWTH", previewImage: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: false, colors: { background: "linear-gradient(135deg, #09090b 0%, #18181b 100%)", text: "#FFFFFF", primary: "#22d3ee" }, styles: { borderRadius: "24px", padding: "40px", boxShadow: "0 0 40px rgba(34, 211, 238, 0.2)", border: "2px solid #22d3ee" }, content: { headline: "CYBER MONDAY", description: "Everything is 50% OFF. No code required. Sale ends at midnight!", buttonText: "Shop The Sale" } }) },
      
      { name: "Hurry Up!", description: "Create massive urgency with a glowing timer.", type: "POPUP", category: "Cart Recovery", plan: "GROWTH", previewImage: "/3d_clock.png", config: JSON.stringify({ layout: "split", hasEmailInput: false, imageUrl: "/3d_clock.png", colors: { background: "linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)", text: "#FFFFFF", primary: "#f43f5e" }, styles: { borderRadius: "24px", padding: "0", boxShadow: "0 20px 40px rgba(244, 63, 94, 0.3)", border: "1px solid rgba(255,255,255,0.1)" }, content: { headline: "Hurry Up!", description: "Your cart is expiring soon! Complete your checkout now to secure your items.", buttonText: "Checkout Now" } }) },
      
      { name: "VIP Early Access", description: "Exclusive gradient design for VIPs.", type: "POPUP", category: "Announcement", plan: "GROWTH", previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: true, colors: { background: "linear-gradient(45deg, #ff7e5f, #feb47b)", text: "#FFFFFF", primary: "#ffffff" }, styles: { borderRadius: "24px", padding: "40px", boxShadow: "0 10px 30px rgba(255, 126, 95, 0.4)" }, content: { headline: "VIP Early Access", description: "Enter your email to unlock the secret store before anyone else.", buttonText: "Unlock Now" } }) },
      
      // PRO
      { name: "Ultimate Black Friday", description: "The most aggressive sale template.", type: "POPUP", category: "Sale", plan: "PRO", previewImage: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "split", hasEmailInput: false, imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=400&auto=format&fit=crop", colors: { background: "#000000", text: "#ffffff", primary: "#ef4444" }, styles: { borderRadius: "0px", padding: "0px", border: "4px solid #ef4444" }, content: { headline: "BLACK FRIDAY", description: "UP TO 80% OFF ENTIRE STORE. DO NOT MISS THIS.", buttonText: "SHOP NOW" } }) },
      
      { name: "Spin To Win", description: "Interactive gamified popup.", type: "POPUP", category: "Lead Generation", plan: "PRO", previewImage: "https://images.unsplash.com/photo-1595328221832-72ec1eb373fb?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: true, colors: { background: "#ffffff", text: "#000000", primary: "#10b981" }, styles: { borderRadius: "32px", padding: "48px", border: "8px solid #fef3c7" }, content: { headline: "Spin To Win!", description: "Enter your email for a chance to win up to $100 in store credit.", buttonText: "Spin The Wheel" } }) },
      
      { name: "Mystery Box", description: "Intriguing design to capture curiosity.", type: "POPUP", category: "Offer", plan: "PRO", previewImage: "/3d_gift_box.png", config: JSON.stringify({ layout: "split", hasEmailInput: true, imageUrl: "/3d_gift_box.png", colors: { background: "#18181b", text: "#a1a1aa", primary: "#eab308" }, styles: { borderRadius: "20px", padding: "0", boxShadow: "0 0 50px rgba(234, 179, 8, 0.15)" }, content: { headline: "Claim Your Mystery Box", description: "We have a surprise waiting for you. What's inside? Enter your email to find out.", buttonText: "Reveal Mystery" } }) }
    ];

    for (const t of seedTemplates) {
      await db.template.create({ data: t });
    }

    templates = await db.template.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  const watchlistedIds = (await db.watchlist.findMany({
    where: { shop: session.shop },
    select: { templateId: true }
  })).map((w: { templateId: string }) => w.templateId);
  const subscription = await db.subscription.findUnique({
    where: { shop: session.shop },
  });
  const plan = subscription?.plan || "FREE";
  return { templates, watchlistedIds, plan };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const templateId = formData.get("templateId");
  const intent = formData.get("intent");

  if (!templateId || typeof templateId !== "string") {
    return data({ error: "Invalid template ID" }, { status: 400 });
  }

  if (intent === "use") {
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) {
      return data({ error: "Template not found" }, { status: 404 });
    }

    const newPopup = await db.popup.create({
      data: {
        shop: session.shop,
        name: `My ${template.name}`,
        status: "UNSAVED",
        config: template.config,
      },
    });

    await db.activityLog.create({
      data: { shop: session.shop, action: "CREATED", description: `Created a popup from template '${template.name}'.` },
    });

    return redirect(`/app/templates/builder/${newPopup.id}`);
  }

  if (intent === "watchlist") {
    const existing = await db.watchlist.findFirst({
      where: { shop: session.shop, templateId: templateId }
    });
    if (existing) {
      await db.watchlist.delete({ where: { id: existing.id } });
      return data({ success: true, watchlisted: false });
    } else {
      await db.watchlist.create({
        data: { shop: session.shop, templateId: templateId }
      });
      return data({ success: true, watchlisted: true });
    }
  }

  return data({ error: "Invalid intent" }, { status: 400 });
};

export default function Templates() {
  const { templates, watchlistedIds, plan } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const currentCategory = searchParams.get("category") || "All";
  const currentPlan = searchParams.get("plan") || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "Newest";

  const categories = ["All", "Sale", "Discount", "Newsletter", "Lead Generation", "Product Promotion", "Exit Intent", "Cart Recovery", "New Launch", "Seasonal", "Festival", "Announcement", "Free Shipping"];
  const plans = ["All", "FREE", "GROWTH", "PRO"];

  const filteredTemplates = useMemo(() => {
    const planOrder: Record<string, number> = { "FREE": 1, "GROWTH": 2, "PRO": 3 };
    
    return templates
      .filter(t => currentCategory === "All" || t.category === currentCategory)
      .filter(t => currentPlan === "All" || t.plan === currentPlan)
      .filter(t => currentSearch === "" || t.name.toLowerCase().includes(currentSearch.toLowerCase()) || t.description.toLowerCase().includes(currentSearch.toLowerCase()))
      .sort((a, b) => {
        // First sort by plan (FREE -> GROWTH -> PRO)
        const planDiff = (planOrder[a.plan] || 99) - (planOrder[b.plan] || 99);
        if (planDiff !== 0) return planDiff;

        // Then sort by whatever the user selected
        if (currentSort === "Newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [templates, currentCategory, currentPlan, currentSearch, currentSort]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "All" || value === "") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const planColors: Record<string, string> = {
    FREE: "#aee9d1", // subtle green
    GROWTH: "#fbd38d", // subtle orange
    PRO: "#d4af37", // subtle gold
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 8px 0", color: "#FFFFFF" }}>Templates</h1>
          <p style={{ color: "#8B8D97", margin: 0, fontSize: "15px" }}>Choose from our professionally designed templates and start converting visitors.</p>
        </div>
        <button className="gradient-button" onClick={() => navigate("/app/dashboard")}>
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Search Bar Row */}
      <div className="search-bar-row">
        <div style={{ position: "relative", flex: "1", maxWidth: "300px" }}>
          <span style={{ position: "absolute", left: "12px", top: "10px", color: "#9D4EDD" }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={currentSearch}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="custom-input"
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <div style={{ color: "#8B8D97", fontSize: "14px", flex: "1", textAlign: "center" }}>
          Showing {filteredTemplates.length} templates
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1", justifyContent: "flex-end" }}>
          <span style={{ color: "#8B8D97", fontSize: "14px" }}>Sort by:</span>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "12px", top: "10px", color: "#9D4EDD" }}>✨</span>
            <select 
              value={currentSort} 
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="custom-select"
              style={{ paddingLeft: "36px", width: "160px", appearance: "none" }}
            >
              <option value="Newest">Newest</option>
              <option value="Alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#8B8D97" }}>
          <h2>No templates found</h2>
          <p>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="template-grid">
          {filteredTemplates.map((tpl) => (
            <div key={tpl.id} className="template-card">
              <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden", backgroundColor: "#2A2A35", borderRadius: "8px" }}>
                {(() => {
                  const pConfig = JSON.parse(tpl.config);
                  return (
                    <div style={{
                      ...pConfig.colors,
                      background: pConfig.colors.background,
                      color: pConfig.colors.text,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: pConfig.layout === "split" ? "row" : "column",
                      overflow: "hidden",
                      pointerEvents: "none",
                      boxSizing: "border-box"
                    }}>
                      {pConfig.layout === "split" && pConfig.imageUrl && (
                        <div style={{ flex: 1 }}>
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div style={{ flex: pConfig.layout === "split" ? 1 : undefined, width: "100%", height: "100%", padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
                        {pConfig.layout !== "split" && pConfig.imageUrl && (
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "80px", objectFit: "contain", marginBottom: "12px" }} />
                        )}
                        <div style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "bold", color: pConfig.colors.text, lineHeight: "1.2" }}>{pConfig.content.headline}</div>
                        <p style={{ color: pConfig.colors.text, margin: "0 0 12px 0", fontSize: "13px", lineHeight: "1.4", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{pConfig.content.description}</p>
                        
                        {pConfig.hasEmailInput && (
                          <div style={{ padding: "8px", marginBottom: "10px", width: "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "12px", color: "#888", textAlign: "left", backgroundColor: "#fff" }}>
                            Enter your email
                          </div>
                        )}
                        
                        <div style={{
                          padding: "8px 16px", width: "100%", border: "none", borderRadius: "4px",
                          backgroundColor: pConfig.colors.primary, color: "#fff", fontWeight: "bold", fontSize: "13px", boxSizing: "border-box"
                        }}>
                          {pConfig.content.buttonText}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="template-card-header">
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0", color: "#FFFFFF" }}>{tpl.name}</h3>
                  <p style={{ fontSize: "14px", color: "#8B8D97", margin: 0 }}>{tpl.description}</p>
                </div>
                {tpl.plan !== "FREE" && (
                  <div className="pro-badge" style={{ backgroundColor: tpl.plan === "GROWTH" ? "#fbd38d" : "#FACC15" }}>
                    <span>👑</span> {tpl.plan}
                  </div>
                )}
              </div>

              <div className="template-actions">
                {plan === "FREE" && tpl.plan !== "FREE" ? (
                  <button 
                    className="gradient-button" 
                    style={{ flex: 1 }}
                    onClick={() => navigate("/app/pricing")}
                  >
                    👑 Upgrade to Use
                  </button>
                ) : (
                  <button 
                    className="gradient-button" 
                    style={{ flex: 1 }}
                    onClick={() => fetcher.submit({ templateId: tpl.id, intent: 'use' }, { method: "post" })}
                    disabled={fetcher.state !== "idle" && fetcher.formData?.get("templateId") === tpl.id}
                  >
                    Use Template
                  </button>
                )}
                <button className="btn-outline" onClick={() => setPreviewTemplate(tpl)}>Preview</button>
                <button className="btn-icon" onClick={() => fetcher.submit({ templateId: tpl.id, intent: 'watchlist' }, { method: "post" })}>
                  {watchlistedIds.includes(tpl.id) ? "♥" : "♡"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal Overlay */}
      {previewTemplate && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          {/* Top Bar */}
          <div style={{ width: "100%", padding: "16px", display: "flex", justifyContent: "space-between", backgroundColor: "#111116", borderBottom: "1px solid #232331" }}>
            <h2 style={{ margin: 0, color: "#FFFFFF" }}>{previewTemplate.name} Preview</h2>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button className={previewDevice === "desktop" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("desktop")}>Desktop</button>
              <button className={previewDevice === "tablet" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("tablet")}>Tablet</button>
              <button className={previewDevice === "mobile" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("mobile")}>Mobile</button>
            </div>

            <button onClick={() => setPreviewTemplate(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "28px", color: "#8B8D97" }}>&times;</button>
          </div>

          {/* Simulator Container */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", overflow: "hidden", padding: "24px"
          }}>
            <div style={{
              width: previewDevice === "desktop" ? "1000px" : previewDevice === "tablet" ? "768px" : "375px",
              height: previewDevice === "desktop" ? "600px" : previewDevice === "tablet" ? "1024px" : "812px",
              backgroundColor: "#f4f6f8",
              border: "8px solid #c9cccf",
              borderRadius: "24px",
              position: "relative",
              overflow: "hidden",
              transition: "width 0.3s ease, height 0.3s ease"
            }}>
              {/* Fake Storefront Background */}
              <div style={{ width: "100%", height: "100%", backgroundImage: "url('https://via.placeholder.com/1000x1000?text=Storefront+Background')", backgroundSize: "cover", filter: "blur(4px)" }} />
              
              {/* Fake Overlay */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Rendered Template */}
                <div style={{
                  ...JSON.parse(previewTemplate.config).colors,
                  ...JSON.parse(previewTemplate.config).styles,
                  background: JSON.parse(previewTemplate.config).colors.background,
                  color: JSON.parse(previewTemplate.config).colors.text,
                  width: JSON.parse(previewTemplate.config).layout === "split" ? "600px" : "90%",
                  maxWidth: JSON.parse(previewTemplate.config).layout === "split" ? "600px" : "400px",
                  display: "flex",
                  flexDirection: JSON.parse(previewTemplate.config).layout === "split" ? "row" : "column",
                  overflow: "hidden"
                }}>
                  {JSON.parse(previewTemplate.config).layout === "split" && JSON.parse(previewTemplate.config).imageUrl && (
                    <div style={{ flex: 1 }}>
                      <img src={JSON.parse(previewTemplate.config).imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {JSON.parse(previewTemplate.config).layout !== "split" && JSON.parse(previewTemplate.config).imageUrl && (
                      <img src={JSON.parse(previewTemplate.config).imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", marginBottom: "16px" }} />
                    )}
                    <div style={{ margin: "0 0 16px 0", fontSize: "24px", fontWeight: "bold", color: JSON.parse(previewTemplate.config).colors.text }}>{JSON.parse(previewTemplate.config).content.headline}</div>
                    <p style={{ color: JSON.parse(previewTemplate.config).colors.text, marginBottom: "16px" }}>{JSON.parse(previewTemplate.config).content.description}</p>
                    
                    {JSON.parse(previewTemplate.config).hasEmailInput && (
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        style={{ padding: "10px", marginBottom: "12px", width: "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
                      />
                    )}
                    
                    <button style={{
                      padding: "10px 20px", width: "100%", border: "none", borderRadius: "4px",
                      backgroundColor: JSON.parse(previewTemplate.config).colors.primary, color: "#fff", fontWeight: "bold"
                    }}>
                      {JSON.parse(previewTemplate.config).content.buttonText}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
