"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Copy,
  Check,
  Download,
  FileText,
  CreditCard,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { planC, type Plan } from "@/lib/proposal-data";

interface PaymentPanelProps {
  onExportPDF: () => void;
  isExporting: boolean;
  plan?: Plan;
}

type CopyTarget = "paypal" | "zelle";

export default function PaymentPanel({
  onExportPDF,
  isExporting,
  plan = planC,
}: PaymentPanelProps) {
  const proposalMeta = plan.meta;
  const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null);

  const handleCopy = useCallback(
    async (value: string, target: CopyTarget) => {
      await navigator.clipboard.writeText(value);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    },
    []
  );

  const isAddendum = Boolean(proposalMeta.paymentSchedule);
  const depositLabel = isAddendum
    ? `First Payment — ${proposalMeta.investmentAtSigning}`
    : `Initial Deposit — ${proposalMeta.investmentAtSigning}`;
  const depositBlurb = isAddendum
    ? `Pay today's first ${proposalMeta.investmentAtSigning} payment via PayPal or Zelle. Seven more biweekly payments of ${proposalMeta.perMilestone} follow every two weeks. Addendum terms are only valid if this first payment is received today.`
    : `Pay your initial deposit via PayPal or Zelle to lock in your project start date. Work begins the day payment is received. Six milestone payments of ${proposalMeta.perMilestone} follow every two weeks.`;
  const memoText = isAddendum
    ? "WEI Platform — Plan C Addendum, Payment 1 of 8"
    : "WEI Platform — Milestone 1 Deposit";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 pb-16"
    >
      <div
        className={`bg-[#141414] border rounded-2xl overflow-hidden ${
          isAddendum ? "border-yellow-600/50" : "border-green-800/40"
        }`}
      >
        {/* Addendum conditional banner */}
        {isAddendum && proposalMeta.conditionalBanner && (
          <div className="bg-yellow-950/40 border-b border-yellow-600/40 px-8 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 px-2 py-1 rounded bg-yellow-500 text-black text-[10px] font-bold tracking-wider uppercase flex-shrink-0">
                Valid Today Only
              </div>
              <p className="text-yellow-100 text-sm leading-relaxed">
                {proposalMeta.conditionalBanner}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div
          className={`px-8 py-6 border-b ${
            isAddendum
              ? "bg-gradient-to-r from-yellow-900/20 to-[#141414] border-yellow-900/30"
              : "bg-gradient-to-r from-green-900/30 to-[#141414] border-green-900/30"
          }`}
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign
              className={`w-6 h-6 ${
                isAddendum ? "text-yellow-400" : "text-green-400"
              }`}
            />
            {depositLabel}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">{depositBlurb}</p>
        </div>

        <div className="p-8 space-y-6">
          {/* PayPal invoice CTA */}
          <div
            className={`bg-[#0d1117] border rounded-xl p-6 ${
              isAddendum ? "border-yellow-600/40" : "border-green-900/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-5">
              <CreditCard
                className={`w-5 h-5 ${
                  isAddendum ? "text-yellow-400" : "text-green-400"
                }`}
              />
              <h3
                className={`font-semibold ${
                  isAddendum ? "text-yellow-300" : "text-green-300"
                }`}
              >
                Pay via PayPal Invoice
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Amount Due
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
                  {memoText}
                </div>
              </div>

              <a
                href={proposalMeta.paypalInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base transition-all cursor-pointer ${
                  isAddendum
                    ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_40px_rgba(234,179,8,0.35)]"
                    : "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_40px_rgba(34,197,94,0.35)]"
                }`}
              >
                Pay {proposalMeta.investmentAtSigning} Invoice on PayPal
                <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <div className="pt-2 border-t border-[#262626]">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Or send manually to
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-zinc-300 font-mono text-sm break-all">
                    {proposalMeta.paypalHandle}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(proposalMeta.paypalHandle, "paypal")
                    }
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isAddendum
                        ? "bg-yellow-900/30 border-yellow-800/40 hover:bg-yellow-800/40 text-yellow-300"
                        : "bg-green-900/30 border-green-800/40 hover:bg-green-800/40 text-green-400"
                    }`}
                    title="Copy PayPal address"
                  >
                    {copiedTarget === "paypal" ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copiedTarget === "paypal" && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs mt-2 ${
                      isAddendum ? "text-yellow-300" : "text-green-400"
                    }`}
                  >
                    Copied to clipboard
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Zelle card */}
          <div
            className={`bg-[#0d1117] border rounded-xl p-6 ${
              isAddendum ? "border-yellow-600/40" : "border-green-900/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-5">
              <Smartphone
                className={`w-5 h-5 ${
                  isAddendum ? "text-yellow-400" : "text-green-400"
                }`}
              />
              <h3
                className={`font-semibold ${
                  isAddendum ? "text-yellow-300" : "text-green-300"
                }`}
              >
                Pay via Zelle
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Amount Due
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
                  Send to
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-green-400 font-mono text-lg break-all">
                    {proposalMeta.zelleEmail}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(proposalMeta.zelleEmail, "zelle")
                    }
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      isAddendum
                        ? "bg-yellow-900/30 border-yellow-800/40 hover:bg-yellow-800/40 text-yellow-300"
                        : "bg-green-900/30 border-green-800/40 hover:bg-green-800/40 text-green-400"
                    }`}
                    title="Copy Zelle email"
                  >
                    {copiedTarget === "zelle" ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copiedTarget === "zelle" && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-xs mt-2 ${
                      isAddendum ? "text-yellow-300" : "text-green-400"
                    }`}
                  >
                    Copied to clipboard
                  </motion.p>
                )}
              </div>

              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Memo / Note
                </div>
                <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3 text-zinc-300 text-sm">
                  {memoText}
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 leading-relaxed">
                Zelle is routed through your bank app (Chase, Bank of America,
                Wells Fargo, etc.). Open the app, pick Zelle, send{" "}
                {proposalMeta.investmentAtSigning} to{" "}
                <span className="text-green-400 font-mono">
                  {proposalMeta.zelleEmail}
                </span>{" "}
                with the memo above. Typically clears in seconds.
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                icon: CreditCard,
                title: "Pick a Method",
                desc: "PayPal (green button — one click to Pete's invoice) or Zelle (open your bank app).",
              },
              {
                step: 2,
                icon: DollarSign,
                title: `Send ${proposalMeta.investmentAtSigning}`,
                desc: "Complete the payment with the memo above. Takes under a minute either way.",
              },
              {
                step: 3,
                icon: Check,
                title: "We Start",
                desc: isAddendum
                  ? "Pete confirms receipt today and Milestone 1 kicks off same day."
                  : "Pete confirms receipt and Milestone 1 kicks off immediately.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-5 text-center"
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm mb-3 ${
                    isAddendum
                      ? "bg-yellow-900/40 text-yellow-300"
                      : "bg-green-900/40 text-green-400"
                  }`}
                >
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
