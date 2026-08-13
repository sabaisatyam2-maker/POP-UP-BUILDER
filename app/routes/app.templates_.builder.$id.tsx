import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState } from "react";
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
    return redirect("/app/dashboard");
  }

  return data({ success: true, popup: updatedPopup });
};

export default function Builder() {
  const { popup, plan, entitlements } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [name, setName] = useState(popup.name);
  const [config, setConfig] = useState(JSON.parse(popup.config));

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", backgroundColor: "#1A1A24", borderBottom: "1px solid #232331" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => navigate("/app/templates")}
            style={{ padding: "8px 16px", background: "transparent", border: "1px solid #3A3A4A", borderRadius: "8px", color: "#FFFFFF", cursor: "pointer", fontWeight: "bold" }}
          >
            ← Back
          </button>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ fontSize: "18px", fontWeight: "bold", border: "none", outline: "none", backgroundColor: "transparent", color: "#FFFFFF" }}
          />
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
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Removed Left Sidebar */}

        {/* CENTER: Live Preview */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto", position: "relative" }}>
          {/* Mock Storefront Background */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "url('https://via.placeholder.com/1200x800?text=Your+Storefront')", backgroundSize: "cover", opacity: 0.1 }} />
          
          {/* Popup Canvas */}
          <div 
            style={{
              position: "relative",
              zIndex: 10,
              background: config.colors?.background || "#ffffff",
              color: config.colors?.text || "#000000",
              borderRadius: config.styles?.borderRadius || "8px",
              padding: config.styles?.padding || "24px",
              boxShadow: config.styles?.boxShadow || "0 4px 12px rgba(0,0,0,0.15)",
              width: config.layout === "split" ? "600px" : "400px",
              display: "flex",
              flexDirection: config.layout === "split" ? "row" : "column",
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

            {/* Split Image area (if applicable) */}
            {config.layout === "split" && (
              <div style={{ flex: 1, backgroundColor: "#f4f6f8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {config.imageUrl ? (
                  <img src={config.imageUrl} alt="Popup Image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#8c9196" }}>Image Area</span>
                )}
              </div>
            )}

            <div style={{ flex: 1, padding: config.layout === "split" ? "24px" : "0", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
              {config.layout !== "split" && config.imageUrl && (
                <img src={config.imageUrl} alt="Popup Image" style={{ width: "100%", maxHeight: "150px", objectFit: "contain", marginBottom: "16px" }} />
              )}
              
              <div style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: (config.colors?.background === "#ffffff" ? "#000000" : "#ffffff"), wordBreak: "break-word" }}>
                {config.content?.headline || "Headline"}
              </div>
              
              <p style={{ margin: 0, color: (config.colors?.background === "#ffffff" ? "#000000" : "#ffffff"), wordBreak: "break-word" }}>
                {config.content?.description || "Description text goes here."}
              </p>

              {config.hasEmailInput && (
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  style={{ padding: "10px", width: "100%", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", pointerEvents: "none" }}
                  readOnly
                />
              )}

              <button 
                style={{
                  padding: "12px 24px",
                  backgroundColor: config.colors?.primary || "#000000",
                  color: (config.colors?.primary === "#ffffff") ? "#000000" : "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  wordBreak: "break-word"
                }}
              >
                {config.content?.buttonText || "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Settings Sidebar */}
        <div style={{ width: "320px", backgroundColor: "#1A1A24", borderLeft: "1px solid #232331", padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px", color: "#FFFFFF" }}>
          <h2 style={{ fontSize: "18px", margin: 0 }}>Popup Settings</h2>
          
          {/* Content Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "15px", margin: 0, color: "#E0E0E0" }}>Content</h3>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Headline</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.headline?.length || 0}/100</span>
            </div>
            <input 
              type="text" 
              value={config.content.headline} 
              maxLength={100}
              onChange={(e) => setConfig({ ...config, content: { ...config.content, headline: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Description</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.description?.length || 0}/400</span>
            </div>
            <textarea 
              value={config.content.description} 
              maxLength={400}
              onChange={(e) => setConfig({ ...config, content: { ...config.content, description: e.target.value } })}
              style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", minHeight: "80px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Button Text</label>
              <span style={{ fontSize: "12px", color: "#A0A0AB" }}>{config.content.buttonText?.length || 0}/40</span>
            </div>
            <input 
              type="text" 
              value={config.content.buttonText} 
              maxLength={40}
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
          </div>

          {/* Design Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "20px", borderTop: "1px solid #232331" }}>
            <h3 style={{ fontSize: "15px", margin: 0, color: "#E0E0E0" }}>Design Colors</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Popup Background Color</label>
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
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Button Background Color</label>
              <select 
                value={config.colors.primary} 
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primary: e.target.value } })}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", backgroundColor: "#0F0F13", color: "#FFFFFF" }}
              >
                <option value="#000000">Black</option>
                <option value="#ffffff">White</option>
              </select>
            </div>
            
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
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Page Targeting</label>
                {!entitlements.pageTargeting && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <select 
                value={!entitlements.pageTargeting ? "home" : (config.targeting?.page || "all")} 
                onChange={(e) => setConfig({ ...config, targeting: { ...config.targeting, page: e.target.value } })}
                disabled={!entitlements.pageTargeting}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: !entitlements.pageTargeting ? "#A0A0AB" : "#FFFFFF", backgroundColor: !entitlements.pageTargeting ? "#2A2A35" : "#0F0F13" }}
              >
                <option value="all">All Pages</option>
                <option value="home">Homepage</option>
                <option value="product">Product Pages</option>
                <option value="cart">Cart Page</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", color: "#FFFFFF" }}>Schedule (End Date)</label>
                {!entitlements.pageTargeting && <span style={{ fontSize: "12px", color: "#A0A0AB" }}>🔒 Growth</span>}
              </div>
              <input 
                type="date"
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
              </div>
              <select 
                value={config.triggers?.type || "page_load"} 
                onChange={(e) => setConfig({ ...config, triggers: { ...config.triggers, type: e.target.value } })}
                style={{ padding: "8px", border: "1px solid #3A3A4A", borderRadius: "4px", color: "#FFFFFF", backgroundColor: "#0F0F13" }}
              >
                <option value="page_load">Page Load</option>
                <option value="delay" disabled={!entitlements.pageTargeting}>Delay (seconds) {!entitlements.pageTargeting ? "🔒 Growth" : ""}</option>
                <option value="scroll" disabled={!entitlements.pageTargeting}>Scroll Percentage {!entitlements.pageTargeting ? "🔒 Growth" : ""}</option>
                <option value="exit_intent" disabled={!entitlements.exitIntent}>Exit Intent {!entitlements.exitIntent ? "🔒 Pro" : ""}</option>
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
