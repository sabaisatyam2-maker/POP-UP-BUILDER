import { type LoaderFunctionArgs, type ActionFunctionArgs, data, redirect } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  let subscription = await db.subscription.findUnique({ where: { shop } });
  if (!subscription) {
    subscription = await db.subscription.create({ data: { shop, plan: "FREE" } });
  }

  return { subscription };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const plan = formData.get("plan");

  if (typeof plan !== "string" || !["FREE", "GROWTH", "PRO"].includes(plan)) {
    return data({ error: "Invalid plan" }, { status: 400 });
  }

  await db.subscription.update({
    where: { shop: session.shop },
    data: { plan },
  });

  await db.activityLog.create({
    data: { shop: session.shop, action: "UPGRADED", description: `Changed plan to ${plan}.` },
  });

  return redirect("/app/dashboard");
};

export default function Pricing() {
  const { subscription } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();

  const plans = [
    {
      name: "FREE",
      price: "$0/mo",
      description: "Perfect for getting started.",
      features: ["1 Active Popup", "Basic Popup Layouts", "Content Customization", "URL Redirects", "Page Targeting"],
    },
    {
      name: "GROWTH",
      price: "$18/mo",
      description: "For growing stores.",
      features: ["5 Active Popups", "CSS Customization", "Image Uploads", "Advanced Settings", "Attractive Templates"],
    },
    {
      name: "PRO",
      price: "$23/mo",
      description: "For power users.",
      features: ["Unlimited Popups", "All Templates Access", "Advanced Templates", "Gradient Backgrounds", "Advanced Triggers", "Countdown Timers"],
    }
  ];

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <button 
        onClick={() => navigate("/app/dashboard")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#8B8D97", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}
      >
        &larr; Back to Dashboard
      </button>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: "0 0 12px 0", color: "#FFFFFF" }}>Upgrade your plan</h1>
        <p style={{ color: "#8B8D97", fontSize: "16px", margin: 0 }}>Choose the perfect plan for your business needs.</p>
      </div>

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
        {plans.map((plan) => (
          <div 
            key={plan.name}
            style={{ 
              flex: "1 1 250px", 
              backgroundColor: "#111116", 
              borderRadius: "12px", 
              padding: "24px", 
              boxShadow: subscription.plan === plan.name ? "0 0 0 2px #9D4EDD" : "0 4px 12px rgba(0,0,0,0.2)",
              border: subscription.plan === plan.name ? "none" : "1px solid #232331",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {subscription.plan === plan.name && (
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "16px", padding: "4px 8px", backgroundColor: "#1A1A24", borderRadius: "12px", alignSelf: "flex-start", border: "1px solid #2A2A35" }}>CURRENT PLAN</div>
            )}
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0", color: "#FFFFFF" }}>{plan.name}</h2>
            <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px", color: "#FFFFFF" }}>{plan.price}</div>
            <p style={{ color: "#8B8D97", fontSize: "14px", margin: "0 0 24px 0" }}>{plan.description}</p>
            
            <ul style={{ padding: 0, margin: "0 0 24px 0", listStyle: "none", flexGrow: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ marginBottom: "12px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", color: "#FFFFFF" }}>
                  <span style={{ color: "#9D4EDD", fontWeight: "bold" }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <fetcher.Form method="post">
              <input type="hidden" name="plan" value={plan.name} />
              <button 
                type="submit"
                disabled={subscription.plan === plan.name || fetcher.state !== "idle"}
                className={subscription.plan !== plan.name ? "gradient-button" : ""}
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  borderRadius: "8px", 
                  border: subscription.plan === plan.name ? "1px solid #232331" : "none", 
                  backgroundColor: subscription.plan === plan.name ? "#1A1A24" : "transparent", 
                  color: subscription.plan === plan.name ? "#8B8D97" : "#ffffff", 
                  fontWeight: "bold",
                  cursor: subscription.plan === plan.name ? "default" : "pointer",
                }}
              >
                {fetcher.state !== "idle" && fetcher.formData?.get("plan") === plan.name 
                  ? "Updating..." 
                  : subscription.plan === plan.name 
                    ? "Current Plan" 
                    : `Upgrade to ${plan.name}`
                }
              </button>
            </fetcher.Form>
          </div>
        ))}
      </div>
    </div>
  );
}