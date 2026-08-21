let total = 0;
let people = 0;

export default async () => {
    return new Response(
        JSON.stringify({
            amount: total,
            people: people
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store"
            }
        }
    );
};
