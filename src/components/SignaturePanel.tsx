"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Pen, RotateCcw, Check, Calendar } from "lucide-react";

interface SignatureData {
  clientName: string;
  clientTitle: string;
  clientSignature: string | null;
  clientDate: string;
  agreedToTerms: boolean;
}

interface SignaturePanelProps {
  onSignatureComplete: (data: SignatureData) => void;
}

const STORAGE_KEY = "wea-signature-data";

export default function SignaturePanel({
  onSignatureComplete,
}: SignaturePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [formData, setFormData] = useState<SignatureData>({
    clientName: "",
    clientTitle: "",
    clientSignature: null,
    clientDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    agreedToTerms: false,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SignatureData;
        setFormData(parsed);
        if (parsed.clientSignature) {
          setHasSignature(true);
          // Redraw the signature
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const img = new Image();
              img.onload = () => ctx.drawImage(img, 0, 0);
              img.src = parsed.clientSignature;
            }
          }
        }
      } catch {
        // ignore bad data
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    // Redraw saved signature if exists
    if (formData.clientSignature) {
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        }
      };
      img.src = formData.clientSignature;
    }
  }, [formData.clientSignature]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setHasSignature(true);
    // Save signature
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      setFormData((prev) => ({ ...prev, clientSignature: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
    setFormData((prev) => ({ ...prev, clientSignature: null }));
  };

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
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pete's side — pre-filled */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                DTSP-AI Technologies
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

            {/* Client side — Alanson */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                Whole Earth Advertising
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500">Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientName: e.target.value,
                      }))
                    }
                    placeholder="Alanson"
                    className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Title</label>
                  <input
                    type="text"
                    value={formData.clientTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientTitle: e.target.value,
                      }))
                    }
                    placeholder="Owner / Principal"
                    className="w-full bg-[#0d0d0d] border border-[#262626] focus:border-green-600 rounded-lg px-4 py-2.5 text-white text-sm outline-none transition-colors placeholder-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 flex items-center justify-between">
                    Signature
                    {hasSignature && (
                      <button
                        onClick={clearSignature}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </label>
                  <div className="bg-[#0d0d0d] border border-[#262626] rounded-lg overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-24 signature-canvas"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    {!hasSignature && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
                I, the undersigned, agree to the terms of this proposal
                including the project scope, timeline of 12 weeks across 6
                milestones, and the investment of $3,600 at signing plus $1,800
                per milestone ($14,400 total). I understand that DTSP-AI
                Technologies will begin work upon receipt of the initial deposit
                and that all deliverables remain the property of Whole Earth
                Advertising upon payment.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <button
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
