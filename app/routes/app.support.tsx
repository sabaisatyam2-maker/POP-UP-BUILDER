import { Page, Layout, Card, BlockStack, Text, Button } from "@shopify/polaris";

export default function SupportPage() {
  return (
    <Page title="Help & Support">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Need Assistance?</Text>
              <Text as="p">
                If you have any questions or need help configuring Popup Builder, 
                our support team is available to assist you.
              </Text>
              <Button url="mailto:support@example.com" target="_blank">Contact Support</Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
