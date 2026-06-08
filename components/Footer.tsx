import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#131313] text-white px-6 md:px-10 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="max-w-xs">
            <Image
              src="/spal-wordmark.png"
              alt="SPAL"
              width={80}
              height={28}
              className="h-7 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-[#7B7B7B] text-sm leading-relaxed">
              Your AI business companion. Built for entrepreneurs across Africa.
            </p>
            <p className="text-[#22C55E] text-xs font-medium mt-3 tracking-wide">
              Spending · Profiting · Analysing · Looping
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7B7B7B] mb-1">Company</p>
            <a href="mailto:hello@spal.ng" className="text-sm text-[#D4D4D8] hover:text-white transition-colors">
              Contact us
            </a>
            <a href="mailto:hello@spal.ng" className="text-sm text-[#D4D4D8] hover:text-white transition-colors">
              hello@spal.ng
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-[#7B7B7B]">© {new Date().getFullYear()} SPAL. All rights reserved.</p>
          <p className="text-xs text-[#7B7B7B]">Made with care for African entrepreneurs</p>
        </div>
      </div>
    </footer>
  );
}
