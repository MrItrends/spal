"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon, Camera } from "lucide-react";

const fontFamily = "var(--font-satoshi)";

const TIPS = [
  { icon: "☀️", text: "Make sure the receipt is well-lit" },
  { icon: "⬛", text: "Keep it flat and fully in frame" },
  { icon: "🔍", text: "Get close enough to read the prices" },
];

export default function PictureSaleUploadPage() {
  const router = useRouter();
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const galleryRef  = useRef<HTMLInputElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);

  const [preview,         setPreview]         = useState<string | null>(null);
  const [cameraReady,     setCameraReady]     = useState(false);
  const [cameraBlocked,   setCameraBlocked]   = useState(false);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraBlocked(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Capture frame from live video
  function captureFrame() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      storeAndPreview(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.88);
  }

  function storeAndPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const b64 = result.split(",")[1];
      sessionStorage.setItem("spal_receipt_b64",       b64);
      sessionStorage.setItem("spal_receipt_file_type", file.type);
      setPreview(result);
      stopCamera(); // freeze — no longer need the stream
    };
    reader.readAsDataURL(file);
  }

  function retake() {
    setPreview(null);
    setCameraReady(false);
    startCamera();
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#0F2820", fontFamily }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          style={{ background: "rgba(255,255,255,0.10)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2} color="#fff" />
        </button>
        <span className="text-[16px] font-semibold text-white">Picture Upload</span>
      </div>

      {/* Viewfinder — fills all available space */}
      <div className="mx-5 rounded-2xl overflow-hidden flex-1 relative" style={{ minHeight: 200 }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Captured receipt" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            {/* Live camera stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: cameraReady ? "block" : "none" }}
            />
            {/* Fallback / loading state */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {cameraBlocked ? (
                  <>
                    <Camera size={32} color="rgba(255,255,255,0.3)" />
                    <p className="text-white/40 text-[13px] text-center px-6">
                      Camera access denied. Use the gallery button below.
                    </p>
                  </>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
              </div>
            )}
            {/* Viewfinder corner guides */}
            {cameraReady && (
              <>
                <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl-md pointer-events-none" />
                <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr-md pointer-events-none" />
                <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl-md pointer-events-none" />
                <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br-md pointer-events-none" />
              </>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Tips */}
      <div className="px-5 pt-4 pb-2 space-y-2 flex-shrink-0">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: "rgba(255,255,255,0.10)" }}>
              {tip.icon}
            </div>
            <p className="text-[12px] text-white/60">{tip.text}</p>
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="px-5 pt-3 pb-8 flex items-center justify-between gap-4 flex-shrink-0">
        {/* Gallery picker */}
        <button
          onClick={() => galleryRef.current?.click()}
          className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.12)" }}
          aria-label="Open gallery"
        >
          <ImageIcon size={22} strokeWidth={2} color="#fff" />
        </button>

        {/* Shutter / Retake */}
        {preview ? (
          <button
            onClick={retake}
            className="flex-1 h-12 rounded-full font-semibold text-[13px] text-white flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.14)", border: "2px solid rgba(255,255,255,0.3)" }}
          >
            Retake
          </button>
        ) : (
          <button
            onClick={captureFrame}
            disabled={!cameraReady && !cameraBlocked}
            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 flex-shrink-0"
            style={{ border: "3px solid #fff" }}
            aria-label="Take photo"
          >
            <div className="w-[62px] h-[62px] rounded-full" style={{ background: "#fff" }} />
          </button>
        )}

        {/* Done */}
        {preview ? (
          <button
            onClick={() => router.push("/records/add-sale/picture/confirm")}
            className="flex-1 h-12 rounded-full font-semibold text-[13px] text-white flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: "#22C55E" }}
          >
            Done ✓
          </button>
        ) : (
          <div className="w-12 h-12 flex-shrink-0" />
        )}

        {/* Hidden gallery input */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) storeAndPreview(f); }}
        />
      </div>
    </div>
  );
}
