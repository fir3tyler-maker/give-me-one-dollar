export async function onRequestGet(ctx) {
    const url = new URL(ctx.request.url);

    const path = url.pathname.replace("/media/", "");

    const file = await ctx.env.MEDIA.get(path);

    if (!file) {
        return new Response("File not found", {
            status: 404
        });
    }

    let contentType = "application/octet-stream";

    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
        contentType = "image/jpeg";
    } else if (path.endsWith(".png")) {
        contentType = "image/png";
    } else if (path.endsWith(".webp")) {
        contentType = "image/webp";
    } else if (path.endsWith(".gif")) {
        contentType = "image/gif";
    } else if (path.endsWith(".mp3")) {
        contentType = "audio/mpeg";
    }

    return new Response(file.body, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600"
        }
    });
}
