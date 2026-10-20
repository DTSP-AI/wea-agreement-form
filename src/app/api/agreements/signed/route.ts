import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { plans, type PlanId } from "@/lib/proposal-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ============================================================================
// Signed-agreement archive — DTSP-AI's copy of the client's signed PDF.
// ----------------------------------------------------------------------------
// The client's browser builds the signed PDF (ProposalPage.handleExportPDF)
// and downloads it locally. It also POSTs the same bytes here so both
// parties hold the identical document. Storage is the project's Vercel Blob
// store (private access): the SDK authenticates with BLOB_READ_WRITE_TOKEN,
// or with Vercel OIDC when BLOB_STORE_ID is set — both are injected when the
// store is connected to the project in the Vercel dashboard.
//
// When no store is connected the route answers 503 { archived: false } and
// the client UI tells the signer to email the PDF instead — the download
// itself never depends on this route.
// ============================================================================

const MAX_PDF_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5 MB body limit

interface ArchiveBody {
  planId?: string;
  pdfBase64?: string;
  record?: {
    clientName?: string;
    clientTitle?: string;
    clientDate?: string;
    signedAtIso?: string;
    docHash?: string;
    termsVersion?: string;
    representedEntity?: string;
  };
}

function isConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { archived: false, reason: "not-configured" },
      { status: 503 }
    );
  }

  let body: ArchiveBody;
  try {
    body = (await req.json()) as ArchiveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const planId = body.planId as PlanId | undefined;
  if (!planId || !(planId in plans)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  const record = body.record ?? {};
  if (!record.clientName || !record.signedAtIso) {
    return NextResponse.json(
      { error: "Acceptance record is missing the signer or timestamp." },
      { status: 400 }
    );
  }
  // "%PDF-" base64-encodes to "JVBERi0" — reject anything that is not a PDF.
  if (!body.pdfBase64 || !body.pdfBase64.startsWith("JVBERi0")) {
    return NextResponse.json({ error: "Body is not a PDF." }, { status: 400 });
  }
  const pdf = Buffer.from(body.pdfBase64, "base64");
  if (pdf.byteLength > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF too large." }, { status: 413 });
  }

  const stamp = record.signedAtIso.replace(/[:.]/g, "-");
  const hash8 = (record.docHash ?? "nohash").slice(0, 8);
  const base = `agreements/${planId}/${stamp}-${hash8}`;

  try {
    const stored = await put(`${base}.pdf`, pdf, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    await put(
      `${base}.json`,
      JSON.stringify(
        {
          planId,
          planName: plans[planId].name,
          termsVersion: plans[planId].termsVersion ?? null,
          ...record,
          archivedAtIso: new Date().toISOString(),
          pdfPathname: stored.pathname,
        },
        null,
        2
      ),
      {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
      }
    );
    return NextResponse.json({ archived: true, pathname: stored.pathname });
  } catch (err) {
    console.error("Signed agreement archive failed:", err);
    return NextResponse.json(
      { archived: false, reason: "storage-error" },
      { status: 502 }
    );
  }
}
