export async function onRequestGet({ env }) {
    const file = await env.MEDIA.get("songs/main.mp3");

    if (!file) {
        return new Response("songs/main.mp3 not found in R2", {
            status: 404
        });
    }

    return new Response(file.body, {
        headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600"
        }
    });
}
