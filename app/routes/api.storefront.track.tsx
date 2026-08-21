import { data, type ActionFunctionArgs } from "react-router";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
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

    return data({ success: true });
  } catch (error) {
    console.error("Error tracking popup:", error);
    return data({ error: "Failed to track metrics" }, { status: 500 });
  }
};
