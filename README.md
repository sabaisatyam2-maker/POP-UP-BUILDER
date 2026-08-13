# Popup Builder for Shopify

A complete, production-ready Shopify app that allows merchants to create beautiful, responsive, customizable promotional popups for their storefront.

Built with **Shopify Remix App Template**, **Prisma**, **React**, **Polaris**, and **Theme App Extensions**.

---

## 🎯 Features

- **Beautiful Templates:** 17 seeded templates spanning Free, Growth, and Pro tiers.
- **Visual Builder:** 3-column layout (Elements, Live Preview, Settings) to customize content, colors, and layout.
- **Advanced Targeting:** Position, Page-level targeting, scheduling, and device targeting.
- **Triggers:** Delay, Scroll percentage, and Exit Intent.
- **Theme App Extension:** Uses Shopify's modern App Embed Blocks (Vanilla JS) for fast, safe storefront injection without modifying `.liquid` theme files.
- **Shopify Billing:** Fully integrated subscription plans (Free, Growth, Pro) using the Shopify GraphQL Admin API with test-mode enabled for development.
- **Analytics:** Tracks impressions, clicks, and CTR.
- **GDPR Compliant:** Mandatory Shopify Webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) are fully implemented.

---

## ⚙️ Installation & Configuration

### 1. Prerequisites
- Node.js (v18+)
- A Shopify Partner Account
- A Shopify Development Store

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (based on `.env.example`).
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-ngrok-url.com
SCOPES=read_themes,write_themes,write_products,write_metaobjects,write_metaobject_definitions
DATABASE_URL="file:dev.sqlite" # Or PostgreSQL URL
```

### 4. Database Setup
```bash
# Push the Prisma schema to your database
npx prisma db push

# Seed the database with the initial 17 templates
npm run seed
```

---

## 🚀 Running Locally

1. Start the Shopify CLI development server:
```bash
npm run dev
```
2. Press `p` in the terminal to open the app preview in your development store.
3. The CLI will automatically update your `shopify.app.toml` URLs.

---

## 🧪 Testing Guidelines

### Testing Billing (Test Mode)
The app is configured to pass `isTest: true` to the `appSubscriptionCreate` mutation when running locally or on a development store. This ensures no real charges occur during testing or App Store review. You can safely "Upgrade" to Growth or Pro in your dev store.

### Testing the Theme App Extension
1. In the App, navigate to **Settings**.
2. Click **Activate App Embed in Theme**.
3. Toggle the "Popup Builder" embed block ON and click Save.
4. Go to **Dashboard**, create an active popup, and visit your storefront to see it render!

---

## 📦 Deployment & App Store Submission

### Deploying the App
1. Deploy your backend to a hosting provider (Render, Heroku, Fly.io, etc.).
2. Deploy the Theme App Extension to Shopify:
```bash
npm run deploy
```

### App Store Submission Checklist
This app has been architected specifically to pass Shopify's strict App Store review guidelines:
- [x] **No Theme File Modification:** Uses App Embed blocks.
- [x] **Close Button Rule:** The CSS enforces an `!important` rule on the close button to guarantee it is always visible and accessible on all popups.
- [x] **No ScriptTags:** ScriptTags are deprecated; we use Theme App Extensions.
- [x] **Session-Token Auth:** App Bridge session tokens are used (no 3rd-party cookies).
- [x] **GDPR Webhooks:** Configured in `shopify.app.toml` and handled in `app/routes/webhooks.*.tsx`.
- [x] **Privacy Policy:** When submitting, ensure your Privacy Policy states that you do not collect persistent PII (customer names/emails) and that you honor deletion requests via webhooks.
- [x] **Pricing Accuracy:** Ensure the prices you set in the App Store Partner Dashboard exactly match the UI (Growth: ₹499/mo, Pro: ₹999/mo).

---

## 🏗️ Architecture Notes

- **Multi-Tenancy:** All database queries are strictly scoped to the authenticated `session.shop`.
- **Entitlement System:** Features are gated through a centralized `app/lib/entitlements.ts` configuration, not hardcoded individually in the UI.
- **Storefront Script:** Written in Vanilla JS (`popup.js`) to ensure zero impact on merchant Core Web Vitals.
