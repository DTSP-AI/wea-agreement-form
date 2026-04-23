import { NextResponse } from "next/server";
import { RICK_SYSTEM_PROMPT } from "@/lib/rick-messages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHAT_MODEL = "gpt-4o-mini"; // fast, cheap, same voice via shared system prompt
const MAX_TURNS = 16; // cap history sent upstream

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatTurn[];
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const turns = Array.isArray(body.messages) ? body.messages : [];
  const trimmed = turns
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_TURNS);

  if (trimmed.length === 0) {
    return NextResponse.json(
      { error: "messages[] must contain at least one turn." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature: 0.75,
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content:
              RICK_SYSTEM_PROMPT +
              "\n\nCHANNEL: You are replying in the on-page chat widget (not voice). Short, conversational paragraphs. No markdown, no bullet lists, no headers. 2–5 sentences usually.",
          },
          ...trimmed,
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: "OpenAI chat failed", status: res.status, body },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string =
      data?.choices?.[0]?.message?.content?.toString().trim() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "Empty response from model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach OpenAI", detail: String(err) },
      { status: 502 }
    );
  }
}
