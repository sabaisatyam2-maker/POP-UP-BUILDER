import { data, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }
  
  // Verify App Proxy request signature
  try {
    await authenticate.public.appProxy(request);
  } catch (error) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { shop, popupId, type } = payload; // type: 'view' or 'click'

    if (!shop || !popupId || !type) {
      return data({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "view") {
      await db.popup.update({
        where: { id: popupId },
        data: { views: { increment: 1 } },
      });
    } else if (type === "click") {
      await db.popup.update({
        where: { id: popupId },
        data: { clicks: { increment: 1 } },
      });
    }

    return data({ success: true }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error) {
    console.error("Error tracking popup:", error);
    return data({ error: "Failed to track metrics" }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
};
