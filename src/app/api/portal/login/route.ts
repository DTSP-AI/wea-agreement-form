import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Constant-time compare so we don't leak timing signals on the password check.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: Request) {
  const expectedEmail = (process.env.PORTAL_LANCE_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const expectedPassword = process.env.PORTAL_LANCE_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      {
        error:
          "Portal login is not configured on the server (missing PORTAL_LANCE_EMAIL or PORTAL_LANCE_PASSWORD env).",
      },
      { status: 500 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const emailMatch = timingSafeEqual(email, expectedEmail);
  const passMatch = timingSafeEqual(password, expectedPassword);
  if (!emailMatch || !passMatch) {
    return NextResponse.json(
      { error: "Those credentials don't match. Double-check and try again." },
      { status: 401 }
    );
  }

  // Success — return a short-lived-ish token the client can stash in
  // localStorage. This is a demo gate, not a real auth system; rotate
  // PORTAL_LANCE_PASSWORD in Vercel env to invalidate existing sessions.
  return NextResponse.json({
    ok: true,
    email: expectedEmail,
    issuedAt: new Date().toISOString(),
  });
}
