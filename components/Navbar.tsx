"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar({ onJoin }: { onJoin: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 bg-white/80 backdrop-blur-md border-b border-black/5">
      <Image
        src="/spal-wordmark.png"
        alt="SPAL"
        width={107}
        height={38}
        priority
        className="h-8 w-auto"
      />

      {/* Desktop CTA */}
      <button
        onClick={onJoin}
        className="hidden md:inline-flex items-center gap-2 bg-[#22C55E] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#16a34a] transition-colors duration-200"
      >
        Join the waitlist
      </button>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 rounded-lg hover:bg-[#F8F7F4] transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-black/5 px-6 py-4 md:hidden">
          <button
            onClick={() => { onJoin(); setOpen(false); }}
            className="w-full bg-[#22C55E] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[#16a34a] transition-colors"
          >
            Join the waitlist
          </button>
        </div>
      )}
    </nav>
  );
}
