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
    template: templates.find(t => t.id === w.templateId)
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
        name: `My ${template.name}`,
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
    <s-page heading="Your Watchlist" fullWidth>
      <s-stack direction="inline" gap="base" justify="space-between" align="center">
        <div>
          <s-text variant="subdued">Templates you've saved for later.</s-text>
        </div>
      </s-stack>

      <div style={{ marginTop: "24px" }} />

      {savedTemplates.length === 0 ? (
        <s-section heading="No saved templates">
          <s-paragraph>You haven't added any templates to your watchlist yet.</s-paragraph>
          <s-button onClick={() => navigate("/app/templates")}>Browse Templates</s-button>
        </s-section>
      ) : (
        <s-stack direction="inline" gap="base" justify="flex-start" wrap="wrap">
          {savedTemplates.map((item) => (
            <div
              key={item.watchlistId}
              style={{
                width: "300px",
                padding: "16px",
                border: "1px solid #dfe3e8",
                borderRadius: "8px",
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <img src={item.template.previewImage} alt={item.template.name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }} />
              
              <s-text variant="heading">{item.template.name}</s-text>
              <s-text variant="subdued" size="small">{item.template.category}</s-text>
              <s-text>{item.template.description}</s-text>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', paddingTop: '16px' }}>
                <s-button 
                  variant="primary" 
                  onClick={() => fetcher.submit({ intent: 'use', templateId: item.template.id }, { method: "post" })}
                >
                  Use
                </s-button>
                <s-button variant="tertiary" onClick={() => alert("Preview feature placeholder")}>Preview</s-button>
                <s-button 
                  variant="tertiary" 
                  onClick={() => fetcher.submit({ intent: 'remove', watchlistId: item.watchlistId }, { method: "post" })}
                  loading={fetcher.state !== "idle" && fetcher.formData?.get("watchlistId") === item.watchlistId}
                >
                  Remove
                </s-button>
              </div>
            </div>
          ))}
        </s-stack>
      )}
    </s-page>
  );
}
