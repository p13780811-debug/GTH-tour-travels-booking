export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Keep legacy icon URLs working with the existing approved static PWA assets.
 * The fixed allowlist prevents arbitrary file paths and external redirects.
 */
export async function GET(_req: Request, context: {params: Promise<{size: string}>}) {
  const {size} = await context.params;
  if (!/^(180|192|512)$/.test(size)) {
    return Response.json({error:"Unsupported icon size"}, {status:404});
  }
  return new Response(null, {
    status: 307,
    headers: {
      Location: "/app-brand/icon-" + size + ".png",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
