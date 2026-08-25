import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useEffect } from "react";
import { getEntitlements, type PlanType } from "../lib/entitlements";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  if (!params.id) return redirect("/app");

  const popup = await db.popup.findUnique({
    where: { id: params.id, shop: session.shop },
  });

  if (!popup) return redirect("/app");

  const subscription = await db.subscription.findUnique({
    where: { shop: session.shop },
  });
  const plan = (subscription?.plan as PlanType) || "FREE";
  const entitlements = getEntitlements(plan);

  return { popup, plan, entitlements };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const id = formData.get("id");
  const configStr = formData.get("config");
  const name = formData.get("name");
  const status = formData.get("status");
  const intent = formData.get("intent");

  if (typeof configStr !== "string" || typeof name !== "string" || typeof status !== "string") {
    return data({ error: "Invalid form data" }, { status: 400 });
  }

  if (status === "ACTIVE") {
    const subscription = await db.subscription.findUnique({ where: { shop: session.shop } });
    const plan = (subscription?.plan as any) || "FREE";
    
    // Count active popups EXCLUDING the current one (in case it is already active and just being updated)
    const activeCount = await db.popup.count({ 
      where: { shop: session.shop, status: "ACTIVE", id: { not: id as string } } 
    });
    const { canCreatePopup } = await import("../lib/entitlements");
    if (!canCreatePopup(activeCount, plan)) {
      return data({ error: `Plan limit reached. Your ${plan} plan allows maximum active popups.` }, { status: 400 });
    }
  }

  const updatedPopup = await db.popup.update({
    where: { id: id as string, shop: session.shop },
    data: {
      name,
      status,
      config: configStr,
    },
  });

  await db.activityLog.create({
    data: { shop: session.shop, action: "UPDATED", description: `Updated popup '${name}'.` },
  });

  if (intent === "publish") {
    return redirect("/app");
  }

  return data({ success: true, popup: updatedPopup });
};

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

