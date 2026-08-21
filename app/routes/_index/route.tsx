import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      {/* Left Marketing Side */}
      <div className={styles.leftSide}>
        <div className={styles.logoArea}>
          <img src="/logo.png" alt="Popup Builder Logo" className={styles.mainLogo} />
        </div>


        <h1 className={styles.heading}>
          Engage Visitors.<br/>
          Boost <span className={styles.headingHighlight}>Sales.</span>
        </h1>
        
        <p className={styles.text}>
          Create stunning popups, spin-the-wheels, and mystery boxes in minutes. Turn your store traffic into loyal customers.
        </p>

        <div className={styles.featuresList}>
          <div className={styles.featureBadge}>
            <svg className={styles.featureIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            High Conversion
          </div>
          <div className={styles.featureBadge}>
            <svg className={styles.featureIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12 2.1 12"></path><path d="M12 12 21.9 12"></path><path d="M12 12 12 21.9"></path></svg>
            Fully Customizable
          </div>
        </div>

        <div className={styles.illustrationWrapper}>
          <img src="/login_illustration.png" alt="3D UI Elements" className={styles.illustration} />
        </div>
      </div>

      {/* Right Login Side */}
      <div className={styles.rightSide}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogoArea}>
            <img src="/logo.png" alt="Popup Builder Logo" className={styles.mainLogo} />
          </div>

          <h2 className={styles.welcomeHeading}>Welcome Back</h2>
          <p className={styles.welcomeText}>Log in to your account to continue</p>

          {showForm && (
            <Form className={styles.form} method="post" action="/auth/login">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Shop domain</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                  </div>
                  <input className={styles.input} type="text" name="shop" placeholder="e.g. my-shop-domain.myshopify.com" required />
                </div>
                <div className={styles.hint}>e.g. my-shop-domain.myshopify.com</div>
              </div>

              <button className={styles.button} type="submit">
                Log in
              </button>
            </Form>
          )}

          <div className={styles.footer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            Secure and trusted by thousands of Shopify merchants
          </div>
        </div>
      </div>
    </div>
  );
}
