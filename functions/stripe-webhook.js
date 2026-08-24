export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text();

    console.log("Stripe webhook received");

    return new Response(
      JSON.stringify({
        received: true
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return new Response(
      JSON.stringify({
        error: "Webhook processing failed"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
