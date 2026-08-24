```js
export async function onRequestGet({ params, env }) {

    const key = params.key;

    if (!key) {
        return new Response("Missing file key", {
            status: 400
        });
    }

    // Publicly accessible file: preview only.
    if (key !== "songs/preview.mp3") {
        return new Response("Not found", {
            status: 404
        });
    }

    const object = await env.MEDIA.get(key);

    if (!object) {
        return new Response("Preview not found", {
            status: 404
        });
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
