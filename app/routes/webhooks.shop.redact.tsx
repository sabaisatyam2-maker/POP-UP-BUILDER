import { type ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Shop redact payload:", payload);

  // The shop has been deleted or requested data removal. 
  // We must delete their popups and subscriptions from our database.
  
  try {
    await db.popup.deleteMany({ where: { shop } });
    await db.subscription.deleteMany({ where: { shop } });
    await db.activityLog.deleteMany({ where: { shop } });
    await db.watchlist.deleteMany({ where: { shop } });
    
    // If the session table has rows, they are typically handled by `app/uninstalled`
    // but doing it here guarantees GDPR compliance.
    await db.session.deleteMany({ where: { shop } });
  } catch (error) {
    console.error("Error redacting shop data:", error);
  }

  return new Response("OK", { status: 200 });
};
