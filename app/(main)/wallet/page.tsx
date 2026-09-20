"use client";

import { Wallet01Icon } from "hugeicons-react";

const FF = "var(--font-satoshi)";

// Placeholder — the full Wallet screen is built in a later pass.
export default function WalletPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 text-center" style={{ background: "#EDF3E8", fontFamily: FF }}>
      <span className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EAF0FC" }}>
        <Wallet01Icon size={30} color="#2563EB" />
      </span>
      <h1 className="text-[20px] font-black text-spal-navy" style={{ fontFamily: FF }}>Wallet</h1>
      <p className="text-[14px] text-neutral-500 mt-2 max-w-[260px]" style={{ fontFamily: FF }}>
        Your SPAL account, payments and POS connections will live here soon.
      </p>
    </div>
  );
}
