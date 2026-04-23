"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import ProposalContent from "@/components/ProposalContent";
import SignaturePanel from "@/components/SignaturePanel";
import PaymentPanel from "@/components/PaymentPanel";
import { plans, type PlanId } from "@/lib/proposal-data";

const RickChat = dynamic(() => import("@/components/RickChat"), {
  ssr: false,
});

const PLAN_ORDER: PlanId[] = ["A", "B", "C", "CA"];

const PLAN_TAB_LABELS: Record<PlanId, string> = {
  A: "Plan A",
  B: "Plan B",
  C: "Plan C",
  CA: "C Addendum",
};

export default function ProposalPage({
  initialPlanId = "C",
  lockPlan = false,
}: {
  initialPlanId?: PlanId;
  lockPlan?: boolean;
}) {
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [activePlanId, setActivePlanId] = useState<PlanId>(initialPlanId);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const activePlan = plans[activePlanId];

  const handlePlanSwitch = useCallback(
    (id: PlanId) => {
      if (id === activePlanId) return;
      const curIdx = PLAN_ORDER.indexOf(activePlanId);
      const newIdx = PLAN_ORDER.indexOf(id);
      setSlideDirection(newIdx > curIdx ? 1 : -1);
      setActivePlanId(id);
    },
    [activePlanId]
  );

  const handleSignatureComplete = useCallback(() => {
    setSignatureComplete(true);
    setTimeout(() => {
      document
        .getElementById("payment-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");

      // Native text PDF — no html2canvas, no raster blow-up. Small file,
      // searchable text, renders correctly on iOS Safari + Android Chrome.
      const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentW = pageW - margin * 2;
      let y = margin;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const writeWrapped = (
        text: string,
        opts: {
          size?: number;
          bold?: boolean;
          color?: [number, number, number];
          lineGap?: number;
          spaceAfter?: number;
        } = {}
      ) => {
        const size = opts.size ?? 10;
        const color = opts.color ?? [30, 30, 30];
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentW);
        const lineHeight = size * 1.35;
        for (const line of lines) {
          ensureSpace(lineHeight);
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += opts.spaceAfter ?? 4;
      };

      const hr = () => {
        ensureSpace(12);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 14;
      };

      // ---------- Header ----------
      doc.setFillColor(16, 16, 16);
      doc.rect(0, 0, pageW, 72, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("DTSP-AI Technologies", margin, 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(160, 160, 160);
      doc.text("Signed Agreement", margin, 48);
      doc.setFontSize(9);
      doc.text(activePlan.meta.date, pageW - margin, 48, { align: "right" });
      y = 96;

      // ---------- Title ----------
      writeWrapped(activePlan.name + " — " + activePlan.tagline, {
        size: 18,
        bold: true,
        color: [20, 20, 20],
        spaceAfter: 4,
      });
      writeWrapped(activePlan.heroTitle, {
        size: 12,
        color: [90, 90, 90],
        spaceAfter: 14,
      });
      hr();

      // ---------- Parties ----------
      writeWrapped("Parties", { size: 12, bold: true, spaceAfter: 6 });
      writeWrapped(
        "Provider: DTSP-AI Technologies (Peter W Davidsmeier, Founder & Lead Architect)",
        { size: 10, color: [50, 50, 50], spaceAfter: 2 }
      );
      writeWrapped(
        "Client: " +
          activePlan.meta.preparedFor +
          " (" +
          activePlan.meta.clientName +
          ")",
        { size: 10, color: [50, 50, 50], spaceAfter: 12 }
      );
      hr();

      // ---------- Scope ----------
      writeWrapped("Scope", { size: 12, bold: true, spaceAfter: 6 });
      writeWrapped(activePlan.heroSubtitle, {
        size: 10,
        color: [50, 50, 50],
        spaceAfter: 12,
      });
      hr();

      // ---------- Investment ----------
      writeWrapped("Investment & Payment Schedule", {
        size: 12,
        bold: true,
        spaceAfter: 6,
      });
      writeWrapped(
        "Project Term: " +
          activePlan.meta.projectTerm +
          "    Total: " +
          activePlan.meta.totalValue,
        { size: 10, color: [50, 50, 50], spaceAfter: 10 }
      );

      if (activePlan.meta.paymentSchedule) {
        // Header row
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        ensureSpace(16);
        doc.text("#", margin, y);
        doc.text("Date", margin + 24, y);
        doc.text("Amount", margin + 200, y);
        doc.text("Status", margin + 280, y);
        y += 14;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y - 6, pageW - margin, y - 6);

        activePlan.meta.paymentSchedule.forEach((p, i) => {
          ensureSpace(16);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          doc.text(String(i + 1), margin, y);
          doc.text(p.dateLabel, margin + 24, y);
          doc.text(p.amount, margin + 200, y);
          if (p.paid) {
            doc.setTextColor(21, 128, 61);
            doc.setFont("helvetica", "bold");
            doc.text(
              "PAID" + (p.paidOn ? " " + p.paidOn : ""),
              margin + 280,
              y
            );
          } else {
            doc.setTextColor(120, 120, 120);
            doc.text(p.tag ?? "Biweekly", margin + 280, y);
          }
          y += 15;
        });
        y += 6;
      } else {
        writeWrapped(
          "Initial Deposit: " +
            activePlan.meta.investmentAtSigning +
            "    Per Milestone: " +
            activePlan.meta.perMilestone +
            " × " +
            activePlan.meta.milestoneCount,
          { size: 10, color: [50, 50, 50], spaceAfter: 10 }
        );
      }
      hr();

      // ---------- Milestones ----------
      writeWrapped("Milestones", { size: 12, bold: true, spaceAfter: 6 });
      activePlan.phases.forEach((phase) => {
        writeWrapped(
          "Milestone " +
            phase.number +
            " — " +
            phase.title +
            "  (" +
            phase.weeks +
            ", " +
            phase.milestone +
            ")",
          { size: 10.5, bold: true, color: [20, 20, 20], spaceAfter: 2 }
        );
        phase.deliverables.forEach((d) => {
          writeWrapped("• " + d, {
            size: 9.5,
            color: [70, 70, 70],
            spaceAfter: 0,
          });
        });
        y += 6;
      });
      hr();

      // ---------- Pass-through costs ----------
      writeWrapped("Pass-through costs (not included)", {
        size: 11,
        bold: true,
        spaceAfter: 4,
      });
      writeWrapped(
        "Infrastructure (AWS hosting, database, object storage, bandwidth) and third-party API/LLM token usage (Claude, OpenAI, Stripe, GoHighLevel, etc.) are pass-through at cost with no markup. Billed monthly once production traffic begins.",
        { size: 9, color: [70, 70, 70], spaceAfter: 12 }
      );
      hr();

      // ---------- Signatures ----------
      ensureSpace(170);
      writeWrapped("Signatures", { size: 12, bold: true, spaceAfter: 10 });

      const colW = contentW / 2 - 10;
      const sigTop = y;

      // Provider
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text("DTSP-AI Technologies", margin, sigTop);
      doc.setFont("times", "italic");
      doc.setFontSize(18);
      doc.setTextColor(21, 128, 61);
      doc.text("Peter W Davidsmeier", margin, sigTop + 30);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, sigTop + 40, margin + colW, sigTop + 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("Peter W Davidsmeier", margin, sigTop + 55);
      doc.setTextColor(110, 110, 110);
      doc.text("Founder & Lead Architect", margin, sigTop + 68);
      doc.text("Date: April 10, 2026", margin, sigTop + 82);

      // Client
      const clientX = margin + colW + 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(activePlan.meta.preparedFor, clientX, sigTop);

      // Embed signature image if present
      try {
        const raw = localStorage.getItem("wea-signature-data");
        if (raw) {
          const sig = JSON.parse(raw) as {
            clientName?: string;
            clientTitle?: string;
            clientSignature?: string | null;
            clientDate?: string;
          };
          if (sig.clientSignature) {
            doc.addImage(
              sig.clientSignature,
              "PNG",
              clientX,
              sigTop + 6,
              colW,
              34,
              undefined,
              "FAST"
            );
          }
          doc.setDrawColor(200, 200, 200);
          doc.line(clientX, sigTop + 40, clientX + colW, sigTop + 40);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          doc.text(sig.clientName ?? "", clientX, sigTop + 55);
          doc.setTextColor(110, 110, 110);
          if (sig.clientTitle) {
            doc.text(sig.clientTitle, clientX, sigTop + 68);
          }
          doc.text(
            "Date: " + (sig.clientDate ?? ""),
            clientX,
            sigTop + 82
          );
        } else {
          doc.setDrawColor(200, 200, 200);
          doc.line(clientX, sigTop + 40, clientX + colW, sigTop + 40);
          doc.setTextColor(160, 160, 160);
          doc.text("(signature pending)", clientX, sigTop + 55);
        }
      } catch {
        /* ignore — render blank signature line */
      }

      y = sigTop + 96;

      // ---------- Footer ----------
      ensureSpace(24);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        "Confidential — DTSP-AI Technologies · " +
          activePlan.meta.date +
          " · " +
          activePlan.meta.contact,
        margin,
        y
      );

      // ---------- Save ----------
      // Using a Blob + anchor is the most reliable cross-platform trigger —
      // iOS Safari and Android Chrome both respect `download` on blob URLs.
      const filename =
        (activePlan.id === "CA"
          ? "WEI_Plan_C_Addendum_Signed"
          : "WEI_" + activePlan.name.replace(/\s+/g, "_") + "_Signed") + ".pdf";
      const blob = doc.output("blob") as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setPdfDownloaded(true);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [activePlan]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xs">
              D
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                DTSP-AI Technologies
              </div>
              <div className="text-xs text-zinc-500">
                Platform Proposal for WEI
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Proposal", href: "#hero" },
              { label: "Comparison", href: "#comparison" },
              { label: "SEO", href: "#seo" },
              { label: "Investment", href: "#investment" },
              { label: "Sign", href: "#signature-section" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs text-zinc-400 hover:text-green-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-3">
          <div className="relative inline-flex flex-wrap bg-[#141414] border border-[#262626] rounded-full p-1 gap-1">
            {PLAN_ORDER.filter((id) => !lockPlan || id === activePlanId).map((id) => {
              const isActive = id === activePlanId;
              const isAddendum = id === "CA";
              const activeBg = isAddendum ? "bg-yellow-400" : "bg-green-400";
              return (
                <button
                  key={id}
                  onClick={() => handlePlanSwitch(id)}
                  className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? "text-black"
                      : isAddendum
                        ? "text-yellow-300 hover:text-yellow-200"
                        : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="plan-tab-pill"
                      className={`absolute inset-0 ${activeBg} rounded-full`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {PLAN_TAB_LABELS[id]} —{" "}
                    <span className={isActive ? "font-bold" : "font-normal"}>
                      {plans[id].meta.totalValue}
                    </span>
                    {isAddendum && (
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                          isActive
                            ? "bg-black/20 text-black"
                            : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        Today
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-xs text-zinc-500 mt-2 px-2">
            {activePlan.tagline}
          </div>
        </div>
      </header>

      <div ref={contentRef}>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={activePlanId}
              custom={slideDirection}
              initial={{ x: slideDirection * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection * -60, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <ProposalContent plan={activePlan} />
            </motion.div>
          </AnimatePresence>
        </div>
        <SignaturePanel
          onSignatureComplete={handleSignatureComplete}
          plan={activePlan}
        />
        {signatureComplete && (
          <div id="payment-section">
            <PaymentPanel
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
              plan={activePlan}
            />
            {pdfDownloaded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto px-6 pb-12"
              >
                <div className="bg-gradient-to-r from-green-900/30 via-[#141414] to-green-900/20 border border-green-500/50 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-green-300 text-xs font-bold uppercase tracking-[0.2em] mb-1">
                      Signed Copy Downloaded
                    </div>
                    <div className="text-white font-semibold">
                      Your Client Portal is unlocked.
                    </div>
                    <div className="text-zinc-400 text-xs mt-1">
                      Checklist, Drive folders, payment schedule, and Rick
                      — all in one place.
                    </div>
                  </div>
                  <a
                    href="/portal"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold text-sm transition-all cursor-pointer shadow-[0_0_40px_rgba(34,197,94,0.35)]"
                  >
                    Open Client Portal
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div data-rick-chat>
        <RickChat />
      </div>

      <footer className="border-t border-[#1a1a1a] py-8 text-center">
        <p className="text-xs text-zinc-600">
          Confidential — DTSP-AI Technologies &middot; {activePlan.meta.date}
          &middot; {activePlan.meta.contact}
        </p>
      </footer>
    </div>
  );
}
