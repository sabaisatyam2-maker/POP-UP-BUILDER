import { data, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  
  // Verify App Proxy request signature
  let session;
  try {
    const authResult = await authenticate.public.appProxy(request);
    session = authResult.session;
  } catch (error) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = url.searchParams.get("shop") || session?.shop;
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
