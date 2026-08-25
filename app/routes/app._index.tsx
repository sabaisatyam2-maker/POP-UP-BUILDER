import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { useState, useEffect } from "react";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch or create subscription
  let subscription = await db.subscription.findUnique({ where: { shop } });
  if (!subscription) {
    subscription = await db.subscription.create({ data: { shop, plan: "FREE" } });
  }

  // Fetch popups
  const popups = await db.popup.findMany({
    where: { shop, status: { not: "UNSAVED" } },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate aggregates
  const activePopupsCount = popups.filter((p) => p.status === "ACTIVE").length;
  const totalImpressions = popups.reduce((sum, p) => sum + p.views, 0);
  const totalClicks = popups.reduce((sum, p) => sum + p.clicks, 0);
  const totalConversions = popups.reduce((sum, p) => sum + p.conversions, 0);

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const conversionRate = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(2) : "0.00";

  // Fetch activity
  const activities = await db.activityLog.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Fetch recent templates
  const recentTemplates = await db.template.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const { getEntitlements } = await import("../lib/entitlements");
  const limits = getEntitlements(subscription.plan as any);

  return {
    popups,
    metrics: { activePopupsCount, totalImpressions, totalClicks, ctr, totalConversions, conversionRate },
    subscription,
    activities,
    recentTemplates,
    shopDomain: shop,
    limits,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const popupId = formData.get("popupId") as string | null;
  const currentStatus = formData.get("currentStatus") as string | null;

  if (intent === "create_scratch") {
    const defaultScratchConfig = JSON.stringify({
      layout: "modal",
      colors: { background: "#ffffff", text: "#000000", primary: "#000000" },
      typography: { fontFamily: "sans-serif", size: "16px" },
      content: { headline: "New Popup", description: "Edit this description", buttonText: "Click Here" },
      styles: { borderRadius: "8px", padding: "24px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
      triggers: { delay: 0 },
    });

    const newPopup = await db.popup.create({
      data: {
        shop: session.shop,
        name: "Untitled Popup",
        status: "UNSAVED",
        config: defaultScratchConfig,
      },
    });

    await db.activityLog.create({
      data: { shop: session.shop, action: "CREATED", description: "Started a new popup from scratch." },
    });

    return redirect(`/app/templates/builder/${newPopup.id}`);
  }

  if (intent === "duplicate" && popupId) {
    const original = await db.popup.findUnique({ where: { id: popupId, shop: session.shop } });
    if (!original) return data({ error: "Popup not found" }, { status: 404 });

    const copy = await db.popup.create({
      data: {
        shop: session.shop,
        name: `${original.name} (Copy)`,
        status: "DRAFT",
        config: original.config,
      },
    });

    await db.activityLog.create({
      data: { shop: session.shop, action: "DUPLICATED", description: `Duplicated popup '${original.name}'.` },
    });

    return data({ success: true, popup: copy });
  }

  if (intent === "toggle_status" && popupId) {
    const popup = await db.popup.findUnique({ where: { id: popupId, shop: session.shop } });
    if (!popup) return data({ error: "Popup not found" }, { status: 404 });

    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

    if (newStatus === "ACTIVE") {
      const subscription = await db.subscription.findUnique({ where: { shop: session.shop } });
      const plan = (subscription?.plan as any) || "FREE";
      
      const activeCount = await db.popup.count({ where: { shop: session.shop, status: "ACTIVE" } });
      const { canCreatePopup } = await import("../lib/entitlements");
      if (!canCreatePopup(activeCount, plan)) {
         return data({ error: `Plan limit reached. Your ${plan} plan allows maximum active popups.` }, { status: 400 });
      }
    }

    const updated = await db.popup.update({
      where: { id: popupId, shop: session.shop },
      data: { status: newStatus },
    });

    await db.activityLog.create({
      data: {
        shop: session.shop,
        action: newStatus === "ACTIVE" ? "ACTIVATED" : "PAUSED",
        description: `${newStatus === "ACTIVE" ? "Activated" : "Paused"} popup '${updated.name}'.`,
      },
    });

    return data({ success: true, popup: updated });
  }

  if (intent === "delete_popup" && popupId) {
    const popup = await db.popup.findUnique({ where: { id: popupId, shop: session.shop } });
    if (!popup) return data({ error: "Popup not found" }, { status: 404 });

    await db.popup.delete({ where: { id: popupId, shop: session.shop } });

    await db.activityLog.create({
      data: { shop: session.shop, action: "DELETED", description: `Deleted popup '${popup.name}'.` },
    });

    return data({ success: true });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
};

export default function Dashboard() {
  const { popups, metrics, subscription, activities, shopDomain, limits } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isPro = subscription.plan === "PRO";

  useEffect(() => {
    const data = fetcher.data as any;
    if (data && data.error) {
      (window as any).shopify.toast.show(data.error, { isError: true });
    }
  }, [fetcher.data]);

  const handleCreateFromScratch = () => {
    fetcher.submit({ intent: "create_scratch" }, { method: "post" });
  };

  return (
    <div style={{ padding: "clamp(16px, 5vw, 40px)", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <img 
          src="/logo.png" 
          alt="Popup Builder Logo" 
          style={{ 
            width: "180px", 
            height: "auto", 
            display: "block",
            filter: "drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.15))" 
          }} 
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            className="gradient-button" 
            style={{ background: "transparent", border: "1px solid #9D4EDD" }}
            onClick={() => window.open(`https://${shopDomain}/admin/themes/current/editor?context=apps`, "_blank")}
          >
            Enable in Theme
          </button>
          <button className="gradient-button" onClick={() => setIsCreateModalOpen(true)}>
            + Create Popup
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "clamp(16px, 4vw, 32px)", marginBottom: "32px", background: "linear-gradient(135deg, rgba(35,35,49,1) 0%, rgba(17,17,22,1) 100%)", border: "1px solid #232331", borderRadius: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 4px 0", color: "#FFFFFF" }}>Active Popups</h2>
            <p style={{ color: "#8B8D97", margin: 0, fontSize: "14px" }}>Manage your currently live popups.</p>
          </div>
          <button className="gradient-button" onClick={() => setIsCreateModalOpen(true)}>
            + Create New
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {popups.filter(p => p.status === "ACTIVE").length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8B8D97" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎯</div>
              <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>You don't have any active popups running.</p>
              <button className="gradient-button" onClick={() => navigate("/app/templates")}>
                Browse Templates
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
              {popups.filter(p => p.status === "ACTIVE").map(popup => (
                <div key={popup.id} style={{ 
                  backgroundColor: "#1A1A24", 
                  border: "1px solid #232331", 
                  borderRadius: "16px", 
                  padding: "20px",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Glowing top border effect */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #9D4EDD, #EC4899)" }}></div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#FFFFFF", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{popup.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: "12px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981", boxShadow: "0 0 8px #10B981" }}></div>
                      <span style={{ color: "#10B981", fontSize: "12px", fontWeight: "bold" }}>LIVE</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                      <div style={{ color: "#8B8D97", fontSize: "12px", marginBottom: "4px" }}>Views</div>
                      <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: "bold" }}>{popup.views.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: "#8B8D97", fontSize: "12px", marginBottom: "4px" }}>Clicks</div>
                      <div style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: "bold" }}>{popup.clicks.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: "#8B8D97", fontSize: "12px", marginBottom: "4px" }}>CTR</div>
                      <div style={{ color: "#10B981", fontSize: "16px", fontWeight: "bold" }}>
                        {popup.views > 0 ? ((popup.clicks / popup.views) * 100).toFixed(1) : "0"}%
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #333344", backgroundColor: "transparent", color: "#FFFFFF", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "all 0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#232331"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={() => navigate(`/app/templates/builder/${popup.id}`)}
                    >
                      Edit
                    </button>
                    <button 
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #333344", backgroundColor: "transparent", color: "#FACC15", cursor: "pointer", fontSize: "14px", fontWeight: "500", transition: "all 0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(250, 204, 21, 0.1)"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={() => fetcher.submit({ intent: "toggle_status", popupId: popup.id, currentStatus: popup.status }, { method: "post" })}
                    >
                      Pause
                    </button>
                    <button 
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #333344", backgroundColor: "transparent", color: "#EF4444", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this active popup?")) {
                          fetcher.submit({ intent: "delete_popup", popupId: popup.id }, { method: "post" });
                        }
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="col-main">
          {popups.length === 0 ? (
            <div className="card" style={{ padding: "clamp(16px, 4vw, 32px)", background: "linear-gradient(135deg, rgba(35,35,49,1) 0%, rgba(17,17,22,1) 100%)", border: "1px solid #232331", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}>Get Started in 3 Simple Steps</h2>
              
              <div className="step-item">
                <div className="step-icon-wrap">1</div>
                <div className="step-text">
                  <h4>Create Popup</h4>
                  <p>Build your popup in minutes using our easy builder.</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-icon-wrap">2</div>
                <div className="step-text">
                  <h4>Choose Targeting</h4>
                  <p>Show to the right audience at the right time.</p>
                </div>
              </div>
              
              <div className="step-item">
                <div className="step-icon-wrap">3</div>
                <div className="step-text">
                  <h4>Publish & Grow</h4>
                  <p>Go live and start boosting conversions.</p>
                </div>
              </div>
              
              <div style={{ marginTop: "16px" }}>
                <button className="gradient-button" style={{ background: "transparent", border: "1px solid #333344" }} onClick={() => navigate("/app/templates")}>
                  Browse Templates
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: "clamp(16px, 4vw, 32px)", background: "linear-gradient(135deg, rgba(35,35,49,1) 0%, rgba(17,17,22,1) 100%)", border: "1px solid #232331", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "24px" }}>Your Popups</h2>
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table className="custom-table">
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Impressions</th>
                    <th>Clicks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {popups.map((popup) => (
                    <tr key={popup.id}>
                      <td>
                        <strong>{popup.name}</strong>
                      </td>
                      <td>
                        <span style={{ color: "#8B8D97" }}>{popup.status}</span>
                      </td>
                      <td>{popup.views}</td>
                      <td>{popup.clicks}</td>
                      <td style={{ display: "flex", gap: "8px" }}>
                        <button className="gradient-button" style={{ background: "transparent", border: "1px solid #333344", padding: "6px 12px" }} onClick={() => navigate(`/app/templates/builder/${popup.id}`)}>
                          Edit
                        </button>
                        <button 
                          className="gradient-button" style={{ background: "transparent", border: "1px solid #333344", padding: "6px 12px" }} 
                          onClick={() => fetcher.submit({ intent: "toggle_status", popupId: popup.id, currentStatus: popup.status }, { method: "post" })}
                        >
                          {popup.status === "ACTIVE" ? "Pause" : "Activate"}
                        </button>
                        <button 
                          className="gradient-button" style={{ background: "transparent", border: "1px solid #EF4444", padding: "6px 12px", color: "#EF4444" }} 
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this popup?")) {
                              fetcher.submit({ intent: "delete_popup", popupId: popup.id }, { method: "post" });
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-side">
          <div className="card" style={{ padding: "clamp(16px, 4vw, 32px)", marginBottom: "24px", background: "linear-gradient(135deg, rgba(35,35,49,1) 0%, rgba(17,17,22,1) 100%)", border: "1px solid #232331", borderRadius: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Current Plan</h2>
            <div style={{ color: "#9D4EDD", fontWeight: "bold", fontSize: "14px", marginBottom: "8px" }}>
              {subscription.plan} PLAN
            </div>
            <div style={{ color: "#8B8D97", fontSize: "12px", marginBottom: "16px" }}>
              {metrics.activePopupsCount} / {isPro ? "Unlimited" : limits.activePopups} Active Popups
            </div>
            <div className="plan-progress-bar">
              <div className="plan-progress-fill" style={{ width: isPro ? "100%" : `${Math.min((metrics.activePopupsCount / limits.activePopups) * 100, 100)}%` }}></div>
            </div>
            {!isPro && (
              <button className="gradient-button" style={{ background: "transparent", border: "1px solid #333344", width: "100%", marginTop: "16px" }} onClick={() => navigate("/app/pricing")}>
                Upgrade Plan
              </button>
            )}
          </div>

          <div className="card" style={{ padding: "clamp(16px, 4vw, 32px)", background: "linear-gradient(135deg, rgba(35,35,49,1) 0%, rgba(17,17,22,1) 100%)", border: "1px solid #232331", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>Recent Activity</h2>
              <span style={{ color: "#8B8D97", fontSize: "12px" }}>View All</span>
            </div>
            
            {activities.length === 0 ? (
              <div style={{ color: "#8B8D97" }}>No recent activity.</div>
            ) : (
              <div>
                {activities.map((a: any) => {
                  let iconClass = "act-icon";
                  let iconChar = "•";
                  if (a.action === "CREATED" || a.action === "ACTIVATED") {
                    iconClass += " created"; iconChar = "↑";
                  } else if (a.action === "DELETED" || a.action === "PAUSED") {
                    iconClass += " deleted"; iconChar = "🗑";
                  } else if (a.action === "UPGRADED") {
                    iconClass += " upgraded"; iconChar = "↑";
                  }
                  
                  return (
                    <div key={a.id} className="activity-item">
                      <div className={iconClass}>{iconChar}</div>
                      <div className="act-text">
                        <span>{a.action}:</span> {a.description}
                      </div>
                      <div className="act-date">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Popup Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "400px", backgroundColor: "#111116", padding: "24px", borderRadius: "12px", border: "1px solid #232331" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>Create Popup</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#8B8D97" }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                onClick={() => navigate("/app/templates")}
                style={{ 
                  padding: "16px", border: "1px solid #232331", borderRadius: "8px", cursor: "pointer", backgroundColor: "#1A1A24"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0", color: "#FFFFFF" }}>Start from Template</h3>
                <p style={{ margin: 0, color: "#8B8D97", fontSize: "14px" }}>Browse pre-designed layouts to get started quickly.</p>
              </div>

              <div
                onClick={handleCreateFromScratch}
                style={{ 
                  padding: "16px", border: "1px solid #232331", borderRadius: "8px", cursor: "pointer", backgroundColor: "#1A1A24"
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0", color: "#FFFFFF" }}>Create from Scratch</h3>
                <p style={{ margin: 0, color: "#8B8D97", fontSize: "14px" }}>Build your popup completely from the ground up.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
