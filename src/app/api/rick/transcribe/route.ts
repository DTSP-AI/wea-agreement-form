import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
// Allow larger uploads (~25MB — Whisper's own limit).
export const maxDuration = 60;

// POST /api/rick/transcribe
// Body: multipart/form-data with a "file" field (audio blob).
// Returns: { text: string }
export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Missing 'file' field in form data." },
      { status: 400 }
    );
  }

  // Forward straight to OpenAI. whisper-1 is the simplest + mobile-friendly.
  const upstream = new FormData();
  upstream.set("file", file, "audio.webm");
  upstream.set("model", "whisper-1");
  upstream.set("response_format", "json");

  try {
    const res = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstream,
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: "Whisper failed", status: res.status, body },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    const text = typeof data.text === "string" ? data.text.trim() : "";
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach OpenAI", detail: String(err) },
      { status: 502 }
    );
  }
}
