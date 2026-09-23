"use client";

import { useState } from "react";
import { useSPALStore } from "@spal/core/store";

const FF = "var(--font-satoshi)";

export default function LoginPage() {
  const { setUser } = useSPALStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 6;

  async function handleLogin() {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Incorrect email or password. Please try again.");
        return;
      }
      setUser(data.data.user);
      window.location.href = "/home";
    } catch {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6" style={{ background: "#EEF3E9" }}>
      <div className="w-full max-w-[380px]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#0F172A" }}>
            <span className="text-[15px] font-black" style={{ color: "#22C55E", fontFamily: FF }}>S</span>
          </div>
          <span className="text-[20px] font-black text-spal-navy" style={{ fontFamily: FF }}>SPAL Desktop</span>
        </div>

        <h1 className="text-[26px] font-black text-spal-navy" style={{ fontFamily: FF }}>Welcome back</h1>
        <p className="mt-2 text-[14px] text-neutral-500">Sign in with your email and password</p>

        <div className="mt-8 flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-bold text-spal-navy block mb-1.5" style={{ fontFamily: FF }}>Email address</label>
            <input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full h-12 px-4 rounded-xl bg-white outline-none text-[14px] text-spal-navy placeholder:text-neutral-400"
              style={{ fontFamily: FF, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            />
          </div>
          <div>
            <label className="text-[13px] font-bold text-spal-navy block mb-1.5" style={{ fontFamily: FF }}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full h-12 px-4 rounded-xl bg-white outline-none text-[14px] text-spal-navy placeholder:text-neutral-400"
              style={{ fontFamily: FF, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            />
          </div>

          {error && <p className="text-[13px] text-red-500 font-semibold -mt-1">{error}</p>}
        </div>

        <button
          onClick={handleLogin}
          disabled={!isValid || loading}
          className="w-full h-12 rounded-xl text-white font-black text-[15px] mt-8 hover:opacity-90 transition-opacity disabled:opacity-40"
          style={{ background: "#22C55E", fontFamily: FF }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
