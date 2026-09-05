import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLASK = process.env.FLASK_ORIGIN || "http://127.0.0.1:5001";

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const outbound = new FormData();

    const name = incoming.get("name");
    if (typeof name === "string") outbound.append("name", name);

    const images = incoming.getAll("images");
    for (const item of images) {
      if (item instanceof Blob) {
        const filename =
          typeof File !== "undefined" && item instanceof File && item.name
            ? item.name
            : "photo.jpg";
        outbound.append("images", item, filename);
      }
    }

    const res = await fetch(`${FLASK}/add_person`, {
      method: "POST",
      body: outbound,
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return NextResponse.json(
      { error: text || `Add person failed (${res.status})` },
      { status: res.status || 500 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Add person proxy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
