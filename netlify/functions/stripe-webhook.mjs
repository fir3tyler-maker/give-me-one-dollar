import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async (request) => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        });
    }

    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === "checkout.session.completed") {
            console.log("Successful payment:", event.data.object.id);
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
        console.error("Webhook error:", error.message);

        return new Response("Webhook signature verification failed", {
            status: 400
        });
    }
};
