import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect, data } from "react-router";
import { useLoaderData, useFetcher, useNavigate, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useMemo } from "react";

export function getContrastColor(hex: string) {
  if (!hex) return '#000000';
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let templates = await db.template.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (templates.length !== 10) {
    console.log("Force reseeding 10 templates directly in loader...");
    await db.template.deleteMany();
    
    const seedTemplates = [
      { name: "Wait! Before you go...", description: "Grab attention with a stunning exit intent popup.", type: "POPUP", category: "Exit Intent", plan: "GROWTH", previewImage: "/3d_purple_bag.png", config: JSON.stringify({ layout: "image-bottom-right", hasEmailInput: true, imageUrl: "/3d_purple_bag.png", colors: { background: "#f4ebff", text: "#000000", primary: "#6223e1", buttonText: "#ffffff" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(109, 40, 217, 0.25)", border: "none" }, content: { headline: "Wait! Before\nyou go...", description: "Get 15% OFF on your order.", buttonText: "Get 15% Off" } }) },
      
      { name: "Free Shipping", description: "Offer free shipping with an eye-catching 3D truck.", type: "POPUP", category: "Free Shipping", plan: "GROWTH", previewImage: "/3d_truck_transparent.png", config: JSON.stringify({ layout: "image-bottom-right", hasEmailInput: false, imageUrl: "/3d_truck_transparent.png", colors: { background: "#e0f2fe", text: "#000000", primary: "#0066ff", buttonText: "#ffffff" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "none" }, content: { headline: "Free Shipping\nOn All Orders", description: "Shop now and get free shipping on all orders.", buttonText: "Shop Now" } }) },
      
      { name: "Subscribe Popup", description: "A clean, modern newsletter capture.", type: "POPUP", category: "Newsletter", plan: "FREE", previewImage: "https://images.unsplash.com/photo-1577563908411-50cb98976efe?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: true, colors: { background: "#ffffff", text: "#111827", primary: "#111827" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }, content: { headline: "Stay in the loop", description: "Get the latest updates, exclusive offers, and more directly to your inbox.", buttonText: "Subscribe Now" } }) },
      
      { name: "Website Redirect", description: "Clean, minimalist redirect popup.", type: "POPUP", category: "Announcement", plan: "FREE", previewImage: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: false, colors: { background: "#ffffff", text: "#000000", primary: "#000000" }, styles: { borderRadius: "12px", padding: "32px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "none" }, content: { headline: "Special Offer", description: "Click the button below to claim your offer on the next page.", buttonText: "Claim Offer", buttonUrl: "" } }) },
      
      // GROWTH
      { name: "CYBER MONDAY", description: "Neon styled cyber monday flash sale with countdown.", type: "POPUP", category: "Sale", plan: "PRO", previewImage: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: false, hasCountdown: true, colors: { background: "#0a0a0c", text: "#ec4899", primary: "#ec4899", buttonText: "#ffffff", shadow: "#ec4899" }, styles: { borderRadius: "16px", padding: "40px", boxShadow: "inset 0 0 20px rgba(236, 72, 153, 0.5)", border: "1px solid rgba(236, 72, 153, 0.2)" }, content: { headline: "CYBER MONDAY", subheadline: "SALE IS LIVE!", description: "Up to 60% OFF on everything.", buttonText: "Shop Now" } }) },
      
      { name: "Hurry Up!", description: "Create massive urgency with a glowing timer.", type: "POPUP", category: "Cart Recovery", plan: "GROWTH", previewImage: "/3d_clock.png", config: JSON.stringify({ layout: "split", hasEmailInput: false, imageUrl: "/3d_clock.png", colors: { background: "#9dc8d7", text: "#164e63", primary: "#ec4899", buttonText: "#ffffff" }, styles: { borderRadius: "24px", padding: "0", boxShadow: "0 20px 50px rgba(236, 72, 153, 0.25)", border: "none" }, content: { headline: "Hurry Up!", description: "Your cart is expiring soon! Complete your checkout now to secure your items.", buttonText: "Checkout Now" } }) },
      
      { name: "VIP Early Access", description: "Exclusive premium design for VIPs.", type: "POPUP", category: "Announcement", plan: "PRO", previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop", config: JSON.stringify({ layout: "modal", hasEmailInput: true, colors: { background: "linear-gradient(to right, #004e8f, #f29e11)", text: "#ffffff", primary: "#de923b", buttonText: "#ffffff" }, styles: { borderRadius: "24px", padding: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", border: "none" }, content: { headline: "VIP Early Access", description: "Enter your email to unlock the secret store before anyone else.", buttonText: "Unlock VIP Access" } }) },
      
      // PRO
      { name: "Ultimate Black Friday", description: "The most aggressive sale template.", type: "POPUP", category: "Sale", plan: "PRO", previewImage: "/3d_black_gift.png", config: JSON.stringify({ layout: "image-bottom-right", hasEmailInput: false, imageUrl: "/3d_black_gift.png", colors: { background: "#111111", text: "#ffffff", primary: "#dd8801", buttonText: "#ffffff" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "none" }, content: { subheadline: "BLACK FRIDAY", headline: "MEGA SALE", description: "Up to 50% OFF on selected items!", buttonText: "Shop Now" } }) },
      
      { name: "New Year Sale", description: "Celebrate the new year with a special offer.", type: "POPUP", category: "Sale", plan: "PRO", previewImage: "/new_year_fireworks.png", config: JSON.stringify({ layout: "background", hasEmailInput: false, imageUrl: "/new_year_fireworks.png", colors: { background: "#050505", text: "#ffffff", primary: "#E0C070", buttonText: "#000000", headlineText: "#E0C070" }, styles: { borderRadius: "16px", padding: "32px", border: "1px solid #E0C070", boxShadow: "0 10px 30px rgba(224, 192, 112, 0.15)" }, content: { subheadline: "New Year Sale", headline: "Flat 30% OFF", description: "On All Orders", buttonText: "Shop Now" } }) },
      
      { name: "Clover Offer", description: "St. Patrick's Day Special Offer design.", type: "POPUP", category: "Offer", plan: "PRO", previewImage: "/3d_clover.png", config: JSON.stringify({ layout: "image-bottom-right", hasEmailInput: true, imageUrl: "/3d_clover.png", colors: { background: "radial-gradient(circle at 30% 50%, #0f4b23 0%, #041a0b 100%)", text: "#ffffff", headlineText: "#3ae168", primary: "#00a845", buttonText: "#ffffff" }, styles: { borderRadius: "16px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 168, 69, 0.25)", border: "none" }, content: { headline: "St. Patrick's Day\nSpecial Offer", description: "Get 25% OFF on your order.", buttonText: "Claim Offer" } }) }
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

    const pConfig = JSON.parse(template.config);
    pConfig.templatePlan = template.plan;
    pConfig.templateName = template.name;

    const newPopup = await db.popup.create({
      data: {
        shop: session.shop,
        name: template.name,
        status: "UNSAVED",
        config: JSON.stringify(pConfig),
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
                      background: pConfig.layout === "background" && pConfig.imageUrl ? `${pConfig.colors.background || '#000'} url(${pConfig.imageUrl}) center/100% 100% no-repeat` : pConfig.colors.background,
                      color: pConfig.colors.text,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: pConfig.layout === "split" ? "row" : "column",
                      alignItems: pConfig.layout === "background" ? "center" : "stretch",
                      overflow: "hidden",
                      pointerEvents: "none",
                      boxSizing: "border-box"
                    }}>
                      {pConfig.layout === "split" && pConfig.imageUrl && (
                        <div style={{ flex: 1 }}>
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div style={{ flex: pConfig.layout === "split" ? 1 : undefined, width: "100%", height: "100%", padding: pConfig.layout === "split" ? "16px" : "20px", textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: pConfig.layout === "image-bottom-right" ? "flex-start" : "center", boxSizing: "border-box", position: "relative", zIndex: 2 }}>
                        {pConfig.layout === "image-bottom-right" && pConfig.imageUrl && (
                          <img src={pConfig.imageUrl} alt="Popup Image" style={tpl.name === "Clover Offer" ? { position: "absolute", top: "0px", bottom: "0px", right: "0px", width: "50%", height: "100%", objectFit: "cover", objectPosition: "right center", zIndex: 1 } : { position: "absolute", bottom: "0px", right: "0px", width: "130px", height: "auto", objectFit: "contain", zIndex: 1 }} />
                        )}
                        {pConfig.layout !== "split" && pConfig.layout !== "image-bottom-right" && pConfig.layout !== "background" && pConfig.imageUrl && (
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "70px", objectFit: "contain", marginBottom: "8px" }} />
                        )}
                        <div style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "bold", color: tpl.name.includes("New Year Sale") ? pConfig.colors.text : (pConfig.colors.headlineText || pConfig.colors.text), lineHeight: "1.2", whiteSpace: "pre-wrap", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.headline}</div>
                        {pConfig.content.subheadline && (
                          <div style={{ fontSize: "13px", fontWeight: "bold", margin: "-4px 0 6px 0", color: tpl.name.includes("New Year Sale") ? pConfig.colors.text : pConfig.colors.primary, lineHeight: "1.2", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.subheadline}</div>
                        )}
                        <p style={{ color: tpl.name.includes("New Year Sale") ? (pConfig.colors.background && (() => { const hex = pConfig.colors.background.replace('#', ''); const r = parseInt(hex.substring(0,2), 16) || 0; const g = parseInt(hex.substring(2,4), 16) || 0; const b = parseInt(hex.substring(4,6), 16) || 0; return ((r * 299 + g * 587 + b * 114) / 1000 >= 128) ? '#000' : '#fff'; })()) : pConfig.colors.text, margin: "0 0 8px 0", fontSize: "12px", lineHeight: "1.3", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxWidth: pConfig.layout === "image-bottom-right" ? "60%" : "none", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.description}</p>
                        
                        {pConfig.hasCountdown && (
                          <div style={{ display: "flex", justifyContent: "center", gap: "4px", margin: "4px 0 8px 0" }}>
                            {[{ l: "D", v: "02" }, { l: "H", v: "14" }, { l: "M", v: "36" }, { l: "S", v: "52" }].map((u, i) => (
                              <div key={i} style={{ backgroundColor: "#1a1a1f", borderRadius: "4px", padding: "4px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", minWidth: "24px" }}>
                                <span style={{ fontSize: "11px", fontWeight: "bold", color: "#ffffff", lineHeight: "1" }}>{u.v}</span>
                                <span style={{ fontSize: "7px", color: "#a1a1aa", marginTop: "2px" }}>{u.l}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {pConfig.hasEmailInput && (
                          <div style={{ padding: "6px 8px", marginBottom: "8px", width: pConfig.layout === "image-bottom-right" ? "55%" : "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", fontSize: "11px", color: "#888", textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", backgroundColor: "#fff", position: "relative", zIndex: 2 }}>
                            Enter your email
                          </div>
                        )}
                        
                        <div style={{
                          padding: "6px 12px", width: pConfig.layout === "image-bottom-right" || pConfig.layout === "background" ? "max-content" : "100%", border: "none", borderRadius: "4px",
                          backgroundColor: pConfig.colors.primary, color: "#fff", fontWeight: "bold", fontSize: "12px", boxSizing: "border-box", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", alignSelf: pConfig.layout === "image-bottom-right" ? "flex-start" : "center"
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
                {(() => {
                  const pConfig = JSON.parse(previewTemplate.config);
                  const isMobile = previewDevice === "mobile";
                  return (
                    <div style={{
                      ...pConfig.colors,
                      ...pConfig.styles,
                      background: pConfig.layout === "background" && pConfig.imageUrl ? `${pConfig.colors.background || 'transparent'} url('${pConfig.imageUrl}') center/100% 100% no-repeat` : pConfig.colors.background,
                      color: pConfig.colors.text,
                      width: pConfig.layout === "split" ? (isMobile ? "90%" : "600px") : (pConfig.layout === "background" ? (isMobile ? "90%" : "400px") : "90%"),
                      maxWidth: pConfig.layout === "split" ? (isMobile ? "400px" : "600px") : (pConfig.layout === "background" ? (isMobile ? "400px" : "400px") : "400px"),
                      minHeight: pConfig.layout === "background" ? (isMobile ? "auto" : "360px") : "auto",
                      display: "flex",
                      flexDirection: pConfig.layout === "split" ? (isMobile ? "column" : "row") : "column",
                      alignItems: pConfig.layout === "background" ? "flex-end" : "stretch",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      {pConfig.layout === "split" && pConfig.imageUrl && (
                        <div style={{ flex: isMobile ? "none" : 1, width: "100%", height: isMobile ? "220px" : "auto" }}>
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      {pConfig.layout === "image-bottom-right" && pConfig.imageUrl && (
                        <img src={pConfig.imageUrl} alt="Popup Image" style={previewTemplate.name === "Clover Offer" ? { position: "absolute", top: "0px", bottom: "0px", right: isMobile ? "0px" : "-5px", width: isMobile ? "65%" : "65%", maxWidth: isMobile ? "180px" : "300px", height: "100%", objectFit: "cover", objectPosition: "right center", zIndex: 1 } : { position: "absolute", bottom: isMobile ? "40px" : "40px", right: isMobile ? "0px" : "0px", width: isMobile ? "55%" : "55%", maxWidth: isMobile ? "180px" : "240px", height: "auto", objectFit: "contain", zIndex: 1 }} />
                      )}
                      <div style={{ flex: 1, width: pConfig.layout === "background" ? "100%" : "auto", height: "100%", padding: pConfig.layout === "split" ? (isMobile ? "16px" : "24px") : pConfig.layout === "image-bottom-right" ? (isMobile ? "16px 16px 16px 0px" : "24px 24px 24px 0px") : (isMobile ? "16px" : "32px"), textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", display: "flex", flexDirection: "column", gap: pConfig.layout === "background" ? "0px" : "16px", justifyContent: "center", alignItems: pConfig.layout === "image-bottom-right" ? "flex-start" : "center", position: "relative", zIndex: 2 }}>
                        {pConfig.layout !== "split" && pConfig.layout !== "image-bottom-right" && pConfig.layout !== "background" && pConfig.imageUrl && (
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", marginBottom: "16px" }} />
                        )}
                        <div style={{ margin: 0, fontSize: isMobile ? "20px" : "24px", fontWeight: "bold", lineHeight: "1.3", wordBreak: "break-word", color: (/new year sale/i.test(previewTemplate.name) || (pConfig.imageUrl && pConfig.imageUrl.includes('new_year_fireworks'))) ? (pConfig.colors.text || "#000000") : (pConfig.colors.headlineText || pConfig.colors.text), position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", maxWidth: pConfig.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none" }}>
                          {(pConfig.content.headline || "").split('\n').map((line, i) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </div>
                        {pConfig.content.subheadline && (
                          <div style={{ margin: "0 0 8px 0", fontSize: isMobile ? "16px" : "20px", fontWeight: "bold", lineHeight: "1.2", color: (/new year sale/i.test(previewTemplate.name) || (pConfig.imageUrl && pConfig.imageUrl.includes('new_year_fireworks'))) ? (pConfig.colors.text || "#000000") : pConfig.colors.primary, position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", maxWidth: pConfig.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none" }}>{pConfig.content.subheadline}</div>
                        )}
                        <p style={{ margin: 0, fontSize: isMobile ? "14px" : "16px", lineHeight: "1.5", color: (/new year sale/i.test(previewTemplate.name) || (pConfig.imageUrl && pConfig.imageUrl.includes('new_year_fireworks'))) ? getContrastColor(pConfig.colors.background || "#050505") : pConfig.colors.text, maxWidth: pConfig.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.description}</p>
                        
                        {pConfig.hasCountdown && (
                          <div style={{ display: "flex", justifyContent: "center", gap: "12px", margin: "8px 0 16px 0" }}>
                            {[{ l: "Days", v: "02" }, { l: "Hours", v: "14" }, { l: "Mins", v: "36" }, { l: "Secs", v: "52" }].map((u, i) => (
                              <div key={i} style={{ backgroundColor: "#1a1a1f", borderRadius: "8px", padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", minWidth: "48px" }}>
                                <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff", lineHeight: "1" }}>{u.v}</span>
                                <span style={{ fontSize: "10px", color: "#a1a1aa", marginTop: "4px", textTransform: "uppercase" }}>{u.l}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {pConfig.hasEmailInput && (
                          <input 
                            type="email" 
                            placeholder="Enter your email" 
                            style={{ padding: "10px", width: pConfig.layout === "image-bottom-right" ? "55%" : "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", pointerEvents: "none", textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}
                            readOnly
                          />
                        )}
                        
                        <div style={{
                          padding: isMobile ? "8px 16px" : "12px 24px", width: pConfig.layout === "image-bottom-right" || pConfig.layout === "background" ? "max-content" : "100%", maxWidth: pConfig.layout === "image-bottom-right" ? "55%" : "none", border: "none", borderRadius: "4px",
                          backgroundColor: pConfig.colors.primary, color: "#fff", fontWeight: "bold", fontSize: isMobile ? "14px" : "16px", whiteSpace: "nowrap", boxSizing: "border-box", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center", alignSelf: pConfig.layout === "image-bottom-right" ? "flex-start" : "center"
                        }}>
                          {pConfig.content.buttonText}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
