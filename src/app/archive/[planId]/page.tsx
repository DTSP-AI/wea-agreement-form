import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProposalPage from "@/components/ProposalPage";
import { plans, type PlanId } from "@/lib/proposal-data";

// Internal-only archive of superseded plan versions (Plan A, B, C, CA, CA2,
// AA). The client-facing site serves ONLY the active addendum — every public
// plan route redirects to it. Historical versions live here for internal
// reference, gated by a server-side key so they are never client-reachable.
//
// Access: /archive/<planId>?k=<ARCHIVE_ACCESS_KEY>
// ARCHIVE_ACCESS_KEY is a server env var. Unset → this route always 404s
// (deny by default). Signed agreements never depend on this route — every
// executed version is preserved as its own hashed PDF snapshot.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ArchivePlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { planId } = await params;
  const { k } = await searchParams;

  const key = process.env.ARCHIVE_ACCESS_KEY;
  if (!key || k !== key) notFound();

  const id = planId.toUpperCase();
  if (!(id in plans)) notFound();

  return <ProposalPage initialPlanId={id as PlanId} lockPlan />;
}
