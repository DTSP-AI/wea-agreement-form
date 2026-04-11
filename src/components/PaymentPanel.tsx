"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Copy,
  Check,
  Download,
  FileText,
  Mail,
  Smartphone,
} from "lucide-react";
import { proposalMeta } from "@/lib/proposal-data";

interface PaymentPanelProps {
  onExportPDF: () => void;
  isExporting: boolean;
}

export default function PaymentPanel({
  onExportPDF,
  isExporting,
}: PaymentPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(proposalMeta.zelleEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 pb-16"
    >
      <div className="bg-[#141414] border border-green-800/40 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/30 to-[#141414] px-8 py-6 border-b border-green-900/30">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-400" />
            Initial Deposit — {proposalMeta.investmentAtSigning}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            Send your initial deposit via Zelle to lock in your project start
            date. Work begins the day payment is received.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Zelle Info */}
          <div className="bg-[#0d1117] border border-green-900/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-green-300">
                Pay via Zelle
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Send to
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-green-400 font-mono text-lg">
                    {proposalMeta.zelleEmail}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-3 rounded-lg bg-green-900/30 border border-green-800/40 hover:bg-green-800/40 transition-colors text-green-400 cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-xs mt-2"
                  >
                    Copied to clipboard
                  </motion.p>
                )}
              </div>

              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Amount
                </div>
                <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-white font-bold text-2xl">
                  {proposalMeta.investmentAtSigning}
                  <span className="text-zinc-500 text-sm font-normal ml-2">
                    USD
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Memo / Note
                </div>
                <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-zinc-300 text-sm">
                  WEA Platform — Phase 1 Deposit
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                icon: Mail,
                title: "Open Zelle",
                desc: "Open your bank's Zelle feature or the Zelle app",
              },
              {
                step: 2,
                icon: DollarSign,
                title: "Send $3,600",
                desc: `Send to ${proposalMeta.zelleEmail} with memo "WEA Platform"`,
              },
              {
                step: 3,
                icon: Check,
                title: "We Start",
                desc: "Pete confirms receipt and Phase 1 kicks off immediately",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-5 text-center"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold text-white text-sm mb-1">
                  {item.title}
                </h4>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Export PDF */}
          <div className="pt-4 border-t border-[#262626]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <FileText className="w-4 h-4" />
                Download a signed copy for your records
              </div>
              <button
                onClick={onExportPDF}
                disabled={isExporting}
                className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Generating PDF..." : "Export Signed Agreement (PDF)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
