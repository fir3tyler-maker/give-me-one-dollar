```js
export async function onRequestGet(context) {
    const { request, env } = context;

    const url = new URL(request.url);

    // Example:
    // /media/songs/main.mp3
    //
    // becomes:
    // songs/main.mp3
    const key = url.pathname
        .replace(/^\/media\//, "");

    if (!key) {
        return new Response("Missing file key", {
            status: 400
        });
    }

    // For now, only expose the preview/main file.
    if (key !== "songs/main.mp3") {
        return new Response("Not found", {
            status: 404
        });
    }

    if (!env.MEDIA) {
        return new Response(
            "R2 binding MEDIA is not configured",
            {
                status: 500
            }
        );
    }

    const object = await env.MEDIA.get(key);

    if (!object) {
        return new Response(
            "File not found in R2: " + key,
            {
                status: 404
            }
        );
    }

    const headers = new Headers();

    object.writeHttpMetadata(headers);

    headers.set(
        "Content-Type",
        "audio/mpeg"
    );

    headers.set(
        "Cache-Control",
        "public, max-age=3600"
    );

    headers.set(
        "Accept-Ranges",
        "bytes"
    );

    return new Response(object.body, {
        headers
    });
}
```
