import { NextResponse } from "next/server";
import { RICK_SYSTEM_PROMPT } from "@/lib/rick-messages";

// Never cache — every call must mint a fresh ephemeral token.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
const REALTIME_VOICE = "ash"; // warm, laid-back, fits Rick's deadhead cadence

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: REALTIME_MODEL,
        voice: REALTIME_VOICE,
        instructions: RICK_SYSTEM_PROMPT,
        modalities: ["audio", "text"],
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: "OpenAI session mint failed", status: res.status, body },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      client_secret: data.client_secret,
      model: REALTIME_MODEL,
      voice: REALTIME_VOICE,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach OpenAI", detail: String(err) },
      { status: 502 }
    );
  }
}