export default function Builder() {
  const { popup, plan, entitlements } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [name, setName] = useState(popup.name);
  const [config, setConfig] = useState(JSON.parse(popup.config));
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const isMobile = previewDevice === "mobile";

  useEffect(() => {
    const data = fetcher.data as any;
    if (data?.error) {
      (window as any).shopify.toast.show(data.error, { isError: true });
    }
  }, [fetcher.data]);

  const getContrastColorLocal = (bg: string) => {
    if (bg.includes('gradient')) {
      if (bg.includes('white') || bg.includes('#fff') || bg.includes('#ffffff') || bg.includes('transparent')) return "#000000";
      return "#ffffff";
    }
    return getContrastColor(bg);
  };

  const updateShadowColor = (newColor: string) => {
    const currentShadow = config.styles?.boxShadow || "0 4px 12px rgba(0,0,0,0.15)";
    const newShadow = currentShadow.replace(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+)\s*)?\)/g, (match: string, p1: string) => {
      const alpha = p1 ? parseFloat(p1) : 1;
      let r = 0, g = 0, b = 0;
      if (newColor.length === 4) {
        r = parseInt(newColor[1] + newColor[1], 16);
        g = parseInt(newColor[2] + newColor[2], 16);
        b = parseInt(newColor[3] + newColor[3], 16);
      } else if (newColor.length === 7) {
        r = parseInt(newColor.slice(1, 3), 16);
        g = parseInt(newColor.slice(3, 5), 16);
        b = parseInt(newColor.slice(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    });
    
    setConfig({ 
      ...config, 
      colors: { ...config.colors, shadow: newColor }, 
      styles: { ...config.styles, boxShadow: newShadow } 
    });
  };

  const handleSave = (status: string = "DRAFT", intent: string = "save") => {
    const finalStatus = (status === "UNSAVED" && intent === "save") ? "DRAFT" : status;
    fetcher.submit(
      { id: popup.id, name, status: finalStatus, config: JSON.stringify(config), intent },
      { method: "post" }
    );
  };

  // Helper to render locked feature state
  const renderLocked = (featureName: string) => (
    <div style={{ 
      padding: "8px", 
      border: "1px dashed #3A3A4A", 
      borderRadius: "4px", 
      backgroundColor: "#2A2A35", 
      marginTop: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px"
    }}>
      <span style={{ color: "#A0A0AB", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        🔒 {featureName}
      </span>
      <button 
        onClick={() => navigate("/app/pricing")}
        style={{
          padding: "4px 8px",
          fontSize: "11px",
          fontWeight: "bold",
          backgroundColor: "#3A3A4A",
          border: "1px solid #4A4A5A",
          borderRadius: "4px",
          cursor: "pointer",
          color: "#FFFFFF",
          flexShrink: 0
        }}
      >
        Upgrade
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0F0F13" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "#1A1A24", borderBottom: "1px solid #232331", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button 
            onClick={() => navigate("/app/templates")}
            style={{ padding: "8px 16px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold" }}
          >
            ← Back
          </button>
          <span 
            style={{ fontSize: "18px", fontWeight: "bold", color: "#FFFFFF" }}
          >
            {name}
          </span>
          <span style={{ fontSize: "12px", padding: "2px 8px", backgroundColor: "#3A3A4A", color: "#FFFFFF", borderRadius: "12px" }}>{plan} Plan</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={() => handleSave(popup.status, "save")} 
            disabled={fetcher.state !== "idle"}
            style={{ padding: "10px 20px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold", transition: "all 0.2s", opacity: fetcher.state !== "idle" ? 0.6 : 1 }}
          >
            {fetcher.state !== "idle" && fetcher.formData?.get("intent") !== "publish" ? "Saving..." : "Save"}
          </button>
          <button 
            className="gradient-button"
            onClick={() => handleSave("ACTIVE", "publish")}
            disabled={fetcher.state !== "idle"}
            style={{ padding: "10px 24px", fontSize: "14px", opacity: fetcher.state !== "idle" ? 0.8 : 1 }}
          >
            {fetcher.state !== "idle" && fetcher.formData?.get("intent") === "publish" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="builder-layout-wrapper" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Removed Left Sidebar */}

        {/* CENTER: Live Preview */}
        <div className="builder-preview-center" style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0F0F13", overflow: "hidden", position: "relative" }}>
          
          {/* Device Toggles */}
          <div style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", gap: "12px", backgroundColor: "#111116", borderBottom: "1px solid #232331", zIndex: 20 }}>
            <button className={previewDevice === "desktop" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("desktop")} style={previewDevice !== "desktop" ? { padding: "8px 16px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold" } : { padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Desktop</button>
            <button className={previewDevice === "tablet" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("tablet")} style={previewDevice !== "tablet" ? { padding: "8px 16px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold" } : { padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Tablet</button>
            <button className={previewDevice === "mobile" ? "gradient-button" : "btn-outline"} onClick={() => setPreviewDevice("mobile")} style={previewDevice !== "mobile" ? { padding: "8px 16px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold" } : { padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Mobile</button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", overflowY: "auto", overflowX: "hidden", position: "relative", width: "100%" }}>
            {/* Mock Storefront Background */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url('https://via.placeholder.com/1200x800?text=Your+Storefront')", backgroundSize: "cover", opacity: 0.1 }} />
            
            {/* Simulator Container */}
            <div style={{
              flexShrink: 0,
              width: previewDevice === "desktop" ? "1000px" : previewDevice === "tablet" ? "768px" : "375px",
              height: "fit-content",
              minHeight: "400px",
              padding: "40px 0",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "24px",
              position: "relative",
              overflow: "hidden",
              transition: "width 0.3s ease",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: previewDevice === "tablet" || previewDevice === "desktop" ? "scale(0.85)" : "scale(0.95)",
              transformOrigin: "top center",
              margin: "auto 0"
            }}>
              
              {/* Fake Overlay */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1 }} />

              {/* Popup Canvas */}
              <div 
                style={{
                  ...config.colors,
                  ...config.styles,
                  background: config.layout === "background" && config.imageUrl ? `${config.colors?.background || 'transparent'} url('${config.imageUrl}') center/100% 100% no-repeat` : config.colors?.background || "#ffffff",
                  color: config.colors?.text || "#000000",
                  width: "90%",
                  maxWidth: config.layout === "split" ? "600px" : "400px",
                  minHeight: config.layout === "background" ? (isMobile ? "auto" : "360px") : "auto",
                  display: "flex",
                  flexDirection: config.layout === "split" ? (isMobile ? "column" : "row") : "column",
                  alignItems: config.layout === "background" ? "flex-end" : "stretch",
                  overflowX: "hidden",
                  overflowY: "hidden",
                  position: "relative",
                  height: "fit-content",
                  boxSizing: "border-box",
                  padding: popup.name.includes("CYBER MONDAY") ? (isMobile ? "16px" : "24px") : (config.styles?.padding || undefined),
                  zIndex: 10
                }}
              >
                {/* NON-NEGOTIABLE CLOSE BUTTON RULE */}
                <button 
                  onClick={() => {}} 
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "24px",
                    height: "24px",
                    background: "transparent",
                    border: "none",
                    color: config.colors?.background === "#ffffff" ? "#000000" : "#ffffff",
                    fontSize: "28px",
                    lineHeight: "1",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 99,
                    opacity: 0.7
                  }}
                  title="Close Button (Mandatory)"
                >
                  &times;
                </button>
                
                {config.layout === "split" && config.imageUrl && (
                  <div style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", height: isMobile ? "220px" : "auto", backgroundColor: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={config.imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                
                {config.layout === "image-bottom-right" && config.imageUrl && (
                  <img src={config.imageUrl} alt="Popup Image" style={popup.name === "Clover Offer" ? { position: "absolute", top: "0px", bottom: "0px", right: isMobile ? "0px" : "-5px", width: isMobile ? "65%" : "65%", maxWidth: isMobile ? "180px" : "300px", height: "100%", objectFit: "cover", objectPosition: "right center", zIndex: 1 } : { position: "absolute", bottom: isMobile ? "40px" : "40px", right: isMobile ? "0px" : "0px", width: isMobile ? "55%" : "55%", maxWidth: isMobile ? "180px" : "240px", height: "auto", objectFit: "contain", zIndex: 1 }} />
                )}

                <div style={{ flex: config.layout === "split" ? (isMobile ? "none" : 1) : undefined, width: config.layout === "background" ? "100%" : "auto", padding: popup.name.includes("CYBER MONDAY") ? "12px" : (config.layout === "split" ? (isMobile ? "16px" : "24px") : config.layout === "image-bottom-right" ? (isMobile ? "16px 16px 16px 0px" : "24px 24px 24px 0px") : (isMobile ? "16px" : "32px")), textAlign: config.layout === "image-bottom-right" ? "left" : "center", display: "flex", flexDirection: "column", gap: popup.name.includes("CYBER MONDAY") ? "8px" : "16px", justifyContent: "center", alignItems: config.layout === "image-bottom-right" ? "flex-start" : "center", position: "relative", zIndex: 2 }}>
                  {config.layout !== "split" && config.layout !== "image-bottom-right" && config.layout !== "background" && config.imageUrl && (
                    <img src={config.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", marginBottom: popup.name.includes("CYBER MONDAY") ? "8px" : "16px" }} />
                  )}
                  
                  <div style={{ margin: 0, fontSize: popup.name.includes("CYBER MONDAY") ? (isMobile ? "20px" : "24px") : (isMobile ? "20px" : "24px"), fontWeight: "bold", lineHeight: "1.3", wordBreak: "break-word", color: (/new year sale/i.test(popup.name) || (config.imageUrl && config.imageUrl.includes('new_year_fireworks'))) ? (config.colors?.text || "#000000") : (config.colors?.headlineText || config.colors?.text || "#000000"), position: "relative", zIndex: 2, textAlign: config.layout === "image-bottom-right" ? "left" : "center", maxWidth: config.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none" }}>
                    {(config.content?.headline || "Headline").split('\n').map((line: string, i: number) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>

                  {config.content?.subheadline && (
                    <div style={{ margin: popup.name.includes("CYBER MONDAY") ? "0 0 4px 0" : "0 0 8px 0", fontSize: popup.name.includes("CYBER MONDAY") ? (isMobile ? "16px" : "18px") : (isMobile ? "16px" : "20px"), fontWeight: "bold", lineHeight: "1.2", color: (/new year sale/i.test(popup.name) || (config.imageUrl && config.imageUrl.includes('new_year_fireworks'))) ? (config.colors?.text || "#000000") : (config.colors?.primary || "#000000"), position: "relative", zIndex: 2, textAlign: config.layout === "image-bottom-right" ? "left" : "center", maxWidth: config.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none" }}>
                      {config.content.subheadline}
                    </div>
                  )}
                  
                  {popup.name.includes("CYBER MONDAY") && (
                    <div style={{ display: "flex", justifyContent: "center", gap: popup.name.includes("CYBER MONDAY") ? "8px" : "12px", margin: popup.name.includes("CYBER MONDAY") ? "4px 0 8px 0" : "8px 0 16px 0", transform: popup.name.includes("CYBER MONDAY") ? "scale(0.85)" : "none" }}>
                      {[
                        { label: "Days", value: "02" },
                        { label: "Hours", value: "14" },
                        { label: "Mins", value: "35" },
                        { label: "Secs", value: "59" }
                      ].map((unit, idx) => (
                        <div key={idx} style={{ backgroundColor: "#1a1a1f", borderRadius: "8px", padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", border: "1px solid rgba(255,255,255,0.05)", minWidth: "48px" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ffffff", lineHeight: "1" }}>{unit.value}</div>
                          <div style={{ fontSize: "10px", color: "#a1a1aa", marginTop: "4px", textTransform: "uppercase" }}>{unit.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p style={{ margin: 0, fontSize: popup.name.includes("CYBER MONDAY") ? (isMobile ? "12px" : "14px") : (isMobile ? "14px" : "16px"), lineHeight: "1.5", color: (/new year sale/i.test(popup.name) || (config.imageUrl && config.imageUrl.includes('new_year_fireworks'))) ? getContrastColor(config.colors?.background || "#050505") : (config.colors?.text || "#000000"), wordBreak: "break-word", maxWidth: config.layout === "image-bottom-right" ? (isMobile ? "58%" : "55%") : "none", position: "relative", zIndex: 2, textAlign: config.layout === "image-bottom-right" ? "left" : "center" }}>
                    {config.content?.description || "Description text goes here."}
                  </p>

                  {config.hasEmailInput && (
                    <input 
                      type="email" 
                      placeholder="Enter your email" 
                      style={{ padding: "10px", width: config.layout === "image-bottom-right" ? "55%" : "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", pointerEvents: "none", textAlign: config.layout === "image-bottom-right" ? "left" : "center" }}
                      readOnly
                    />
                  )}

                  <button 
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      padding: isMobile ? "8px 16px" : "12px 24px",
                      backgroundColor: config.colors?.primary || "#000000",
                      color: config.colors?.buttonText || getContrastColor(config.colors?.primary || "#000000"),
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      wordWrap: "break-word",
                      alignSelf: config.layout === "image-bottom-right" ? "flex-start" : "center",
                      width: config.layout === "image-bottom-right" || config.layout === "background" ? "max-content" : "100%",
                      maxWidth: config.layout === "image-bottom-right" ? "55%" : "100%",
                      position: "relative", zIndex: 2, textAlign: config.layout === "image-bottom-right" ? "left" : "center"
                    }}
                  >
                    {config.content?.buttonText || "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Settings Sidebar */}
        <div className="builder-sidebar-right" style={{ width: "320px", backgroundColor: "#1A1A24", borderLeft: "1px solid #232331", padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", color: "#FFFFFF" }}>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Popup Settings</h2>
          
          {/* Content Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, color: "#E0E0E0" }}>Content</h3>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Headline</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.headline?.length || 0}/{config.layout === "image-bottom-right" ? 40 : 100}</span>
            </div>
            <input 
              type="text" 
              value={config.content.headline} 
              maxLength={config.layout === "image-bottom-right" ? 40 : 100}
              onChange={(e) => setConfig({ ...config, content: { ...config.content, headline: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            {(popup.name.includes("CYBER MONDAY") || popup.name === "Ultimate Black Friday" || popup.name === "New Year Sale") && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Subheadline</label>
                  <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.subheadline?.length || 0}/100</span>
                </div>
                <input 
                  type="text" 
                  value={config.content.subheadline || ""} 
                  maxLength={100}
                  onChange={(e) => setConfig({ ...config, content: { ...config.content, subheadline: e.target.value } })}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
                />
              </>
            )}

            {popup.name.includes("CYBER MONDAY") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Timer End Date</label>
                <input 
                  type="datetime-local" 
                  value={config.content.countdownTarget || ""} 
                  onChange={(e) => setConfig({ ...config, content: { ...config.content, countdownTarget: e.target.value } })}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", colorScheme: "dark" }}
                />
                <span style={{ fontSize: "11px", color: "#A0A0AB" }}>If not set, timer defaults to 48 hours.</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Description</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.description?.length || 0}/{config.layout === "image-bottom-right" ? 120 : 400}</span>
            </div>
            <textarea 
              value={config.content.description} 
              maxLength={config.layout === "image-bottom-right" ? 120 : 400}
              onChange={(e) => setConfig({ ...config, content: { ...config.content, description: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", minHeight: "80px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Button Text</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.buttonText?.length || 0}/25</span>
            </div>
            <input 
              type="text" 
              value={config.content.buttonText} 
              maxLength={25}
              className="builder-input"
              onChange={(e) => setConfig({ ...config, content: { ...config.content, buttonText: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            <label style={{ fontSize: "13px", fontWeight: "bold", marginTop: "4px", color: "#FFFFFF" }}>Button Redirect URL</label>
            <input 
              type="url" 
              placeholder="https://example.com/offer"
              value={config.content.buttonUrl || ""} 
              onChange={(e) => setConfig({ ...config, content: { ...config.content, buttonUrl: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            {popup.name === "Hurry Up!" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Custom Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) { // 2MB limit
                        alert("File size is too large. Please upload an image smaller than 2MB.");
                        e.target.value = ''; // Reset input
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setConfig({ ...config, imageUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", fontSize: "12px" }}
                />
                <span style={{ fontSize: "11px", color: "#A0A0AB" }}>Max 2MB (Auto-fits)</span>
              </div>
            )}
          </div>

          {/* Design Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", borderTop: "1px solid #232331" }}>
            <h3 style={{ fontSize: "15px", margin: 0, color: "#E0E0E0" }}>Design Colors</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Popup Background Color</label>
              {plan !== "FREE" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {(popup.name === "Clover Offer" || popup.name === "VIP Early Access") ? (
                    <>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{ position: "relative", width: "38px", height: "38px", borderRadius: "4px", overflow: "hidden", border: "1px solid #3A3A4A" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: config.colors.background, pointerEvents: "none" }} />
                          <input 
                            type="color"
                            value={config.colors.background?.startsWith('#') && (config.colors.background.length === 7 || config.colors.background.length === 4) ? config.colors.background : "#ffffff"}
                            onChange={(e) => {
                              const bg = e.target.value;
                              const text = getContrastColor(bg);
                              setConfig({ ...config, colors: { ...config.colors, background: bg, text: text } });
                            }}
                            style={{ position: "absolute", top: "-10px", left: "-10px", width: "60px", height: "60px", opacity: 0, cursor: "pointer" }}
                          />
                        </div>
                        <input 
                          type="text"
                          value={config.colors.background}
                          onChange={(e) => {
                            const bg = e.target.value;
                            const text = getContrastColor(bg);
                            setConfig({ ...config, colors: { ...config.colors, background: bg, text: text } });
                          }}
                          style={{ flex: 1, padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", boxSizing: "border-box" }}
                        />
                      </div>
                      <span style={{ fontSize: "11px", color: "#A0A0AB" }}>*Here you can use gradient feature also.</span>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="color"
                        value={config.colors.background?.startsWith('#') && (config.colors.background.length === 7 || config.colors.background.length === 4) ? config.colors.background : "#ffffff"}
                        onChange={(e) => {
                          const bg = e.target.value;
                          const text = getContrastColor(bg);
                          setConfig({ ...config, colors: { ...config.colors, background: bg, text: text } });
                        }}
                        style={{ width: "38px", height: "38px", padding: "0", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                      />
                      <input 
                        type="text"
                        value={config.colors.background}
                        onChange={(e) => {
                          const bg = e.target.value;
                          if (bg.includes("gradient")) {
                            alert("Gradient feature is exclusively available for VIP Early Access and Clover Offer templates.");
                            return;
                          }
                          const text = getContrastColor(bg);
                          setConfig({ ...config, colors: { ...config.colors, background: bg, text: text } });
                        }}
                        style={{ flex: 1, padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <select 
                  value={config.colors.background} 
                  onChange={(e) => {
                    const bg = e.target.value;
                    const text = bg === "#ffffff" ? "#000000" : "#ffffff";
                    setConfig({ ...config, colors: { ...config.colors, background: bg, text: text } });
                  }}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
                >
                  <option value="#ffffff">White</option>
                  <option value="#000000">Black</option>
                </select>
              )}
            </div>

            {!(popup.name === "Website Redirect" || popup.name === "Subscribe") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Text Color</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="color"
                    value={config.colors.text?.startsWith('#') && (config.colors.text.length === 7 || config.colors.text.length === 4) ? config.colors.text : "#ffffff"}
                    onChange={(e) => setConfig({ ...config, colors: { ...config.colors, text: e.target.value } })}
                    style={{ width: "38px", height: "38px", padding: "0", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                  />
                  <input 
                    type="text"
                    value={config.colors.text || "#000000"} 
                    onChange={(e) => setConfig({ ...config, colors: { ...config.colors, text: e.target.value } })}
                    style={{ flex: 1, padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Button Background Color</label>
              {plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe") ? (
                <select 
                  value={config.colors.primary === "#000000" || config.colors.primary === "#ffffff" ? config.colors.primary : "#000000"} 
                  onChange={(e) => {
                    const bg = e.target.value;
                    const bText = bg === "#ffffff" ? "#000000" : "#ffffff";
                    setConfig({ ...config, colors: { ...config.colors, primary: bg, buttonText: bText } });
                  }}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
                >
                  <option value="#ffffff">White</option>
                  <option value="#000000">Black</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="color"
                    value={config.colors.primary?.startsWith('#') && (config.colors.primary.length === 7 || config.colors.primary.length === 4) ? config.colors.primary : "#ffffff"}
                    onChange={(e) => {
                      const bg = e.target.value;
                      const bText = getContrastColor(bg);
                      setConfig({ ...config, colors: { ...config.colors, primary: bg, buttonText: bText } });
                    }}
                    style={{ width: "38px", height: "38px", padding: "0", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                  />
                  <input 
                    type="text"
                    value={config.colors.primary} 
                    onChange={(e) => {
                      const bg = e.target.value;
                      const bText = getContrastColor(bg);
                      setConfig({ ...config, colors: { ...config.colors, primary: bg, buttonText: bText } });
                    }}
                    style={{ flex: 1, padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", boxSizing: "border-box" }}
                  />
                </div>
              )}
            </div>

            {!(popup.name === "Website Redirect" || popup.name === "Subscribe") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Button Text Color</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="color"
                    value={config.colors.buttonText?.startsWith('#') && (config.colors.buttonText.length === 7 || config.colors.buttonText.length === 4) ? config.colors.buttonText : "#ffffff"}
                    onChange={(e) => setConfig({ ...config, colors: { ...config.colors, buttonText: e.target.value } })}
                    style={{ width: "38px", height: "38px", padding: "0", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                  />
                  <input 
                    type="text"
                    value={config.colors.buttonText || getContrastColor(config.colors.primary)} 
                    onChange={(e) => setConfig({ ...config, colors: { ...config.colors, buttonText: e.target.value } })}
                    style={{ flex: 1, padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {popup.name.includes("CYBER MONDAY") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Box Shadow Color</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input 
                    type="color"
                    value={config.colors.shadow || "#ec4899"}
                    onChange={(e) => updateShadowColor(e.target.value)}
                    style={{ width: "38px", height: "38px", padding: "0", border: "none", borderRadius: "4px", cursor: "pointer", background: "none" }}
                  />
                  <span style={{ fontSize: "13px", color: "#E0E0E0" }}>{config.colors.shadow || "#ec4899"}</span>
                </div>
              </div>
            )}
            
            {!entitlements.customCSS && renderLocked("Custom CSS (Pro)")}
          </div>

          {/* Advanced Settings Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "20px", borderTop: "1px solid #232331" }}>
            <h3 style={{ fontSize: "15px", margin: 0, color: "#E0E0E0" }}>Advanced Settings</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Position on Screen</label>
                {plan === "FREE" && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <select 
                value={plan === "FREE" ? "center" : (config.position || "center")} 
                onChange={(e) => setConfig({ ...config, position: e.target.value })}
                disabled={plan === "FREE"}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: plan === "FREE" ? "#A0A0AB" : "#FFFFFF", backgroundColor: plan === "FREE" ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
              <span style={{ fontSize: "11px", color: "#8E8E93" }}>* Not applicable for mobile devices.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Display Frequency</label>
                {(plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <select 
                value={(plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "once_per_day" : (config.displayFrequency || "once_per_day")} 
                onChange={(e) => setConfig({ ...config, displayFrequency: e.target.value })}
                disabled={plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: (plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#A0A0AB" : "#FFFFFF", backgroundColor: (plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="always">Every refresh</option>
                <option value="once_per_day">Once per 24h</option>
                <option value="once_per_session">Once per session</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Page Targeting</label>
                {!entitlements.pageTargeting && !(popup.name === "Website Redirect" || popup.name === "Subscribe") && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <select 
                value={(!entitlements.pageTargeting && !(popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "home" : (config.targeting?.page || "all")} 
                onChange={(e) => setConfig({ ...config, targeting: { ...config.targeting, page: e.target.value } })}
                disabled={!entitlements.pageTargeting && !(popup.name === "Website Redirect" || popup.name === "Subscribe")}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: (!entitlements.pageTargeting && !(popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#A0A0AB" : "#FFFFFF", backgroundColor: (!entitlements.pageTargeting && !(popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="all">All Pages</option>
                <option value="home">Homepage</option>
                <option value="product">Product Pages</option>
                <option value="collection">Catalog / Collections</option>
                <option value="cart">Cart Page</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Schedule (End Date)</label>
                {!entitlements.pageTargeting && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <input 
                type="datetime-local"
                value={!entitlements.pageTargeting ? "" : (config.schedule?.endDate || "")} 
                onChange={(e) => setConfig({ ...config, schedule: { ...config.schedule, endDate: e.target.value } })}
                disabled={!entitlements.pageTargeting}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: !entitlements.pageTargeting ? "#A0A0AB" : "#FFFFFF", backgroundColor: !entitlements.pageTargeting ? "#2A2A35" : "#0F0F13" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Device Targeting</label>
                {plan !== "PRO" && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Pro</span>}
              </div>
              <select 
                value={plan !== "PRO" ? "all" : (config.targeting?.device || "all")} 
                onChange={(e) => setConfig({ ...config, targeting: { ...config.targeting, device: e.target.value } })}
                disabled={plan !== "PRO"}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: plan !== "PRO" ? "#A0A0AB" : "#FFFFFF", backgroundColor: plan !== "PRO" ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="all">All Devices</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </select>
            </div>

            <hr style={{ borderColor: "#232331", margin: "24px 0" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 16px 0", color: "#FFFFFF" }}>Triggers</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Trigger Type</label>
                {(plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <select 
                value={(plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "page_load" : (config.triggers?.type || "page_load")} 
                onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, type: e.target.value } })}
                disabled={plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: (plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#A0A0AB" : "#FFFFFF", backgroundColor: (plan === "FREE" && (popup.name === "Website Redirect" || popup.name === "Subscribe")) ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="page_load">Page Load</option>
                <option value="delay" disabled={!entitlements.pageTargeting}>Delay (seconds) {!entitlements.pageTargeting ? "🔒 Growth" : ""}</option>
                <option value="scroll" disabled={!entitlements.pageTargeting}>Scroll Percentage {!entitlements.pageTargeting ? "🔒 Growth" : ""}</option>
              </select>
            </div>

            {(config.triggers?.type === "delay" || config.triggers?.type === "scroll") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>
                    {config.triggers?.type === "delay" ? "Delay (seconds)" : "Scroll %"}
                  </label>
                </div>
                <input 
                  type="number"
                  min="1"
                  max={config.triggers?.type === "scroll" ? "100" : undefined}
                  value={config.triggers?.type === "delay" ? (config.triggers?.delaySeconds || 5) : (config.triggers?.scrollPercent || 50)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    if (config.triggers?.type === "delay") {
                      setConfig({ ...config, triggers: { ...config.triggers, delaySeconds: val } });
                    } else {
                      setConfig({ ...config, triggers: { ...config.triggers, scrollPercent: val } });
                    }
                  }}
                  style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: "#FFFFFF", backgroundColor: "#0F0F13" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
