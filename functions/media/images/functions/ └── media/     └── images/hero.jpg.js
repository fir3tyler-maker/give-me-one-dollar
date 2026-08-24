```js
export async function onRequestGet({ env }) {
    const file = await env.MEDIA.get("images/hero.jpg");

    if (!file) {
        return new Response("images/hero.jpg not found in R2", {
            status: 404
        });
    }

    return new Response(file.body, {
        headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
```
