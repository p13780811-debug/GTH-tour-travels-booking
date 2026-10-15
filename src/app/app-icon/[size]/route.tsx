import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

/** Branded, deterministic raster PNGs; no remote image host, font CDN or token. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const dimension = Number(size);
  if (![180, 192, 512].includes(dimension)) {
    return NextResponse.json({ error: "Unsupported icon size" }, { status: 404 });
  }
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#061426", color: "#f8f9fe",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        height: "80%", width: "80%", borderRadius: "24%", border: `${Math.max(3, Math.floor(dimension / 95))}px solid #d4af37`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", fontWeight: 800, fontSize: Math.round(dimension * 0.225), letterSpacing: "-0.06em" }}>GTH</div>
        <div style={{ display: "flex", alignItems: "center", fontWeight: 800, fontSize: Math.round(dimension * 0.155), color: "#d4af37", letterSpacing: "0.18em", marginLeft: dimension * 0.025 }}>PRO</div>
      </div>
    </div>, { width: dimension, height: dimension,
      headers: { "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
    },
  );
}
