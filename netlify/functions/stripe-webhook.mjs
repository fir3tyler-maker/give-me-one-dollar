export default async (request) => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        });
    }

    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!signature) {
        return new Response("Missing Stripe signature", {
            status: 400
        });
    }

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
};
