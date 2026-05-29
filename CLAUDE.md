# CLAUDE.md

# Product Name

SPAL — Spending • Profiting • Analysing • Looping

---

# Product Vision

SPAL is a mobile-first AI-powered business companion built for informal and small-scale entrepreneurs across Africa and similar emerging markets.

The platform helps users understand:
- sales
- profit
- expenses
- spending habits
- business patterns
- growth opportunities

through extremely simple and conversational experiences.

The product should transform messy daily hustle into understandable business intelligence.

This is NOT traditional accounting software.

This is a smart, friendly business assistant.

---

# Core Audience

Primary users are:
- roadside food sellers
- kiosk owners
- small bar owners
- fashion vendors
- salon owners
- market traders
- small grocery sellers
- one-person businesses
- low-scale and medium-scale entrepreneurs

Most users:
- use Android devices
- are familiar with WhatsApp, Instagram, TikTok, and Snapchat
- are not financially literate
- are not comfortable with complex apps
- dislike long forms
- prefer voice over typing
- are busy and impatient
- often mix personal and business finances
- do not fully understand profit vs revenue
- operate with inconsistent internet access

The product must never make users feel unintelligent or overwhelmed.

---

# Product Philosophy

The app should feel:
- conversational
- supportive
- lightweight
- encouraging
- human
- emotionally safe

The app should NOT feel:
- corporate
- accountant-focused
- enterprise-heavy
- spreadsheet-like
- overwhelming
- technical

---

# UX Principles

## 1. Mobile First Always
- Prioritize thumb reach, vertical scroll, one-handed use
- Minimum 48px tap targets on ALL interactive elements
- Desktop is secondary

## 2. One Primary Action Per Screen
- Avoid clutter, multiple CTAs, crowded layouts

## 3. Reduce Thinking
Bad: "Your expenditure exceeded your revenue."
Good: "You spent more money than you made today."

## 4. Voice First
- Users can record sales, expenses, and questions by voice

## 5. Emotional Design
- Never shame users
- Celebrate wins, streaks, progress (Duolingo-inspired)

## 6. Fast Interactions
- Optimize for poor internet and low-end Android

---

# Design System

## Brand Colors
- SPAL Green:  #22C55E  → sales, positive, success
- SPAL Blue:   #2563EB  → profit, insights, AI
- SPAL Orange: #FF7A00  → expenses, money out
- SPAL Purple: #8B5CF6  → learn, analytics
- Navy:        #0F172A  → primary text
- Soft BG:     #F8F7F4  → page background

## Typography
- Headings: Poppins (Bold / SemiBold)
- Body: Inter (Regular / Medium)
- H1: 32px | H2: 24px | H3: 20px | H4: 18px
- Body: 14px | Small: 12px

## Components
- Rounded corners: rounded-2xl for cards, rounded-full for pills
- Shadows: shadow-sm for cards
- Bottom sheets, not modals
- Bottom navigation: 5 tabs (Home, Records, Insights, Learn, Profile)

## Color Semantics
- Green = sales / money in
- Orange = expenses / money out
- Blue = profit / AI / insights
- Purple = learn / growth

---

# Navigation Structure

Bottom navigation only.
Tabs: Home | Records | Insights | Learn | Profile

---

# Tech Stack (DO NOT deviate)

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4 (CSS-based @theme config, NO tailwind.config.ts)
- Animation: Framer Motion
- Backend: Supabase (PostgreSQL + Auth)
- AI Text: OpenAI GPT-4o
- AI Voice: OpenAI Whisper
- State: Zustand
- Forms: React Hook Form + Zod
- Charts: Recharts
- PWA: next.config.ts headers + manifest.json

## Tailwind v4 Rules
- DO NOT create tailwind.config.ts
- ALL custom tokens go in app/globals.css using @theme block
- Custom colors accessed as: bg-spal-green, text-spal-orange, etc.

---

# Engineering Rules

- Optimize for low-end Android devices
- Keep bundle sizes small — lazy load heavy components
- Offline-first where possible
- Every screen needs: loading state, empty state, error state
- All buttons: aria-label, min 48px height
- No horizontal scroll on 375px viewport
- Safe area insets for bottom navigation (env(safe-area-inset-bottom))

---

# Writing Style

Bad: "Your expenditure ratio increased."
Good: "You spent more than usual today."

Bad: "Revenue exceeded projections."
Good: "Great day! You made more than expected."

AI must NEVER use: expenditure, revenue, liabilities, assets, ledger, reconcile

---

# Screen Rules

Every screen must define:
- Purpose
- Primary action
- Emotional goal
- Loading state
- Empty state
- Error state

Each screen should feel simple enough for someone who only uses WhatsApp daily.
