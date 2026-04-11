"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ProposalContent from "@/components/ProposalContent";
import SignaturePanel from "@/components/SignaturePanel";
import PaymentPanel from "@/components/PaymentPanel";
import { proposalMeta } from "@/lib/proposal-data";

const RickChat = dynamic(() => import("@/components/RickChat"), {
  ssr: false,
});

export default function Home() {
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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
      </header>

      {/* Main content */}
      <div ref={contentRef}>
        <ProposalContent />
        <SignaturePanel onSignatureComplete={handleSignatureComplete} />
        {signatureComplete && (
          <div id="payment-section">
            <PaymentPanel
              onExportPDF={handleExportPDF}
              isExporting={isExporting}
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
          Confidential — DTSP-AI Technologies &middot; {proposalMeta.date}
          &middot; pete@deal-whisper.com
        </p>
      </footer>
    </div>
  );
}
