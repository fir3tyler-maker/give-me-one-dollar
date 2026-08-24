```js
export async function onRequestGet(ctx) {
    const path = new URL(ctx.request.url)
        .pathname
        .replace(/^\/media\//, "");

    if (!path) {
        return new Response("Missing media file", {
            status: 400
        });
    }

    if (!ctx.env.MEDIA) {
        return new Response(
            "ERROR: MEDIA R2 binding is missing",
            {
                status: 500
            }
        );
    }

    const file = await ctx.env.MEDIA.get(path);

    if (!file) {
        return new Response(
            "File not found in R2: " + path,
            {
                status: 404
            }
        );
    }

    const headers = new Headers();

    file.writeHttpMetadata(headers);

    if (path.endsWith(".mp3")) {
        headers.set(
            "Content-Type",
            "audio/mpeg"
        );
    }

    headers.set(
        "Cache-Control",
        "public, max-age=3600"
    );

    return new Response(file.body, {
        headers
    });
}
```
