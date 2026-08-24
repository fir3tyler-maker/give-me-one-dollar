export async function onRequest({ request, env }) {
    const url = new URL(request.url);

    if (request.method === "GET") {
        return await getSettings(env);
    }

    if (request.method === "POST") {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
            return await uploadFile(request, env);
        }

        if (contentType.includes("application/json")) {
            return await saveSettings(request, env);
        }

        return Response.json(
            { error: "Unsupported content type" },
            { status: 415 }
        );
    }

    if (request.method === "DELETE") {
        return await deleteFile(request, env);
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


async function uploadFile(request, env) {
    const formData = await request.formData();

    const file = formData.get("file");
    const type = formData.get("type");

    if (!(file instanceof File)) {
        return Response.json(
            { error: "No file supplied" },
            { status: 400 }
        );
    }

    if (type !== "song" && type !== "image") {
        return Response.json(
            { error: "Invalid upload type" },
            { status: 400 }
        );
    }

    if (file.size === 0) {
        return Response.json(
            { error: "File is empty" },
            { status: 400 }
        );
    }

    // Safety limit for the admin uploader.
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
        return Response.json(
            { error: "File is larger than 50 MB" },
            { status: 413 }
        );
    }

    let key;
    let contentType;

    if (type === "song") {
        if (
            file.type !== "audio/mpeg" &&
            file.type !== "audio/mp3"
        ) {
            return Response.json(
                { error: "Only MP3 audio files are allowed" },
                { status: 400 }
            );
        }

        key = "songs/main.mp3";
        contentType = "audio/mpeg";
    }

    if (type === "image") {
        const allowedImages = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        };

        const extension = allowedImages[file.type];

        if (!extension) {
            return Response.json(
                {
                    error:
                        "Only JPG, PNG and WebP images are allowed"
                },
                { status: 400 }
            );
        }

        key = `images/hero.${extension}`;
        contentType = file.type;
    }

    await env.MEDIA.put(
        key,
        file.stream(),
        {
            httpMetadata: {
                contentType
            }
        }
    );

    return Response.json({
        success: true,
        key,
        type,
        size: file.size,
        contentType
    });
}


async function deleteFile(request, env) {
    const body = await request.json();

    const allowedPrefixes = [
        "songs/",
        "images/"
    ];

    const key = String(body.key || "");

    if (
        !key ||
        !allowedPrefixes.some(prefix =>
            key.startsWith(prefix)
        )
    ) {
        return Response.json(
            { error: "Invalid file key" },
            { status: 400 }
        );
    }

    await env.MEDIA.delete(key);

    return Response.json({
        success: true,
        key
    });
}
