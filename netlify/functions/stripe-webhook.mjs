export default async (request) => {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        });
    }

    const body = await request.text();

    console.log("Stripe webhook received:", body);

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
