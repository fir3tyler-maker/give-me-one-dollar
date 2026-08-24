export async function onRequest({ request, env }) {
    const url = new URL(request.url);

    if (request.method === "GET") {
        return await getSettings(env);
    }

    if (request.method === "POST") {
        return await saveSettings(request, env);
    }

    return new Response("Method not allowed", {
        status: 405
    });
}


async function getSettings(env) {

    const result = await env.DB
        .prepare(`
            SELECT key, value
            FROM site_settings
        `)
        .all();

    const settings = {};

    for (const row of result.results || []) {
        settings[row.key] = row.value;
    }

    return Response.json(settings);
}


async function saveSettings(request, env) {

    const body = await request.json();

    const allowedKeys = [
        "title",
        "subtitle",
        "price",
        "buy_button",
        "about",
        "song_key",
        "image_key"
    ];

    for (const key of allowedKeys) {

        if (body[key] === undefined) {
            continue;
        }

        await env.DB
            .prepare(`
                INSERT INTO site_settings (key, value)
                VALUES (?, ?)

                ON CONFLICT(key)
                DO UPDATE SET value = excluded.value
            `)
            .bind(
                key,
                String(body[key])
            )
            .run();
    }

    return Response.json({
        success: true
    });
}
