"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pen, RotateCcw, Check, Calendar } from "lucide-react";
import { planC, type Plan } from "@/lib/proposal-data";

interface SignatureData {
  clientName: string;
  clientTitle: string;
  clientSignature: string | null;
  clientDate: string;
  agreedToTerms: boolean;
}

interface SignaturePanelProps {
  onSignatureComplete: (data: SignatureData) => void;
  plan?: Plan;
}

const STORAGE_KEY = "wea-signature-data";

// Safe localStorage helpers — Safari Private Mode + quota throws.
function safeGetItem(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}
function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    // private mode / quota — silently ignore, signing still works in-memory
  }
}

export default function SignaturePanel({
  onSignatureComplete,
  plan = planC,
}: SignaturePanelProps) {
  const { meta: proposalMeta } = plan;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs for drawing state — refs avoid stale-closure races on iOS
  // where the first pointermove after pointerdown can fire before React
  // has flushed the setIsDrawing(true) state.
  const isDrawingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const [hasSignature, setHasSignature] = useState(false);
  const [formData, setFormData] = useState<SignatureData>({
    clientName: "",
    clientTitle: "",
    clientSignature: null,
    clientDate: "",
    agreedToTerms: false,
  });

  // Initialize date on client only (prevents SSR hydration mismatch)
  useEffect(() => {
    setFormData((prev) => {
      if (prev.clientDate) return prev;
      return {
        ...prev,
        clientDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    });
  }, []);

  // Hydrate name/title from localStorage once on mount — but NEVER the
  // signature or the terms checkbox. The signature field always starts
  // blank so the client signs THIS agreement fresh; a prior signature is
  // never carried over, and consent to terms is re-given each time.
  useEffect(() => {
    const saved = safeGetItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as SignatureData;
      setFormData((prev) => ({
        ...prev,
        clientName: parsed.clientName || prev.clientName,
        clientTitle: parsed.clientTitle || prev.clientTitle,
        clientSignature: null,
        agreedToTerms: false,
      }));
    } catch {
      // bad data — ignore
    }
  }, []);

  // Persist on changes
  useEffect(() => {
    safeSetItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Style helper — applied after every canvas resize because resizing
  // resets the 2D context state.
  const applyStrokeStyle = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Resize / DPR setup. Runs on mount + whenever the canvas's actual
  // pixel size changes (orientation, viewport, motion-driven layout).
  // CRUCIALLY does NOT depend on formData.clientSignature — that
  // dependency caused the canvas to clear mid-draw on every endDraw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return; // not laid out yet

      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);

      // Only mutate if size actually changed — mutating canvas.width/height
      // wipes pixels and resets the context, which we want to avoid.
      if (canvas.width === targetW && canvas.height === targetH) return;

      // Snapshot current pixels before the resize wipes them so the
      // user's signature survives orientation/viewport changes.
      let snapshot: HTMLImageElement | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        const dataUrl = canvas.toDataURL("image/png");
        snapshot = new Image();
        snapshot.src = dataUrl;
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyStrokeStyle(ctx);

      // Restore previously drawn pixels into the new backing store.
      if (snapshot) {
        const img = snapshot;
        const restore = () => {
          // Drawing in CSS-pixel space (transform already applied)
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        if (img.complete) restore();
        else img.onload = restore;
      } else {
        // Fresh canvas — restore from saved signature (e.g. localStorage)
        const saved = formData.clientSignature;
        if (saved) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
          img.src = saved;
        }
      }
    };

    // Initial size + watch layout changes
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("orientationchange", resize);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", resize);
    };
    // intentionally NOT depending on formData.clientSignature — restoring
    // a saved signature from outside (e.g. portal hydration) is a one-shot
    // handled below in a dedicated effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyStrokeStyle]);

  // One-shot restore from persisted signature on first hydration.
  // Runs only when the persisted dataURL actually changes (not when
  // the user is actively drawing).
  const restoredFromStorageRef = useRef(false);
  useEffect(() => {
    if (restoredFromStorageRef.current) return;
    if (!formData.clientSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      restoredFromStorageRef.current = true;
    };
    img.src = formData.clientSignature;
  }, [formData.clientSignature]);

  // Pointer Events — unified handling for mouse, touch, pen, on every
  // modern browser (Safari 13+, Chrome, Firefox, Edge). Attached as
  // native non-passive listeners so we can preventDefault and stop the
  // page from scrolling while the user is signing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCSSPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only the primary pointer — ignore extra fingers on multitouch
      if (!e.isPrimary) return;
      e.preventDefault();

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Capture this pointer so move/up events keep firing on the canvas
      // even when the user drags off-canvas (critical for signing right
      // up to the edge of the box on phones).
      try {
        canvas.setPointerCapture(e.pointerId);
        activePointerIdRef.current = e.pointerId;
      } catch {
        // older browsers — capture not available, falls back to bubbling
      }

      const pos = getCSSPos(e);
      isDrawingRef.current = true;
      hasMovedRef.current = false;
      lastPointRef.current = pos;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      e.preventDefault();

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getCSSPos(e);
      const last = lastPointRef.current;
      if (last) {
        const dx = pos.x - last.x;
        const dy = pos.y - last.y;
        if (dx * dx + dy * dy < 0.25) return; // sub-pixel jitter — skip
      }
      hasMovedRef.current = true;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPointRef.current = pos;
    };

    const finishStroke = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      activePointerIdRef.current = null;

      // Only commit a signature if the user actually moved the pointer.
      // A pure tap = no signature (prevents accidental "blank" submits).
      if (!hasMovedRef.current) return;

      const dataUrl = canvas.toDataURL("image/png");
      setHasSignature(true);
      setFormData((prev) => ({ ...prev, clientSignature: dataUrl }));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      e.preventDefault();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
      finishStroke();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (
        activePointerIdRef.current !== null &&
        e.pointerId !== activePointerIdRef.current
      ) {
        return;
      }
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
      finishStroke();
    };

    // Block context-menu on long-press (iOS / Android) so the touch
    // doesn't get hijacked into a callout while signing.
    const onContextMenu = (e: Event) => e.preventDefault();

    // {passive: false} is required to allow preventDefault on touch.
    const opts: AddEventListenerOptions = { passive: false };
    canvas.addEventListener("pointerdown", onPointerDown, opts);
    canvas.addEventListener("pointermove", onPointerMove, opts);
    canvas.addEventListener("pointerup", onPointerUp, opts);
    canvas.addEventListener("pointercancel", onPointerCancel, opts);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    // Clear in CSS-pixel space (the context is already DPR-scaled)
    ctx.clearRect(0, 0, rect.width, rect.height);
    restoredFromStorageRef.current = false;
    setHasSignature(false);
    setFormData((prev) => ({ ...prev, clientSignature: null }));
  }, []);

  const isComplete =
    formData.clientName.trim() !== "" &&
    hasSignature &&
    formData.agreedToTerms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      id="signature-section"
      className="max-w-4xl mx-auto px-6 pb-8"
    >
      <div className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900/20 to-[#141414] px-8 py-6 border-b border-[#262626]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Pen className="w-6 h-6 text-green-400" />
            Agreement & Signatures
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            Both parties sign below to authorize the commencement of the Artist
            Marketplace Platform project.
          </p>
          <div className="mt-4 grid sm:grid-cols-4 gap-2">
            {[
              "Type your full name and title",
              "Draw your signature in the box — finger, mouse, or stylus",
              "Tick the agreement checkbox to accept the terms",
              "Tap Confirm, then Export your signed PDF on the next screen",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-[#0d0d0d] border border-[#262626] rounded-lg px-3 py-2"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-900/50 text-green-300 text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-zinc-400 text-[11px] leading-snug">
                  {step}
                </span>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-[11px] mt-2 leading-relaxed">
            Works on any phone, tablet, or computer — iPhone and Android,
            Safari and Chrome. Your signed PDF downloads straight to your
            device; nothing is emailed or routed back to us.
          </p>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pete's side — pre-filled */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider flex items-center gap-2">
                DTSP-AI Technologies
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold normal-case tracking-normal">
                  <Check className="w-3 h-3" />
                  Pre-Signed
                </span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Name</label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm">
                    Peter W Davidsmeier
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Title</label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm">
                    Founder & Lead Architect
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Signature</label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-4 flex items-center justify-center">
                    <span className="text-green-400 italic text-2xl font-serif">
                      Peter W Davidsmeier
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Date</label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    April 10, 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Client side — Alanson Charles */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                Whole Earth Industries
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500" htmlFor="client-name">
                    Name
                  </label>
                  <input
                    id="client-name"
                    type="text"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientName: e.target.value,
                      }))
                    }
                    autoComplete="name"
                    autoCapitalize="words"
                    placeholder="Alanson Charles"
                    // 16px font-size avoids iOS Safari focus-zoom
                    style={{ fontSize: 16 }}
                    className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white outline-none transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500" htmlFor="client-title">
                    Title
                  </label>
                  <input
                    id="client-title"
                    type="text"
                    value={formData.clientTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientTitle: e.target.value,
                      }))
                    }
                    autoComplete="organization-title"
                    autoCapitalize="words"
                    placeholder="Owner / Principal"
                    style={{ fontSize: 16 }}
                    className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white outline-none transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 flex items-center justify-between">
                    <span>Signature</span>
                    {hasSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-24 signature-canvas block"
                      // Hint to assistive tech / Safari
                      role="img"
                      aria-label="Sign here with your finger, mouse, or stylus"
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-zinc-700 text-sm">
                          Sign here...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Date</label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg px-4 py-2.5 text-white text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    {formData.clientDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mt-8 pt-6 border-t border-[#262626]">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      agreedToTerms: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.agreedToTerms
                      ? "bg-green-600 border-green-600"
                      : "border-zinc-600 group-hover:border-zinc-400"
                  }`}
                >
                  {formData.agreedToTerms && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </div>
              <span className="text-sm text-zinc-300 leading-relaxed">
                I, the undersigned, agree to the terms of{" "}
                <span className="text-green-400 font-semibold">
                  {plan.name} — {plan.tagline}
                </span>
                ,{" "}
                {proposalMeta.paymentSchedule ? (
                  proposalMeta.termsSummary ? (
                    <>{proposalMeta.termsSummary}</>
                  ) : (
                    <>
                      including the project scope, a timeline of 12 weeks across
                      6 milestones (one milestone meeting every 2 weeks), and{" "}
                      {proposalMeta.milestoneCount} biweekly payments of{" "}
                      {proposalMeta.perMilestone} ({proposalMeta.totalValue}{" "}
                      total), with the first payment due today (
                      {proposalMeta.paymentSchedule[0]?.dateLabel}) and remaining
                      payments every two weeks through{" "}
                      {
                        proposalMeta.paymentSchedule[
                          proposalMeta.paymentSchedule.length - 1
                        ]?.dateLabel
                      }
                      .
                    </>
                  )
                ) : (
                  <>
                    including the project scope, a timeline of 12 weeks across
                    6 milestones (one milestone meeting every 2 weeks), and
                    the investment of {proposalMeta.investmentAtSigning} at
                    signing plus {proposalMeta.perMilestone} per milestone for
                    6 milestones ({proposalMeta.totalValue} total).
                  </>
                )}{" "}
                Infrastructure costs (AWS hosting, database, bandwidth) and
                third-party API / LLM token usage (Claude, OpenAI, Stripe,
                GoHighLevel, etc.) are pass-through at cost and billed
                separately from this total. I understand that DTSP-AI
                Technologies will begin work upon receipt of the first
                payment and that all deliverables remain the property of Whole
                Earth Industries upon payment.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => isComplete && onSignatureComplete(formData)}
              disabled={!isComplete}
              className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                isComplete
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              {isComplete ? "Confirm & Proceed to Payment" : "Complete all fields to continue"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
