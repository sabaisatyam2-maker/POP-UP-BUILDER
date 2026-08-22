import { data, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import db from "../db.server";
import crypto from "crypto";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Basic Shopify Proxy Signature Verification
  // In a real production app, verify signature using process.env.SHOPIFY_API_SECRET
  // For the sake of this prototype, we'll bypass strict verification if we want easy testing,
  // but it's important to include the structure.

  const shop = url.searchParams.get("shop");
  if (!shop) {
    return data({ error: "Missing shop parameter" }, { status: 400 });
  }

  // Fetch active popups for this shop
  try {
    const popups = await db.popup.findMany({
      where: {
        shop: shop,
        status: "ACTIVE",
      },
    });
    
    // Shopify App proxy sets x-forwarded-host to the shop domain, but we want the actual app backend URL
    // for serving static images from the /public folder.
    const appUrl = process.env.SHOPIFY_APP_URL || `${url.protocol}//${url.host}`;

    return data({ popups, appUrl }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error) {
    console.error("Error fetching popups:", error);
    return data({ error: "Failed to fetch popups" }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};
