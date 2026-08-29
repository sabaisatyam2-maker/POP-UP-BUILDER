import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy | Pop-up Builder" },
    { name: "description", content: "Privacy Policy for Pop-up Builder" },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: "1.6", maxWidth: "800px", margin: "0 auto", padding: "40px 20px", color: "#333" }}>
      <h1 style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px" }}>Privacy Policy</h1>
      <p style={{ color: "#666", fontSize: "0.9em" }}>Last updated: August 29, 2026</p>
      
      <p>
        This Privacy Policy describes how Pop-up Builder (the "App") collects, uses, and shares information 
        in connection with your use of our application, which is provided to you via Shopify.
      </p>

      <h2 style={{ marginTop: "30px" }}>1. Information We Collect</h2>
      <p>When you install the App, we are automatically able to access certain types of information from your Shopify account:</p>
      <ul style={{ paddingLeft: "20px" }}>
        <li style={{ marginBottom: "10px" }}><strong>Store Information:</strong> We collect information about your Shopify store, such as your store domain, store name, and contact information to authenticate you and provide the service.</li>
        <li style={{ marginBottom: "10px" }}><strong>App Usage Data:</strong> We collect data about how you configure and use the pop-ups within the App to ensure functionality and improve our service.</li>
      </ul>

      <h2 style={{ marginTop: "30px" }}>2. How We Use Your Information</h2>
      <p>We use the personal information we collect from you in order to provide the Service and to operate the App. Additionally, we use this information to:</p>
      <ul style={{ paddingLeft: "20px" }}>
        <li style={{ marginBottom: "10px" }}>Provide, operate, and maintain our App;</li>
        <li style={{ marginBottom: "10px" }}>Improve, personalize, and expand our App;</li>
        <li style={{ marginBottom: "10px" }}>Understand and analyze how you use our App;</li>
        <li style={{ marginBottom: "10px" }}>Communicate with you for customer support and updates.</li>
      </ul>

      <h2 style={{ marginTop: "30px" }}>3. Sharing Your Information</h2>
      <p>We do not share, sell, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
      <ul style={{ paddingLeft: "20px" }}>
        <li style={{ marginBottom: "10px" }}>To comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.</li>
        <li style={{ marginBottom: "10px" }}>With trusted service providers that perform services for us (e.g., hosting providers) under strict confidentiality agreements.</li>
      </ul>

      <h2 style={{ marginTop: "30px" }}>4. Data Retention</h2>
      <p>When you uninstall the App, your store information and active pop-ups are retained for a limited period to facilitate easy re-installation. You may request the permanent deletion of your data at any time by contacting us.</p>

      <h2 style={{ marginTop: "30px" }}>5. Changes</h2>
      <p>We may update this privacy policy from time to time in order to reflect changes to our practices or for other operational, legal, or regulatory reasons.</p>

      <h2 style={{ marginTop: "30px" }}>6. Contact Us</h2>
      <p>For more information about our privacy practices, if you have questions, or if you would like to make a request to delete your data, please contact us by e-mail.</p>
    </div>
  );
}
