export async function onRequestPost({ request, env }) {
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Missing Stripe-Signature", {
      status: 400
    });
  }

  const payload = await request.text();

  try {
    const event = await verifyStripeSignature(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type !== "checkout.session.completed") {
      return Response.json({
        received: true,
        processed: false
      });
    }

    const session = event.data.object;

    /*
     * Only count completed payments that Stripe
     * reports as paid.
     */
    if (session.payment_status !== "paid") {
      return Response.json({
        received: true,
        processed: false
      });
    }

    const stripePaymentId = session.id;
    const amount = Number(session.amount_total || 0);

    if (!stripePaymentId || !Number.isInteger(amount)) {
      return new Response("Invalid payment data", {
        status: 400
      });
    }

    /*
     * INSERT OR IGNORE makes the webhook idempotent.
     * If Stripe sends the same event again, the payment
     * will not be counted twice.
     */
    await env.DB
      .prepare(`
        INSERT OR IGNORE INTO payments
        (stripe_payment_id, amount)
        VALUES (?, ?)
      `)
      .bind(
        stripePaymentId,
        amount
      )
      .run();

    return Response.json({
      received: true,
      processed: true
    });

  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return new Response(
      "Webhook signature verification failed",
      {
        status: 400
      }
    );
  }
}


/*
 * Stripe signature verification using
 * the Web Crypto API available in Cloudflare Workers.
 *
 * Stripe signs:
 *
 * timestamp + "." + raw_request_body
 */

async function verifyStripeSignature(
  payload,
  signatureHeader,
  secret
) {
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured"
    );
  }

  const parts =
    signatureHeader.split(",");

  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const [key, value] =
      part.split("=");

    if (key === "t") {
      timestamp = value;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    throw new Error(
      "Invalid Stripe signature header"
    );
  }

  const timestampNumber =
    Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    throw new Error(
      "Invalid Stripe timestamp"
    );
  }

  /*
   * Stripe's libraries use a 5-minute default
   * tolerance to reduce replay attacks.
   */
  const currentTime =
    Math.floor(Date.now() / 1000);

  if (
    Math.abs(
      currentTime - timestampNumber
    ) > 300
  ) {
    throw new Error(
      "Stripe webhook timestamp is too old"
    );
  }

  const signedPayload =
    `${timestamp}.${payload}`;

  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

  const expectedSignature =
    [...new Uint8Array(signature)]
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(2, "0")
      )
      .join("");

  for (const receivedSignature of signatures) {
    if (
      timingSafeEqual(
        expectedSignature,
        receivedSignature
      )
    ) {
      return JSON.parse(payload);
    }
  }

  throw new Error(
    "Invalid Stripe signature"
  );
}


function timingSafeEqual(
  a,
  b
) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}
