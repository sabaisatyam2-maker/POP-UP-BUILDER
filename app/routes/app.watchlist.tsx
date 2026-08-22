import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  // Fetch watchlist entries and include the template data
  const watchlistItems = await db.watchlist.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // We need to fetch the actual templates manually since there's no relation in schema
  // (Assuming schema doesn't have a strict relation, we can fetch them via IDs)
  const templateIds = watchlistItems.map(w => w.templateId);
  
  const templates = await db.template.findMany({
    where: { id: { in: templateIds } }
  });

  // Map watchlist IDs to templates
  const savedTemplates = watchlistItems.map(w => ({
    watchlistId: w.id,
    template: templates.find(t => t.id === w.templateId)!
  })).filter(item => item.template !== undefined);

  return { savedTemplates };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const intent = formData.get("intent");
  const watchlistId = formData.get("watchlistId");
  const templateId = formData.get("templateId");

  if (intent === "remove" && typeof watchlistId === "string") {
    await db.watchlist.delete({
      where: { id: watchlistId, shop: session.shop }
    });
    return data({ success: true });
  }

  if (intent === "use" && typeof templateId === "string") {
    const template = await db.template.findUnique({ where: { id: templateId } });
    if (!template) return data({ error: "Template not found" }, { status: 404 });

    const newPopup = await db.popup.create({
      data: {
        shop: session.shop,
        name: template.name,
        status: "DRAFT",
        config: template.config,
      },
    });
    return redirect(`/app/builder/${newPopup.id}`);
  }

  return data({ error: "Invalid request" }, { status: 400 });
};

export default function Watchlist() {
  const { savedTemplates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 8px 0", color: "#FFFFFF" }}>Your Wishlist</h1>
          <p style={{ color: "#8B8D97", fontSize: "16px", margin: "8px 0 0 0" }}>Templates you've saved for later.</p>
        </div>
      </div>

      {savedTemplates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#8B8D97", backgroundColor: "#1A1A24", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
          <h2 style={{ color: "#FFF", fontSize: "24px", margin: "0 0 12px 0" }}>No saved templates</h2>
          <p style={{ margin: "0 0 24px 0" }}>You haven't added any templates to your wishlist yet.</p>
          <button className="gradient-button" onClick={() => navigate("/app/templates")}>
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="template-grid">
          {savedTemplates.map((item) => (
            <div key={item.watchlistId} className="template-card">
              <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden", backgroundColor: "#2A2A35", borderRadius: "8px" }}>
                {(() => {
                  const pConfig = JSON.parse(item.template.config);
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
                          <img src={pConfig.imageUrl} alt="Popup Image" style={item.template.name === "Clover Offer" ? { position: "absolute", top: "0px", bottom: "0px", right: "0px", width: "50%", height: "100%", objectFit: "cover", objectPosition: "right center", zIndex: 1 } : { position: "absolute", bottom: "0px", right: "0px", width: "130px", height: "auto", objectFit: "contain", zIndex: 1 }} />
                        )}
                        {pConfig.layout !== "split" && pConfig.layout !== "image-bottom-right" && pConfig.layout !== "background" && pConfig.imageUrl && (
                          <img src={pConfig.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "70px", objectFit: "contain", marginBottom: "8px" }} />
                        )}
                        <div style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "bold", color: item.template.name.includes("New Year Sale") ? pConfig.colors.text : (pConfig.colors.headlineText || pConfig.colors.text), lineHeight: "1.2", whiteSpace: "pre-wrap", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.headline}</div>
                        {pConfig.content.subheadline && (
                          <div style={{ fontSize: "13px", fontWeight: "bold", margin: "-4px 0 6px 0", color: item.template.name.includes("New Year Sale") ? pConfig.colors.text : pConfig.colors.primary, lineHeight: "1.2", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.subheadline}</div>
                        )}
                        <p style={{ color: item.template.name.includes("New Year Sale") ? (pConfig.colors.background && (() => { const hex = pConfig.colors.background.replace('#', ''); const r = parseInt(hex.substring(0,2), 16) || 0; const g = parseInt(hex.substring(2,4), 16) || 0; const b = parseInt(hex.substring(4,6), 16) || 0; return ((r * 299 + g * 587 + b * 114) / 1000 >= 128) ? '#000' : '#fff'; })()) : pConfig.colors.text, margin: "0 0 8px 0", fontSize: "12px", lineHeight: "1.3", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxWidth: pConfig.layout === "image-bottom-right" ? "60%" : "none", position: "relative", zIndex: 2, textAlign: pConfig.layout === "image-bottom-right" ? "left" : "center" }}>{pConfig.content.description}</p>
                        
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
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0", color: "#FFFFFF" }}>{item.template.name}</h3>
                  <p style={{ fontSize: "14px", color: "#8B8D97", margin: 0 }}>{item.template.description}</p>
                </div>
                {item.template.plan !== "FREE" && (
                  <div className="pro-badge" style={{ backgroundColor: item.template.plan === "GROWTH" ? "#fbd38d" : "#FACC15" }}>
                    <span>👑</span> {item.template.plan}
                  </div>
                )}
              </div>

              <div className="template-actions">
                <button 
                  className="gradient-button" 
                  style={{ flex: 1 }}
                  onClick={() => fetcher.submit({ templateId: item.template.id, intent: 'use' }, { method: "post" })}
                  disabled={fetcher.state !== "idle" && fetcher.formData?.get("templateId") === item.template.id}
                >
                  Use Template
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => fetcher.submit({ intent: 'remove', watchlistId: item.watchlistId }, { method: "post" })}
                  disabled={fetcher.state !== "idle" && fetcher.formData?.get("watchlistId") === item.watchlistId}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
