```js
export async function onRequestGet({ env }) {
    try {
        if (!env.MEDIA) {
            return Response.json({
                success: false,
                error: "MEDIA binding is NOT available"
            }, { status: 500 });
        }

        const object = await env.MEDIA.get("songs/main.mp3");

        if (!object) {
            return Response.json({
                success: false,
                error: "MEDIA works, but songs/main.mp3 was NOT found"
            }, { status: 404 });
        }

        return Response.json({
            success: true,
            message: "Pages can access R2",
            file: "songs/main.mp3",
            size: object.size,
            httpMetadata: object.httpMetadata || null
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
```
