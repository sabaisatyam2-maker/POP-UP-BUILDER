import { Page, Layout, Card, BlockStack, Text, TextField, Button, FormLayout } from "@shopify/polaris";
import { useState } from "react";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const subject = encodeURIComponent(`Support Request from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
  // Instead of a mailto: link (which opens Outlook/Desktop apps), we use a direct Gmail compose link
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=sabaisatyam2@gmail.com&su=${subject}&body=${body}`;

  return (
    <Page title="Help & Support">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Contact Support</Text>
              <Text as="p">
                Please fill out the form below and we will get back to you as soon as possible.
              </Text>
              
              <FormLayout>
                <TextField
                  label="Name"
                  value={name}
                  onChange={(value) => setName(value)}
                  autoComplete="name"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(value) => setEmail(value)}
                  autoComplete="email"
                />
                <TextField
                  label="Message"
                  value={message}
                  onChange={(value) => setMessage(value)}
                  multiline={4}
                  autoComplete="off"
                />
              </FormLayout>

              <div style={{ paddingBottom: "16px", paddingTop: "8px" }}>
                {(!name || !email || !message) ? (
                  <button className="gradient-button" disabled>
                    Send Message
                  </button>
                ) : (
                  <a href={gmailLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <button className="gradient-button">
                      Send Message
                    </button>
                  </a>
                )}
              </div>
            </BlockStack>
          </Card>
          <div style={{ marginBottom: "64px" }} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
