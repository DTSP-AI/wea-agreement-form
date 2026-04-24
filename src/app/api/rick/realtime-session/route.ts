import { NextResponse } from "next/server";
import { RICK_SYSTEM_PROMPT } from "@/lib/rick-messages";

// Never cache — every call must mint a fresh ephemeral token.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Known-stable Realtime config. We previously tried gpt-realtime + cedar
// + semantic_vad — that combination caused OpenAI to return a non-SDP
// error body, which the browser then failed to parse in
// setRemoteDescription ("Expect line: v="). Dropping back to the
// verified-working preview snapshot + ash voice + server_vad.
//
// The voice still sounds natural (ash is a warm male voice) and the
// ACCESS to Rick via chat is unchanged — only the Realtime session
// config is affected.
const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";
const REALTIME_VOICE = "ash";

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
    // Surface the upstream error body if the session response is missing
    // the client_secret — the UI will display it instead of silently
    // feeding garbage into setRemoteDescription.
    if (!data?.client_secret?.value) {
      return NextResponse.json(
        {
          error:
            "OpenAI session response missing client_secret. Upstream body follows.",
          body: data,
        },
        { status: 502 }
      );
    }

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
