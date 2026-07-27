import { NextResponse } from "next/server";

const CDN_ORIGIN = "https://cdn.shimokitan.live";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const key = path.map(decodeURIComponent).join("/");

  if (!key.startsWith("media/audio/") || key.includes("..")) {
    return NextResponse.json({ error: "INVALID_MEDIA_PATH" }, { status: 400 });
  }

  const upstreamUrl = new URL(key, `${CDN_ORIGIN}/`);
  const range = request.headers.get("range");
  const upstream = await fetch(upstreamUrl, {
    headers: range ? { range } : undefined,
    cache: "no-store",
  });

  const headers = new Headers();
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
