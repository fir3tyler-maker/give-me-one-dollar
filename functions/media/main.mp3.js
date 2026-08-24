```js
export async function onRequestGet({ env }) {
    const object = await env.MEDIA.get("songs/main.mp3");

    if (!object) {
        return new Response("songs/main.mp3 was not found in R2", {
            status: 404
        });
    }

    const headers = new Headers();

    headers.set("Content-Type", "audio/mpeg");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(object.body, {
        headers
    });
}
```
