```js
export async function onRequestGet({ params, env }) {
    const key = params.key;

    if (!key) {
        return new Response("Missing file key", {
            status: 400
        });
    }

    // Only the public preview/main audio file is allowed here.
    if (key !== "songs/main.mp3") {
        return new Response("Not found", {
            status: 404
        });
    }

    const object = await env.MEDIA.get(key);

    if (!object) {
        return new Response("Audio file not found", {
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
