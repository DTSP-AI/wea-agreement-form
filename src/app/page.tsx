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

export default function Home() {
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activePlanId, setActivePlanId] = useState<PlanId>("B");
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const activePlan = plans[activePlanId];

  const handlePlanSwitch = useCallback(
    (id: PlanId) => {
      if (id === activePlanId) return;
      setSlideDirection(id === "A" ? -1 : 1);
      setActivePlanId(id);
    },
    [activePlanId]
  );

  const handleSignatureComplete = useCallback(() => {
    setSignatureComplete(true);
    // Scroll to payment
    setTimeout(() => {
      document
        .getElementById("payment-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, []);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const content = contentRef.current;
      if (!content) return;

      // Hide Rick chat for PDF
      const rickEl = document.querySelector("[data-rick-chat]") as HTMLElement;
      if (rickEl) rickEl.style.display = "none";

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0a0a0a",
        logging: false,
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const totalPdfHeight = imgHeight * ratio;

      let position = 0;
      let page = 0;

      while (position < totalPdfHeight) {
        if (page > 0) pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          -position,
          scaledWidth,
          totalPdfHeight
        );

        position += pdfHeight;
        page++;
      }

      pdf.save("WEA_Platform_Agreement_Signed.pdf");

      if (rickEl) rickEl.style.display = "";
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header bar */}
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
                Platform Proposal for WEA
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

        {/* Plan tabs */}
        <div className="max-w-4xl mx-auto px-6 pb-3">
          <div className="relative inline-flex bg-[#141414] border border-[#262626] rounded-full p-1 gap-1">
            {(["A", "B"] as PlanId[]).map((id) => {
              const isActive = id === activePlanId;
              return (
                <button
                  key={id}
                  onClick={() => handlePlanSwitch(id)}
                  className={`relative z-10 px-5 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isActive ? "text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="plan-tab-pill"
                      className="absolute inset-0 bg-green-400 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">
                    Plan {id} —{" "}
                    <span className={isActive ? "font-bold" : "font-normal"}>
                      {plans[id].meta.totalValue}
                    </span>
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

      {/* Main content */}
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
          </div>
        )}
      </div>

      {/* Rick */}
      <div data-rick-chat>
        <RickChat />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 text-center">
        <p className="text-xs text-zinc-600">
          Confidential — DTSP-AI Technologies &middot; {activePlan.meta.date}
          &middot; {activePlan.meta.contact}
        </p>
      </footer>
    </div>
  );
}
