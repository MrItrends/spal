"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Scroll-reveal hook ──────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Reveal wrapper — fades + slides up when scrolled into view ──────────────────
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Scroll to hero email input ──────────────────────────────────────────────────
function scrollToHeroEmail() {
  const input = document.getElementById("hero-email-input") as HTMLInputElement | null;
  if (!input) return;
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => input.focus(), 650);
}

// ─── Figma assets (downloaded to /public/figma/) ────────────────────────────────
const STAT_LEFT_BG    = "/figma/stat-left-bg.jpg";
const BLUE_CARD_PHOTO = "/figma/blue-card-photo.png";
const FEATURE_BG      = "/figma/feature-bg.png";
// Feature section — backgrounds and component images (dropped in /public/)
const FB_SALES_BG      = "/Track Sales Background.png";
const FB_SALES_COMP    = "/Track sales component.png";
const FB_EXPENSE_BG    = "/Track Expense Background.png";
const FB_EXPENSE_COMP  = "/Track Expense Component.png";
const FB_INSIGHTS_BG   = "/Insights Background.png";
const FB_INSIGHTS_COMP = "/Insights Component.png";
const FB_ASKSPAL_BG    = "/Ask Spal Background.png";
const FB_ASKSPAL_COMP  = "/Ask Spal Component.png";
const FB_COACH_BG      = "/Business Coach Background.png";
const FB_COACH_COMP    = "/Business Coach Component.png";
const FB_GOALS_BG      = "/Goals Background.png";
const FB_GOALS_COMP    = "/Goals Component.png";
const PHONE_SCREEN    = "/figma/phone-screen.png";
const HUSTLER_PHOTO   = "/figma/hustler-photo.png";
const HUSTLER_RIGHT   = "/figma/hustler-right.png";
const OPERATOR_PHOTO  = "/figma/operator-photo.png";
const OPERATOR_RIGHT  = "/figma/operator-right.png";
const BUILDER_PHOTO   = "/The ambitious builder icon.png";
const BUILDER_RIGHT   = "/The ambitious builder image.png";
const OWNER_PHOTO     = "/the business owner icon.png";
const OWNER_RIGHT     = "/the business owner image.png";
const AVATAR1         = "/figma/avatar1.png";
const AVATAR2         = "/figma/avatar2.png";
const AVATAR3         = "/figma/avatar3.png";
const AVATAR4         = "/figma/avatar4.png";

