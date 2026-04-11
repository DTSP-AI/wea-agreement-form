"use client";

import { motion } from "framer-motion";
import {
  Globe,
  ArrowDown,
  Cpu,
  Database,
  Search,
  CreditCard,
  Users,
  FileText,
  Shield,
  Mail,
  ShoppingCart,
  Zap,
  ArrowRight,
  Link,
} from "lucide-react";

// ============================================================================
// Architecture Diagram — Visual component diagram with data flow
// ============================================================================

// --- Node component ---
function DiagramNode({
  title,
  subtitle,
  items,
  icon: Icon,
  color,
  delay,
  className = "",
  glow = false,
}: {
  title: string;
  subtitle?: string;
  items?: { icon: React.ElementType; label: string }[];
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "amber" | "cyan" | "rose";
  delay: number;
  className?: string;
  glow?: boolean;
}) {
  const colors = {
    blue: {
      bg: "bg-blue-950/40",
      border: "border-blue-800/40",
      iconBg: "bg-blue-900/50",
      iconText: "text-blue-400",
      title: "text-blue-300",
      subtitle: "text-blue-500",
      item: "text-blue-200/70",
      glow: "shadow-blue-500/20",
    },
    green: {
      bg: "bg-green-950/40",
      border: "border-green-800/40",
      iconBg: "bg-green-900/50",
      iconText: "text-green-400",
      title: "text-green-300",
      subtitle: "text-green-500",
      item: "text-green-200/70",
      glow: "shadow-green-500/20",
    },
    purple: {
      bg: "bg-purple-950/40",
      border: "border-purple-800/40",
      iconBg: "bg-purple-900/50",
      iconText: "text-purple-400",
      title: "text-purple-300",
      subtitle: "text-purple-500",
      item: "text-purple-200/70",
      glow: "shadow-purple-500/20",
    },
    amber: {
      bg: "bg-amber-950/40",
      border: "border-amber-800/40",
      iconBg: "bg-amber-900/50",
      iconText: "text-amber-400",
      title: "text-amber-300",
      subtitle: "text-amber-500",
      item: "text-amber-200/70",
      glow: "shadow-amber-500/20",
    },
    cyan: {
      bg: "bg-cyan-950/40",
      border: "border-cyan-800/40",
      iconBg: "bg-cyan-900/50",
      iconText: "text-cyan-400",
      title: "text-cyan-300",
      subtitle: "text-cyan-500",
      item: "text-cyan-200/70",
      glow: "shadow-cyan-500/20",
    },
    rose: {
      bg: "bg-rose-950/40",
      border: "border-rose-800/40",
      iconBg: "bg-rose-900/50",
      iconText: "text-rose-400",
      title: "text-rose-300",
      subtitle: "text-rose-500",
      item: "text-rose-200/70",
      glow: "shadow-rose-500/20",
    },
  };

  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: "easeOut" as const }}
      className={`${c.bg} border ${c.border} rounded-xl p-4 ${glow ? `shadow-lg ${c.glow}` : ""} ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${c.iconText}`} />
        </div>
        <div>
          <div className={`text-sm font-semibold ${c.title}`}>{title}</div>
          {subtitle && (
            <div className={`text-[10px] ${c.subtitle}`}>{subtitle}</div>
          )}
        </div>
      </div>
      {items && (
        <div className="space-y-1 ml-9">
          {items.map((item) => (
            <div key={item.label} className={`flex items-center gap-1.5 text-xs ${c.item}`}>
              <item.icon className="w-3 h-3 flex-shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// --- Connector arrow ---
function Connector({
  label,
  delay,
  direction = "down",
}: {
  label?: string;
  delay: number;
  direction?: "down" | "right";
}) {
  const isDown = direction === "down";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={`flex ${isDown ? "flex-col items-center py-1" : "flex-row items-center px-2"}`}
    >
      <motion.div
        initial={{ scaleY: isDown ? 0 : 1, scaleX: isDown ? 1 : 0 }}
        whileInView={{ scaleY: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.1, duration: 0.4, ease: "easeOut" as const }}
        className={`${isDown ? "w-px h-6" : "h-px w-6"} bg-gradient-to-b from-zinc-600 to-zinc-700 origin-top`}
      />
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
          className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase px-2"
        >
          {label}
        </motion.span>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: delay + 0.3, duration: 0.3 }}
      >
        {isDown ? (
          <ArrowDown className="w-3 h-3 text-zinc-600" />
        ) : (
          <ArrowRight className="w-3 h-3 text-zinc-600" />
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Data flow pulse dot ---
function PulseFlow({ delay, color }: { delay: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex justify-center py-0.5"
    >
      <motion.div
        animate={{
          y: [0, 8, 16],
          opacity: [0.8, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut" as const,
        }}
        className={`w-1.5 h-1.5 rounded-full ${color}`}
      />
    </motion.div>
  );
}

// --- Section label ---
function SectionLabel({
  label,
  side,
  delay,
}: {
  label: string;
  side: "left" | "right";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -10 : 10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className={`absolute ${side === "left" ? "-left-2 md:-left-16" : "-right-2 md:-right-16"} top-1/2 -translate-y-1/2 hidden md:block`}
    >
      <div className="text-[9px] font-mono tracking-widest uppercase text-zinc-600 whitespace-nowrap"
        style={{ writingMode: "vertical-rl", transform: side === "left" ? "rotate(180deg)" : undefined }}
      >
        {label}
      </div>
    </motion.div>
  );
}

export default function ArchitectureDiagram() {
  return (
    <div className="relative max-w-2xl mx-auto">
      {/* ---- LAYER 1: Public Storefront ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest text-center mb-2">
          Public Layer
        </div>
        <DiagramNode
          title="GoDaddy Storefront"
          subtitle="WooCommerce · Public Face · $27/mo"
          icon={Globe}
          color="blue"
          delay={0.1}
          items={[
            { icon: ShoppingCart, label: "Product pages & checkout" },
            { icon: Shield, label: "SSL & domain config" },
            { icon: FileText, label: "Blog & SEO articles" },
          ]}
          glow
        />
      </motion.div>

      {/* Connector: GoDaddy → API Bridge */}
      <Connector label="REST API" delay={0.3} />
      <PulseFlow delay={0.5} color="bg-blue-400" />

      {/* ---- API BRIDGE ---- */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mx-auto w-full max-w-md"
      >
        <div className="border border-dashed border-zinc-700 rounded-lg px-4 py-2 flex items-center justify-center gap-2 bg-zinc-900/50">
          <Link className="w-3 h-3 text-zinc-500" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            WooCommerce API Bridge
          </span>
          <Link className="w-3 h-3 text-zinc-500" />
        </div>
      </motion.div>

      <PulseFlow delay={0.6} color="bg-green-400" />
      <Connector delay={0.5} />

      {/* ---- LAYER 2: DTSP-AI Platform Container ---- */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="relative border border-green-900/30 rounded-2xl bg-green-950/10 p-4 md:p-6"
      >
        <SectionLabel label="DTSP-AI Owned Infrastructure" side="left" delay={0.8} />
        <SectionLabel label="Your Servers · Your Data" side="right" delay={0.8} />

        {/* Platform header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-800/30">
            <Zap className="w-3 h-3 text-green-400" />
            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-widest">
              DTSP-AI Intelligence Layer
            </span>
          </div>
        </motion.div>

        {/* AI Agent Layer */}
        <DiagramNode
          title="AI Agent Layer"
          subtitle="Intelligent Processing"
          icon={Cpu}
          color="green"
          delay={0.7}
          items={[
            { icon: FileText, label: "Listing enhancement & enrichment" },
            { icon: Users, label: "Artist consent pipeline" },
            { icon: ShoppingCart, label: "Etsy / Shopify ingestion agents" },
            { icon: Zap, label: "CRM Supervisor agent" },
          ]}
          glow
        />

        <Connector delay={0.9} />
        <PulseFlow delay={1.0} color="bg-green-400" />

        {/* Data Layer — 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DiagramNode
            title="PostgreSQL"
            subtitle="Source of Truth"
            icon={Database}
            color="cyan"
            delay={1.0}
            items={[
              { icon: Users, label: "Artist profiles" },
              { icon: FileText, label: "Consent records" },
              { icon: ShoppingCart, label: "Order tracking" },
            ]}
          />
          <DiagramNode
            title="Stripe Connect"
            subtitle="Automatic Payouts"
            icon={CreditCard}
            color="amber"
            delay={1.1}
            items={[
              { icon: Users, label: "80% → Artist" },
              { icon: ShoppingCart, label: "20% → WEA" },
              { icon: Shield, label: "Instant at sale" },
            ]}
          />
          <DiagramNode
            title="GoHighLevel"
            subtitle="CRM Integration"
            icon={Users}
            color="rose"
            delay={1.2}
            items={[
              { icon: Mail, label: "Artist comms" },
              { icon: Users, label: "Lead tracking" },
              { icon: Zap, label: "Automations" },
            ]}
          />
        </div>

        <Connector delay={1.3} />
        <PulseFlow delay={1.4} color="bg-purple-400" />

        {/* SEO Engine — runs independently */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.3, duration: 0.3 }}
          className="relative"
        >
          {/* Independent badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="absolute -top-2.5 right-3 z-10"
          >
            <span className="text-[8px] font-mono uppercase tracking-widest bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/40">
              Runs Day 1
            </span>
          </motion.div>

          <DiagramNode
            title="SEO Engine"
            subtitle="Domain Authority at Scale"
            icon={Search}
            color="purple"
            delay={1.4}
            items={[
              { icon: FileText, label: "Automated article generator" },
              { icon: Mail, label: "DKIM / SPF / DMARC auth" },
              { icon: Search, label: "Keyword permutation engine" },
              { icon: Globe, label: "Internal linking & authority" },
            ]}
            glow
          />
        </motion.div>
      </motion.div>

      {/* ---- Ownership callout ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.6, duration: 0.4 }}
        className="mt-6 text-center"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-[#141414] border border-[#262626]">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-xs text-zinc-400">
            Everything below the API bridge is{" "}
            <span className="text-green-400 font-semibold">yours</span>.
            Your servers. Your data. Zero vendor lock-in.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
