import { type ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Customer redact payload:", payload);

  // App doesn't store Customer PII, so we just acknowledge the request.
  return new Response("OK", { status: 200 });
};
