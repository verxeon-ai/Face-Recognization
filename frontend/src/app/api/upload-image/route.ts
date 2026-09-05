import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FLASK = process.env.FLASK_ORIGIN || "http://127.0.0.1:5001";

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const file = incoming.get("image");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const outbound = new FormData();
    // Preserve filename when available (File extends Blob in the Fetch API)
    const filename =
      typeof File !== "undefined" && file instanceof File && file.name
        ? file.name
        : "upload.jpg";
    outbound.append("image", file, filename);

    const res = await fetch(`${FLASK}/upload_image`, {
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
      { error: text || `Upload failed (${res.status})` },
      { status: res.status || 500 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload proxy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
