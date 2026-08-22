import { Box, Card, Layout, Page, Text, Button, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const activeSubscription = await db.subscription.findFirst({
    where: { shop: session.shop, status: "ACTIVE" }
  });

  const plan = activeSubscription?.plan || "FREE";

  return {
    shop: session.shop,
    plan,
    timezone: "UTC", // Could be fetched from Shopify GraphQL if needed
  };
};

export default function SettingsPage() {
  const { shop, plan } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Construct the deep link to the Shopify Theme Editor for the app embed block
  // format: https://[shop]/admin/themes/current/editor?context=apps&appEmbed=[app-id-or-uuid]
  // Note: For full dynamic linking, you need the UUID from the theme app extension. 
  // We provide a fallback that opens the theme editor apps tab.
  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return (
    <Page title="Settings" backAction={{ content: "Dashboard", onAction: () => navigate("/app") }}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* App Embed Onboarding Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">App Embed Status</Text>
                <Text as="p">
                  Popup Builder uses a modern Shopify App Embed Block to render popups on your storefront safely without editing your theme code.
                  You must activate it before your popups will appear.
                </Text>
                <InlineStack align="start">
                  <a href={themeEditorUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <button className="gradient-button">
                      Activate App Embed in Theme
                    </button>
                  </a>
                </InlineStack>
              </BlockStack>
            </Card>



            {/* Billing Information */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Billing & Plan</Text>
                <InlineStack align="space-between">
                  <Text as="p" tone="subdued">Current Plan</Text>
                  <Badge tone={plan === "PRO" ? "success" : plan === "GROWTH" ? "info" : "new"}>
                    {plan}
                  </Badge>
                </InlineStack>
                <InlineStack align="start">
                  <button className="gradient-button" onClick={() => navigate("/app/pricing")}>
                    Manage Subscription
                  </button>
                </InlineStack>
              </BlockStack>
            </Card>

          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
