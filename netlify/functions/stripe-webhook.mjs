import crypto from "crypto";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is missing");
    return new Response("Server configuration error", { status: 500 });
  }

  try {
    const elements = signature.split(",");
    const timestamp = elements
      .find((item) => item.startsWith("t="))
      ?.substring(2);

    const signatures = elements
      .filter((item) => item.startsWith("v1="))
      .map((item) => item.substring(3));

    if (!timestamp || signatures.length === 0) {
      return new Response("Invalid Stripe signature", { status: 400 });
    }

    const signedPayload = `${timestamp}.${body}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    const valid = signatures.some(
      (sig) => sig === expectedSignature
    );

    if (!valid) {
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type === "checkout.session.completed") {
      console.log("PAYMENT RECEIVED:", event.data.object.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 400 });
  }
};