// ─── Arrow icon (diagonal ↗ matching Figma) ──────────────────────────────────────
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4.5 11.5L11.5 4.5M11.5 4.5H5.5M11.5 4.5V10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Waitlist pill form ──────────────────────────────────────────────────────────
// scrollOnly=true → button scrolls to hero email input instead of submitting
function PillForm({ dark = false, scrollOnly = false }: { dark?: boolean; scrollOnly?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (scrollOnly) { scrollToHeroEmail(); return; }
    if (!email.trim()) return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 rounded-[32px] px-6 py-4 bg-[#22c55e]/20 border border-[#22c55e]/40 w-full max-w-[400px]">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 9l4 4 6-8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-['Satoshi'] text-[14px] text-[#22c55e]">You&apos;re on the list!</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-[400px] h-[56px]">
      <div className={`absolute inset-0 rounded-[32px] ${dark ? "bg-[#272627]" : "bg-white"}`} />
      <input
        id={!dark && !scrollOnly ? "hero-email-input" : undefined}
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required={!scrollOnly}
        className={`absolute left-6 top-1/2 -translate-y-1/2 w-[calc(100%-176px)] bg-transparent outline-none font-['Satoshi'] text-[16px] placeholder:text-[#7b7b7b] ${dark ? "text-white" : "text-[#0f172a]"}`}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="absolute right-[4px] bottom-[4px] top-[4px] w-[156px] bg-[#22c55e] rounded-[48px] flex items-center pl-4 pr-1 gap-2 hover:bg-[#16a34a] transition-colors disabled:opacity-70"
      >
        <span className="flex-1 font-['Satoshi'] font-bold text-[14px] text-white tracking-[1.68px]">
          {state === "loading" ? "..." : "Join List"}
        </span>
        <span className="w-[40px] h-[40px] rounded-full bg-[#297373] flex items-center justify-center shrink-0">
          <ArrowIcon />
        </span>
      </button>
      {state === "error" && (
        <p className="absolute -bottom-6 left-1 text-red-400 text-xs">Something went wrong. Try again.</p>
      )}
    </form>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────────
function Navbar({ onJoin }: { onJoin: () => void; }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#f1f1f1] h-[98px] flex items-center px-6 lg:px-[52px]">
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        <div className="h-[37px] w-auto flex items-center">
          <img
            src="/spal-wordmark.png"
            alt="SPAL"
            className="h-full w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = "/spal-wordmark.svg"; }}
          />
        </div>

        <button
          onClick={onJoin}
          className="hidden md:flex items-center bg-[#22c55e] text-white font-['Satoshi'] font-bold text-[16px] rounded-[1000px] px-12 h-[55px] hover:bg-[#16a34a] transition-colors"
        >
          Join Waiting List
        </button>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#0F172A" strokeWidth="2" strokeLinecap="round"/></svg>
          }
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#f1f1f1] p-6 md:hidden">
          <button
            onClick={() => { onJoin(); setOpen(false); }}
            className="w-full bg-[#22c55e] text-white font-['Satoshi'] font-bold text-[16px] rounded-[1000px] h-[55px] hover:bg-[#16a34a] transition-colors"
          >
            Join Waiting List
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────────
// Matches Figma node 144:22866 exactly (1392×852 canvas)
function Hero() {
  return (
    <section className="px-3 sm:px-6 lg:px-[52px] py-6 lg:py-8 max-w-[1440px] mx-auto">
      {/* Card — fixed height so phone bleeds out at bottom via overflow:hidden */}
      <div
        className="relative bg-[#f8f7f4] rounded-[24px] overflow-hidden w-full"
        style={{ height: "clamp(600px, 60vw, 852px)" }}
      >
        {/* ── Teal radial glow — top ──
            Figma: rect x=-174 y=-603 width=1740 height=1009 rx=504.5 blur=50
            Percentages of 1392×852: left=-12.5% right=-12.5% top=-70.8% height=118.4% */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-70.8%",
            left: "-12.5%",
            right: "-12.5%",
            height: "118.4%",
            background: "#123332",
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
        />
        {/* ── Blue radial glow — bottom ──
            Figma: rect x=-141 y=609 width=1670 height=694 rx=347 blur=50
            Percentages: left=-10% right=-10% bottom=-52.9% height=81.5% */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-52.9%",
            left: "-10%",
            right: "-10%",
            height: "81.5%",
            background: "#2f63f5",
            filter: "blur(50px)",
            borderRadius: "50%",
          }}
        />

        {/* ── Text + form + image all in normal flow so gaps are consistent ── */}
        <div className="relative z-10 flex flex-col items-center text-center pt-[48px] px-4">
          {/* Tag pill */}
          <div
            className="inline-flex items-center gap-2 border border-white/25 rounded-[28px] px-4 py-1.5 mb-6"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <span className="font-['Satoshi'] text-[11px] lg:text-[12px] text-white tracking-[1.44px] uppercase">
              <span className="rocket-anim">🚀</span>{" "}ON THE WAY TO YOUR PHONE
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-['Satoshi'] font-medium text-white leading-[1.15] tracking-[-0.06em] max-w-[700px] mb-4"
            style={{ fontSize: "clamp(28px, 5vw, 68px)" }}
          >
            The business companion<br className="hidden sm:block" /> for everyday entrepreneurs
          </h1>

          {/* Subtext — mb-8 = 32px gap before form */}
          <p className="font-['Satoshi'] text-[14px] lg:text-[16px] text-white/85 max-w-[360px] mb-8 leading-[1.6]">
            Track money, uncover insights, and grow your<br className="hidden sm:block" /> business with confidence
          </p>

          {/* Waitlist pill form */}
          <PillForm />

          {/* Phone + data cards — mt-8 = same 32px gap after form, bleeds below card via overflow:hidden */}
          <div className="mt-8 w-full">
            <img
              src="/phonemockupanddata.png"
              alt="SPAL app with data"
              className="w-full block"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

// ─── "Every Sale Counts" ──────────────────────────────────────────────────────────
function HeadlineSection() {
  return (
    <section className="py-20 px-4 text-center">
      <Reveal><p className="font-['Satoshi'] font-medium text-[14px] text-[#0f172a] tracking-[1.68px] uppercase mb-8">SPAL</p></Reveal>

      <Reveal delay={100}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-2">
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Every</span>
        <span className="w-[48px] h-[48px] rounded-full bg-[#8b5cf6] inline-flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 7v11h14V7L10 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Sale</span>
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Counts</span>
      </div></Reveal>

      <Reveal delay={200}><div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Every</span>
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Expense</span>
        <span className="w-[48px] h-[48px] rounded-full bg-[#22c55e] inline-flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 10h16M10 2v16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>Matters</span>
      </div></Reveal>
    </section>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────────
function StatCards() {
  return (
    <section className="px-4 lg:px-[52px] pb-20 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Left: photo bg */}
        <Reveal delay={0}><div className="relative rounded-[24px] overflow-hidden h-[324px]">
          <img src={STAT_LEFT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
            <img src="/spal-wordmark.png" alt="SPAL" className="h-6 brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).src = "/spal-wordmark.svg"; }} />
            <div className="w-10 h-10 bg-[#fe5900] rounded-[12px] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="13" rx="2" stroke="white" strokeWidth="1.5"/>
                <path d="M2 8h16" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 bg-white rounded-[12px] p-4">
            <p className="font-['Satoshi'] font-medium text-[52px] text-[#0f172a] leading-none tracking-[-3.6px]">39.6M+</p>
            <p className="font-['Satoshi'] font-medium text-[14px] text-[#0f172a] mt-2 leading-[20px]">
              MSMEs operating across Nigeria. Nigeria&apos;s MSME sector accounts for nearly all businesses in the country.
            </p>
          </div>
        </div></Reveal>

        {/* Center: blue */}
        <Reveal delay={120}><div className="relative bg-[#2e61fe] rounded-[24px] overflow-hidden h-[324px]">
          <div className="absolute top-5 left-5">
            <p className="font-['Satoshi'] font-medium text-[42px] text-white tracking-[-2.4px] leading-[1.15]">96.9%</p>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="font-['Satoshi'] font-medium text-[16px] text-white leading-[24px]">
              Of Nigerian businesses are MSMEs. Small businesses are the backbone of the economy.
            </p>
          </div>
          <img src={BLUE_CARD_PHOTO} alt="" className="absolute top-0 right-0 h-[200px] w-[60%] object-cover" />
        </div></Reveal>

        {/* Right: cream */}
        <Reveal delay={240}><div className="bg-[#f7f6f3] rounded-[24px] p-5 h-[324px] flex flex-col">
          <div>
            <p className="font-['Satoshi'] font-medium text-[14px] text-[#0f172a] leading-[20px]">Commitment to measurable</p>
            <p className="font-['Satoshi'] font-medium text-[40px] text-[#0f172a] tracking-[-2.4px] leading-[48px] mt-1">46.3%</p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center mb-4">
              {[AVATAR1,AVATAR2,AVATAR3,AVATAR4].map((av,i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden ${i !== 0 ? "-ml-2" : ""}`}>
                  <img src={av} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="font-['Satoshi'] font-medium text-[16px] text-[#0f172a] leading-[24px] tracking-[-0.32px]">
              Contribution of MSMEs to Nigeria&apos;s GDP. Small businesses drive nearly half of economic output.
            </p>
          </div>
        </div></Reveal>

      </div>
    </section>
  );
}

// ─── Features sticky scroll section ──────────────────────────────────────────────
function FIcon({ id, color }: { id: string; color: string }) {
  if (id === "sales")    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10.5L10 3.5L17 10.5V17.5H13V13.5H7V17.5H3V10.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
  if (id === "expenses") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5"/><path d="M2 9h16" stroke={color} strokeWidth="1.5"/><circle cx="6" cy="13" r="1" fill={color}/></svg>;
  if (id === "insights") return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 3 4-5 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (id === "askspal")  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4h12a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
  if (id === "coach")    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke={color} strokeWidth="1.5"/><path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke={color} strokeWidth="1.5"/><circle cx="10" cy="10" r="1" fill={color}/></svg>;
}

const FEATURES_DATA = [
  { id: "sales",    label: "Track Sales",     iconBg: "#effbf4", iconColor: "#22c55e", title: "Track Sales",     desc: "Record sales in seconds and see exactly how much money your business brings in every day",                        bg: FB_SALES_BG,    comp: FB_SALES_COMP,    compW: 390 },
  { id: "expenses", label: "Track Expenses",  iconBg: "#fff5ef", iconColor: "#f35902", title: "Track Expenses",  desc: "Keep track of spending and understand where your money goes before it affects profit",                         bg: FB_EXPENSE_BG,  comp: FB_EXPENSE_COMP,  compW: 390 },
  { id: "insights", label: "Insights",        iconBg: "#eafbfa", iconColor: "#0d9488", title: "Insights",        desc: "Turn daily records into simple reports that reveal trends, opportunities, and risks",                          bg: FB_INSIGHTS_BG, comp: FB_INSIGHTS_COMP, compW: 342 },
  { id: "askspal",  label: "Ask SPAL",        iconBg: "#f7f3fe", iconColor: "#8b5cf6", title: "Ask SPAL",        desc: "Chat with your AI business companion to get answers, advice, and guidance anytime",                           bg: FB_ASKSPAL_BG,  comp: FB_ASKSPAL_COMP,  compW: 342 },
  { id: "coach",    label: "Business Coach",  iconBg: "#f8f8f9", iconColor: "#67748f", title: "Business Coach",  desc: "Dive deeper into your business with personalized coaching sessions and actionable recommendations",            bg: FB_COACH_BG,    comp: FB_COACH_COMP,    compW: 342 },
  { id: "goals",    label: "Goals",           iconBg: "#f0f4fe", iconColor: "#2f63f5", title: "Goals",           desc: "Set targets for sales, profit, and growth, then track your progress every step of the way",                   bg: FB_GOALS_BG,    comp: FB_GOALS_COMP,    compW: 342 },
];


function FeaturesSection() {
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const wheelLocked = useRef(false);
  const N = FEATURES_DATA.length;

  // Keep ref in sync so wheel handler never has a stale closure
  useEffect(() => { activeRef.current = active; }, [active]);

  // Desktop: intercept wheel events when the sticky section is in view.
  // Advances/retreats features without adding extra page height.
  // When at the first/last feature, wheel events pass through normally.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      // Section is "stuck" when its top edge is at (or just past) 0
      const isSticky = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
      if (!isSticky) return;

      const cur = activeRef.current;
      const goNext = e.deltaY > 0 && cur < N - 1;
      const goPrev = e.deltaY < 0 && cur > 0;

      if (goNext || goPrev) {
        // Intercept this wheel event so page doesn't scroll
        e.preventDefault();
        if (!wheelLocked.current) {
          wheelLocked.current = true;
          const next = goNext ? cur + 1 : cur - 1;
          setActive(next);
          activeRef.current = next;
          // Cooldown prevents runaway trackpad momentum from skipping features
          setTimeout(() => { wheelLocked.current = false; }, 650);
        }
      }
      // At edges (first↑ or last↓): don't preventDefault → page scrolls normally
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [N]);

  const f = FEATURES_DATA[active];

  return (
    <>
      {/* ── MOBILE (< lg): click to reveal ───────────────────────────────────── */}
      <section className="lg:hidden px-4 py-20">
        {/* header */}
        <div className="mb-8">
          <h2 className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17] mb-4" style={{ fontSize: "clamp(24px,6vw,36px)" }}>
            Run your business<br />with confidence
          </h2>
          <p className="font-['Satoshi'] text-[15px] text-[#0f172a] leading-[24px]">
            Track sales and expenses, understand your profits, get AI-powered guidance, set growth goals, and receive personalized business coaching built for everyday entrepreneurs.
          </p>
        </div>
        {/* accordion-style tabs */}
        <div className="flex flex-col gap-2">
          {FEATURES_DATA.map((feat, i) => (
            <div key={feat.id}>
              <div
                className="flex items-center gap-3 cursor-pointer py-2 transition-all duration-200"
                style={{ opacity: i === active ? 1 : 0.45 }}
                onClick={() => setActive(i)}
              >
                <div
                  className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{
                    background: i === active ? feat.iconBg : "transparent",
                    border: i === active ? "none" : "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <FIcon id={feat.id} color={feat.iconColor} />
                </div>
                <span
                  className="font-['Satoshi'] text-[18px] leading-[27px]"
                  style={{ color: i === active ? "#0f172a" : "#7c7f8f", fontWeight: i === active ? 700 : 400 }}
                >
                  {feat.label}
                </span>
              </div>
              {i === active && (
                <div className="mt-3 mb-3 rounded-[16px] overflow-hidden relative" style={{ height: 340 }}>
                  {/* bg */}
                  <img src={feat.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {/* title + desc */}
                  <div className="absolute top-5 left-5 right-5 z-10">
                    <p className="font-['Satoshi'] font-bold text-[16px] text-[#0f172a] leading-[24px]">{feat.title}</p>
                    <p className="font-['Satoshi'] text-[13px] text-[#0f172a] mt-1 leading-[20px]">{feat.desc}</p>
                  </div>
                  {/* component image */}
                  <img
                    src={feat.comp}
                    alt={feat.title}
                    className="absolute left-1/2 block"
                    style={{ top: 100, width: Math.min(feat.compW, 280), transform: "translateX(-50%)" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── DESKTOP (≥ lg): sticky scroll ─────────────────────────────────────── */}
      {/*
        Wrapper is exactly 100vh — same footprint as any other section.
        Feature cycling is driven by wheel-event interception (onWheel above),
        not page-scroll position, so no extra height is needed.
      */}
      <div
        ref={wrapperRef}
        className="hidden lg:block"
        style={{ height: "100vh" }}
      >
        <div className="sticky top-0 h-screen flex items-center relative">

          {/* ── Vertical arrow navigation (Figma: left:52px, gap:24px) ── */}
          <div className="absolute left-[52px] top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
            <button
              onClick={() => setActive(Math.max(0, active - 1))}
              className="w-6 h-6 flex items-center justify-center transition-opacity duration-200 focus:outline-none"
              style={{ opacity: active === 0 ? 0.25 : 1 }}
              aria-label="Previous feature"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 15L12 9L6 15" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => setActive(Math.min(N - 1, active + 1))}
              className="w-6 h-6 flex items-center justify-center transition-opacity duration-200 focus:outline-none"
              style={{ opacity: active === N - 1 ? 0.25 : 1 }}
              aria-label="Next feature"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="w-full max-w-[1392px] mx-auto pl-[132px] pr-[52px]">

            {/* section header */}
            <div className="flex justify-between items-start mb-10 gap-6">
              <h2 className="font-['Satoshi'] font-medium text-[#0f172a] leading-[1.17]" style={{ fontSize: "clamp(24px,2.5vw,36px)" }}>
                Run your business<br />with confidence
              </h2>
              <p className="font-['Satoshi'] text-[16px] text-[#0f172a] max-w-[480px] leading-[24px] tracking-[0.16px]">
                Track sales and expenses, understand your profits, get AI-powered guidance, set growth goals, and receive personalized business coaching built for everyday entrepreneurs.
              </p>
            </div>

            {/* tabs + panel */}
            <div className="flex gap-[146px] items-start">

              {/* left: tab list */}
              <div className="flex flex-col gap-6" style={{ width: 515 }}>
                {FEATURES_DATA.map((feat, i) => (
                  <div
                    key={feat.id}
                    className="flex items-center gap-4 cursor-pointer transition-all duration-300"
                    style={{ opacity: i === active ? 1 : 0.4 }}
                    onClick={() => setActive(i)}
                  >
                    <div
                      className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: i === active ? feat.iconBg : "transparent",
                        border: i === active ? "none" : "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      <FIcon id={feat.id} color={feat.iconColor} />
                    </div>
                    <span
                      className="font-['Satoshi'] text-[20px] leading-[27px] transition-all duration-300"
                      style={{ color: i === active ? "#0f172a" : "#7c7f8f", fontWeight: i === active ? 700 : 400 }}
                    >
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* right: panel — explicit 515×589 so absolute children render correctly */}
              <div className="relative rounded-[16px] overflow-hidden shrink-0" style={{ width: 515, height: 589 }}>
                {/* crossfading backgrounds */}
                {FEATURES_DATA.map((feat, i) => (
                  <img
                    key={feat.id}
                    src={feat.bg}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                    style={{ opacity: i === active ? 1 : 0, pointerEvents: "none" }}
                  />
                ))}
                {/* title + description overlay — left-aligned at 28px */}
                <div className="absolute top-7 left-7 z-10" style={{ right: 28 }}>
                  <p className="font-['Satoshi'] font-bold text-[18px] text-[#0f172a] tracking-[0.18px] leading-[26px]">{f.title}</p>
                  <p className="font-['Satoshi'] text-[16px] text-[#0f172a] mt-2 leading-[24px] tracking-[0.16px]">{f.desc}</p>
                </div>
                {/* crossfading component images — left-aligned at 28px to match text */}
                {FEATURES_DATA.map((feat, i) => (
                  <img
                    key={feat.id}
                    src={feat.comp}
                    alt={feat.title}
                    className="absolute transition-all duration-500 pointer-events-none block"
                    style={{
                      top: 132,
                      left: 28,
                      width: feat.compW,
                      opacity: i === active ? 1 : 0,
                      transform: i === active ? "translateY(0px)" : "translateY(16px)",
                    }}
                  />
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Persona data for Use Case carousel ──────────────────────────────────────────
const PERSONAS = [
  {
    name: "The Hustler",
    desc: "Making sales every day,\nbut unsure where the money goes",
    photo: HUSTLER_PHOTO,
    right: HUSTLER_RIGHT,
  },
  {
    name: "The Growing Operator",
    desc: "Building momentum and looking\nfor more structure and profit",
    photo: OPERATOR_PHOTO,
    right: OPERATOR_RIGHT,
  },
  {
    name: "The Ambitious Builder",
    desc: "Ready to grow faster and make\nsmarter business decisions",
    photo: BUILDER_PHOTO,
    right: BUILDER_RIGHT,
  },
  {
    name: "The Business Owner",
    desc: "Focused on strategy, growth,\nand long-term success",
    photo: OWNER_PHOTO,
    right: OWNER_RIGHT,
  },
];

// ─── Use Case section ─────────────────────────────────────────────────────────────
function UseCaseSection() {
  const [page, setPage] = useState(0);
  // Desktop: 2 cards per page → 2 pages. Mobile: 1 card per page → 4 pages.
  // We track a single page index; CSS controls how many cards are visible.
  // On desktop pages = [0,1], on mobile pages = [0,1,2,3].
  // To keep it simple, we use desktop pages (pairs) and on mobile each pair
  // stacks vertically — so there are always 2 pages total.
  const totalPages = 2;
  const pairs = [
    [PERSONAS[0], PERSONAS[1]],
    [PERSONAS[2], PERSONAS[3]],
  ];

  return (
    <section className="px-4 lg:px-[52px] py-20 max-w-[1440px] mx-auto text-center">
      <Reveal><p className="font-['Satoshi'] font-medium text-[14px] text-[#131313] tracking-[1.68px] uppercase mb-8">USE CASE</p></Reveal>

      <Reveal delay={100}><div className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {["Designed","for","the"].map(w => (
          <span key={w} className="font-['Satoshi'] font-medium text-[#131313] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>{w}</span>
        ))}
        <span className="w-[48px] h-[48px] rounded-full bg-[#f97a22] inline-flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 7v11h14V7L10 2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="font-['Satoshi'] font-medium text-[#131313] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>way</span>
      </div></Reveal>
      <Reveal delay={200}><div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="font-['Satoshi'] font-medium text-[#131313] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>entrepreneurs</span>
        <span className="w-[48px] h-[48px] rounded-full bg-[#b0b0b8] inline-flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 10h16M10 2v16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        {["actually","work"].map(w => (
          <span key={w} className="font-['Satoshi'] font-medium text-[#131313] tracking-[-2.88px]" style={{ fontSize: "clamp(28px,5vw,48px)" }}>{w}</span>
        ))}
      </div></Reveal>

      <Reveal delay={280}><p className="font-['Satoshi'] text-[16px] text-[#2f2f2f] tracking-[-0.32px] mb-10 max-w-[600px] mx-auto leading-[24px]">
        From daily hustles to growing businesses, SPAL adapts to every stage of your journey
      </p></Reveal>

      {/* Join button */}
      <Reveal delay={340}><div className="flex justify-center mb-12">
        <button onClick={scrollToHeroEmail} className="flex items-center bg-[#22c55e] text-white rounded-[48px] pl-6 pr-1 h-[48px] hover:bg-[#16a34a] transition-colors">
          <span className="font-['Satoshi'] text-[14px] tracking-[1.68px] mr-2">Join List</span>
          <span className="w-[40px] h-[40px] rounded-full bg-[#297373] flex items-center justify-center">
            <ArrowIcon />
          </span>
        </button>
      </div></Reveal>

      {/* Persona carousel — overflow:hidden clips the sliding track */}
      <Reveal delay={100}><div className="rounded-[24px] overflow-hidden bg-[#f8f7f4]">
        {/*
          Track: display:flex, no explicit width → resolves to parent width.
          Each slide: min-width:100% → 100% of track = 100% of parent.
          translateX(-N * 100%) moves by N × track-width = N × parent-width. ✓
        */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pairs.map((pair, pi) => (
            <div key={pi} className="min-w-full p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {pair.map((persona) => (
                <div
                  key={persona.name}
                  className="bg-white rounded-[12px] shadow-[0px_3px_6px_0px_rgba(0,0,0,0.06)] h-[300px] relative overflow-hidden"
                >
                  {/* Left content */}
                  <div className="absolute left-5 top-5 bottom-5 right-[52%]">
                    <div className="w-[84px] h-[80px] rounded-lg overflow-hidden">
                      <img src={persona.photo} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 left-0 text-left">
                      <p className="font-['Satoshi'] font-medium text-[22px] text-[#131313] tracking-[-0.96px] leading-[30px]">{persona.name}</p>
                      <p className="font-['Satoshi'] text-[14px] text-[#7b7b7b] leading-[22px] mt-1" style={{ whiteSpace: "pre-line" }}>{persona.desc}</p>
                    </div>
                  </div>
                  {/* Right photo */}
                  <div className="absolute left-[52%] right-5 top-5 bottom-5 rounded-[12px] overflow-hidden">
                    <img src={persona.right} alt={persona.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div></Reveal>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          className="w-6 h-6 flex items-center justify-center transition-opacity duration-200 focus:outline-none"
          style={{ opacity: page === 0 ? 0.3 : 1 }}
          aria-label="Previous"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#131313" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

<button
          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
          className="w-6 h-6 flex items-center justify-center transition-opacity duration-200 focus:outline-none"
          style={{ opacity: page === totalPages - 1 ? 0.3 : 1 }}
          aria-label="Next"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#131313" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#131313] overflow-hidden">
      {/* Big logo */}
      <div className="flex justify-center py-16 px-4">
        <img
          src="/Spal Logo_Footer.png"
          alt="SPAL"
          style={{ height: "clamp(60px,10vw,160px)", width: "auto" }}
        />
      </div>

      {/* Divider */}
      <div className="mx-[47px] border-t border-white/10" />

      {/* Bottom row */}
      <div className="px-6 lg:px-[52px] pt-8 pb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">

        {/* Link columns */}
        <div className="flex flex-col sm:flex-row gap-8 lg:gap-[113px]">
          {/* GET IN TOUCH */}
          <div className="flex flex-col gap-1">
            <p className="font-['Satoshi'] font-bold text-[12px] text-white/70 tracking-[0.6px] uppercase leading-[16px] mb-1">
              Get in Touch
            </p>
            <a href="mailto:hello@spal.ng" className="font-['Satoshi'] text-[14px] text-white leading-[20px] hover:text-[#22c55e] transition-colors">
              hello@spal.ng
            </a>
          </div>

          {/* VISIT US */}
          <div className="flex flex-col gap-1">
            <p className="font-['Satoshi'] font-bold text-[12px] text-white/70 tracking-[0.6px] uppercase leading-[16px] mb-1">
              Visit Us
            </p>
            {[
              { label: "Instagram", url: "http://instagram.com/spal_ng" },
              { label: "TikTok",    url: "http://tiktok.com/@spal_ng" },
              { label: "X",         url: "http://x.com/spal_ng" },
              { label: "YouTube",   url: "https://www.youtube.com/@spalng" },
            ].map(({ label, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="font-['Satoshi'] text-[14px] text-white leading-[20px] hover:text-[#22c55e] transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* COMPANY */}
          <div className="flex flex-col gap-1">
            <p className="font-['Satoshi'] font-bold text-[12px] text-white/70 tracking-[0.6px] uppercase leading-[16px] mb-1">
              Company
            </p>
            <span className="font-['Satoshi'] text-[14px] text-white leading-[20px] cursor-pointer hover:text-[#22c55e] transition-colors">
              privacy policy
            </span>
          </div>
        </div>

        {/* Right: email pill form + copyright */}
        <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
          {/* Dark pill form — matches Figma: bg-[#272627] rounded-[32px] h-[56px] w-[400px] */}
          <PillForm dark scrollOnly />
          <p className="font-['Satoshi'] text-[14px] text-white/70">@2026 spal.ng</p>
        </div>

      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────────
export default function Page() {
  const heroRef = useRef<HTMLDivElement>(null);

  function scrollToHero() {
    scrollToHeroEmail();
  }

  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <Navbar onJoin={scrollToHero} />
      <div ref={heroRef}>
        <Hero />
      </div>
      <HeadlineSection />
      <StatCards />
      <FeaturesSection />
      <UseCaseSection />
      <Footer />
    </main>
  );
}
