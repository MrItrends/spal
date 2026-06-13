"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";

const fontFamily = "var(--font-satoshi)";

const TIPS = [
  { icon: "☀️", text: "Make sure the receipt is well-lit" },
  { icon: "#", text: "Keep it flat and fully in frame" },
  { icon: "🔍", text: "Get close enough to read the prices" },
];

export default function PictureExpenseUploadPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = (e.target?.result as string).split(",")[1];
      sessionStorage.setItem("spal_expense_receipt_b64", b64);
      sessionStorage.setItem("spal_expense_receipt_file_type", file.type);
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-full flex flex-col" style={{ background: "#0F2820", fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.10)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2} color="#fff" />
        </button>
        <span className="text-[16px] font-semibold text-white" style={{ fontFamily }}>Picture Upload</span>
      </div>

      {/* Viewfinder */}
      <div className="mx-5 rounded-2xl overflow-hidden flex-shrink-0" style={{ background: "#000", maxHeight: "52vh", minHeight: 240 }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Receipt preview" className="w-full h-full object-cover" style={{ maxHeight: "52vh" }} />
        ) : (
          <div className="w-full flex items-center justify-center" style={{ minHeight: 240, background: "#111" }}>
            <p className="text-white/30 text-[13px]" style={{ fontFamily }}>No image selected</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-5 px-5 space-y-2.5">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
              style={{ background: "rgba(255,255,255,0.10)" }}
            >
              {tip.icon}
            </div>
            <p className="text-[12.5px] text-white/70" style={{ fontFamily }}>{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-auto px-5 pb-10 pt-6 flex items-center justify-between gap-4">
        {/* Gallery */}
        <button
          onClick={() => galleryRef.current?.click()}
          className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.12)" }}
          aria-label="Open gallery"
        >
          <ImageIcon size={22} strokeWidth={2} color="#fff" />
        </button>

        {/* Shutter */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ border: "3px solid #fff" }}
          aria-label="Take photo"
        >
          <div className="w-[62px] h-[62px] rounded-full" style={{ background: "#fff" }} />
        </button>

        {/* Done */}
        {preview ? (
          <button
            onClick={() => router.push("/records/add-expense/picture/confirm")}
            className="h-12 px-5 rounded-full font-semibold text-[13px] text-white flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "#F97316", fontFamily }}
          >
            Done
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}

        {/* Hidden inputs */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
