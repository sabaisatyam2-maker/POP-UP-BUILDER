import { Page, Layout, Card, BlockStack, Text, TextField, Select, FormLayout, Banner } from "@shopify/polaris";
import { useState } from "react";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General Query");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const subjectOptions = [
    { label: "Bug Report", value: "Bug Report" },
    { label: "Feature Request", value: "Feature Request" },
    { label: "General Query", value: "General Query" },
  ];

  const handleSubmit = async () => {
    if (!name || !email || !message) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("https://formsubmit.co/ajax/sabaisatyam2@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name,
            email,
            _subject: `Popup Builder Support: ${subject}`,
            message
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } catch (err) {
      setError("Failed to send message. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page title="Help & Support">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Contact Support</Text>
              
              {isSubmitted ? (
                <Banner tone="success">
                  <p>Thank you, we'll respond within 24-48 hours.</p>
                </Banner>
              ) : (
                <>
                  <Text as="p">
                    Please fill out the form below and we will get back to you as soon as possible.
                  </Text>
                  
                  {error && (
                    <Banner tone="critical">
                      <p>{error}</p>
                    </Banner>
                  )}
                  
                  <FormLayout>
                    <TextField
                      label="Name"
                      value={name}
                      onChange={(value) => setName(value)}
                      autoComplete="name"
                      disabled={isSubmitting}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(value) => setEmail(value)}
                      autoComplete="email"
                      disabled={isSubmitting}
                    />
                    <Select
                      label="Subject"
                      options={subjectOptions}
                      value={subject}
                      onChange={(value) => setSubject(value)}
                      disabled={isSubmitting}
                    />
                    <TextField
                      label="Message"
                      value={message}
                      onChange={(value) => setMessage(value)}
                      multiline={4}
                      autoComplete="off"
                      disabled={isSubmitting}
                    />
                  </FormLayout>

                  <div style={{ paddingBottom: "16px", paddingTop: "8px" }}>
                    <button 
                      className="gradient-button" 
                      disabled={!name || !email || !message || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? "Sending..." : "Submit"}
                    </button>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                      * The first time this form is used, an activation email will be sent to the support inbox.
                    </div>
                  </div>
                </>
              )}
            </BlockStack>
          </Card>
          <div style={{ marginBottom: "64px" }} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
