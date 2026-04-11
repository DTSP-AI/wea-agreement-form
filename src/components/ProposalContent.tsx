"use client";

import { motion } from "framer-motion";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import {
  Zap,
  Shield,
  TrendingUp,
  Layers,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  DollarSign,
  Globe,
  Database,
} from "lucide-react";
import {
  proposalMeta,
  comparisonTable,
  phases,
  seoSteps,
} from "@/lib/proposal-data";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`${className}`}
    >
      {children}
    </motion.section>
  );
}

export default function ProposalContent() {
  return (
    <div className="max-w-4xl mx-auto px-6 pb-12 space-y-16" id="proposal-content">
      {/* Hero */}
      <Section id="hero" className="pt-8">
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-green-900/30 border border-green-800/40 text-green-400 text-xs tracking-wider uppercase">
            Confidential — {proposalMeta.date}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-green-200 to-green-500 bg-clip-text text-transparent">
            Artist Marketplace Platform
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            AI-powered marketplace infrastructure built behind your GoDaddy site
            — consent management, automated ingestion, split payouts, and an SEO
            engine that builds domain authority while the platform scales.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
            {[
              { label: "Prepared For", value: proposalMeta.preparedFor },
              { label: "Project Term", value: proposalMeta.projectTerm },
              { label: "At Signing", value: proposalMeta.investmentAtSigning },
              { label: "Total Value", value: proposalMeta.totalValue },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#141414] border border-[#262626] rounded-xl p-4"
              >
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="text-white font-semibold mt-1 text-sm">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Start Now */}
      <Section id="parallel">
        <div className="bg-gradient-to-br from-[#141414] to-[#1a1a0a] border border-yellow-900/30 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-900/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-yellow-300">
              Start Now. Don&apos;t Wait for GoDaddy.
            </h2>
          </div>
          <p className="text-zinc-300 leading-relaxed mb-6">
            The single most common mistake on a project this size is waiting for
            one piece to finish before starting another. GoDaddy building the
            storefront has zero overlap with what DTSP-AI builds. The database,
            the agent layer, the consent pipeline, the payout engine, the SEO
            infrastructure — none of it touches the storefront until Phase 2.
          </p>

          <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-xl p-5 mb-6">
            <p className="text-yellow-200 text-sm font-medium">
              Every week this sits unsigned is a week the SEO engine is not
              running, a week artists are not onboarding, and a week your
              competitors are not standing still. The intelligence layer is ready
              to build now. The only variable is when we start.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "GoDaddy Builds",
                desc: "Public storefront design, product page templates, domain configuration, SSL, WooCommerce installation. Their timeline, their team.",
                icon: Globe,
                color: "blue",
              },
              {
                title: "DTSP-AI Builds (simultaneously)",
                desc: "Database schema, Stripe Connect payout engine, artist consent pipeline, ingestion agents, SEO article generator, CRM integration, admin console.",
                icon: Database,
                color: "green",
              },
              {
                title: "Week 4 Convergence",
                desc: "DTSP-AI connects to WooCommerce via REST API. Whatever state GoDaddy's store is in — even a staging environment — is enough.",
                icon: ArrowRight,
                color: "yellow",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#0d0d0d] border border-[#262626] rounded-xl p-5"
              >
                <item.icon
                  className={`w-5 h-5 mb-3 ${
                    item.color === "blue"
                      ? "text-blue-400"
                      : item.color === "green"
                        ? "text-green-400"
                        : "text-yellow-400"
                  }`}
                />
                <h3 className="font-semibold text-white text-sm mb-2">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Comparison Table */}
      <Section id="comparison">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">
              What GoDaddy Can Do. What We Do.
            </h2>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            GoDaddy is genuinely good at building websites. For a business that
            needs a clean storefront — it is hard to beat at $27 a month. That
            is not what Whole Earth Advertising is building. WEA is building a
            <span className="text-green-400 font-medium"> marketplace</span> —
            a system where artists consent, listings flow in automatically, AI
            enriches every product, buyers purchase, and 80% of every sale
            routes to the artist without a human touching a spreadsheet.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                    Capability
                  </th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-zinc-500 font-medium">
                    GoDaddy
                  </th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-green-600 font-medium">
                    DTSP-AI Layer
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, i) => (
                  <tr
                    key={row.capability}
                    className={`border-b border-[#1a1a1a] ${i % 2 === 0 ? "bg-[#111]" : ""}`}
                  >
                    <td className="py-3 px-4 text-sm text-white font-medium">
                      {row.capability}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`flex items-center gap-2 ${
                          row.godaddy.startsWith("No") || row.godaddy.startsWith("Locked") || row.godaddy.startsWith("Manual")
                            ? "text-red-400"
                            : row.godaddy.startsWith("Basic") || row.godaddy.startsWith("Syncs") || row.godaddy.startsWith("Template")
                              ? "text-yellow-400"
                              : "text-zinc-300"
                        }`}
                      >
                        {row.godaddy.startsWith("No") || row.godaddy.startsWith("Locked") ? (
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : null}
                        {row.godaddy}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {row.dtsp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5">
            <p className="text-zinc-300 text-sm leading-relaxed">
              <span className="text-green-400 font-medium">
                Frontend flexibility
              </span>{" "}
              is the row that matters most. DTSP-AI&apos;s intelligence layer is
              frontend agnostic. It connects to GoDaddy WooCommerce today via
              REST API. If WEA outgrows GoDaddy, migrates to Shopify, or wants a
              fully custom storefront — the agents, the payout engine, the
              consent pipeline, the CRM sync — nothing changes. The frontend is
              a plug. We build the engine.
            </p>
          </div>
        </div>
      </Section>

      {/* SEO Engine */}
      <Section id="seo">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold">
              The SEO Engine — Domain Authority at Scale
            </h2>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Most new marketplaces spend 18 months waiting for organic traffic.
            WEA does not have to play that game. DTSP-AI deploys an automated
            SEO article generator as part of the platform build. Domain
            authority is built before a single artist goes live.
          </p>

          <div className="space-y-3">
            {seoSteps.map((step) => (
              <div
                key={step.step}
                className="flex gap-4 bg-[#141414] border border-[#262626] rounded-xl p-5"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 font-bold text-sm">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {step.title}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-5">
            <p className="text-purple-200 text-sm font-medium">
              This is not a nice-to-have. Domain authority is the difference
              between a marketplace that gets found and one that doesn&apos;t. GoDaddy
              cannot automate this. A marketing agency charges $3,000-$8,000 a
              month to do it manually. DTSP-AI builds the engine into the
              platform and hands you the keys.
            </p>
          </div>
        </div>
      </Section>

      {/* Architecture */}
      <Section id="architecture">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold">Architecture</h2>
          </div>
          <p className="text-zinc-400 text-sm">
            GoDaddy sits at the top as the public face. Everything below the API
            bridge is DTSP-AI&apos;s owned infrastructure. The SEO Engine runs
            independently from day one — it doesn&apos;t wait for the storefront.
          </p>
          <ArchitectureDiagram />
        </div>
      </Section>

      {/* Phases */}
      <Section id="investment">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">
              Investment & Milestones
            </h2>
          </div>

          <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-green-300 font-bold text-xl">
                  {proposalMeta.investmentAtSigning}
                </div>
                <div className="text-green-500 text-sm">At signing</div>
              </div>
              <div className="text-zinc-600 text-2xl">+</div>
              <div>
                <div className="text-green-300 font-bold text-xl">
                  {proposalMeta.perMilestone}
                </div>
                <div className="text-green-500 text-sm">Per milestone (x4)</div>
              </div>
              <div className="text-zinc-600 text-2xl">=</div>
              <div>
                <div className="text-white font-bold text-2xl">
                  {proposalMeta.totalValue}
                </div>
                <div className="text-green-500 text-sm">Total project value</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {phases.map((phase) => (
              <div
                key={phase.number}
                className="bg-[#141414] border border-[#262626] rounded-xl p-6 hover:border-green-800/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-900/40 flex items-center justify-center text-green-400 font-bold text-sm">
                      {phase.number}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {phase.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {phase.weeks}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 font-semibold text-sm">
                    {phase.milestone}
                  </div>
                </div>
                <ul className="space-y-2">
                  {phase.deliverables.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2 text-sm text-zinc-400"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
