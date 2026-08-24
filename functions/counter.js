export async function onRequestGet({ env }) {
  try {
    const result = await env.DB
      .prepare(`
        SELECT
          COALESCE(SUM(amount), 0) AS amount,
          COUNT(*) AS people
        FROM payments
      `)
      .first();

    return Response.json({
      amount: Number(result?.amount || 0) / 100,
      people: Number(result?.people || 0)
    });
  } catch (error) {
    console.error("Counter error:", error);

    return Response.json(
      {
        error: "Unable to load counter."
      },
      {
        status: 500
      }
    );
  }
}
