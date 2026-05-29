/**
 * SPAL OpenAI functions — GPT-4o calls
 */
import OpenAI from "openai";
import {
  PARSE_RECORD_PROMPT,
  buildDailyInsightPrompt,
  buildChatSystemPrompt,
} from "./prompts";
import type { ChatMessage } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Parse records from natural language ──────────────────────────────────────
export async function parseRecordsFromText(text: string): Promise<
  Array<{ type: "sale" | "expense"; amount: number; description: string; category: string }>
> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PARSE_RECORD_PROMPT },
      { role: "user",   content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed  = JSON.parse(content);
  return parsed.records ?? [];
}

// ─── Generate daily insight ───────────────────────────────────────────────────
export async function generateDailyInsight(data: {
  totalSales: number;
  totalExpenses: number;
  profit: number;
  records: Array<{ type: string; amount: number; description?: string; category?: string }>;
  businessType: string;
  currency: string;
}): Promise<{ insight: string; message: string }> {
  // Find top expense and top sale
  const sales    = data.records.filter(r => r.type === "sale");
  const expenses = data.records.filter(r => r.type === "expense");
  const topSale    = sales.sort((a, b) => b.amount - a.amount)[0];
  const topExpense = expenses.sort((a, b) => b.amount - a.amount)[0];

  const prompt = buildDailyInsightPrompt({
    sales:       data.totalSales,
    expenses:    data.totalExpenses,
    profit:      data.profit,
    businessType: data.businessType,
    recordCount: data.records.length,
    topSale:     topSale?.description ?? undefined,
    topExpense:  topExpense?.description ?? undefined,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const result  = JSON.parse(content);

  return {
    insight: result.insight ?? "You tracked your business today. Keep it up!",
    message: result.message ?? "Nice work recording today!",
  };
}

// ─── Parse a receipt / invoice image via GPT-4o vision ───────────────────────
export async function parseReceiptImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<{
  type: "sale" | "expense";
  amount: number;
  description: string;
  category: string;
} | null> {
  const base64   = imageBuffer.toString("base64");
  const imageUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl, detail: "low" },
          },
          {
            type: "text",
            text: `You are helping a small business owner in Nigeria record sales and expenses.
Look at this receipt or invoice image and extract the key information.

Return ONLY valid JSON in this exact format:
{
  "type": "sale" or "expense",
  "amount": number,
  "description": "brief description max 60 chars",
  "category": "pick the best match"
}

Rules:
- "type" is "expense" if the business PAID money (buying stock, fuel, etc.)
- "type" is "sale" if the business RECEIVED money (sold goods/services)
- "amount" is the TOTAL amount as a plain number (no ₦ symbol). Convert shorthand: 15k=15000.
- "description" should be specific, e.g. "Fuel 20 litres", "Garri stock", "Customer payment"
- "category" must be one of: Drinks, Food, Clothing, Services, Products, Stock, Fuel, Transport, Rent, Salary, Utilities, Other
- If the image is unreadable or contains no financial data, return: {"error":"cannot_read"}
Do NOT include any text outside the JSON.`,
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 150,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed  = JSON.parse(content);

  if (parsed.error || !parsed.amount || Number(parsed.amount) <= 0) return null;

  return {
    type:        parsed.type === "sale" ? "sale" : "expense",
    amount:      Number(parsed.amount),
    description: String(parsed.description ?? "").slice(0, 100),
    category:    String(parsed.category ?? "Other"),
  };
}

// ─── Ask SPAL chat ────────────────────────────────────────────────────────────
export async function askSPAL(data: {
  message: string;
  history: ChatMessage[];
  user: { full_name?: string; business_type?: string; business_name?: string };
  summaries: Array<{
    summary_date: string;
    total_sales: number;
    total_expenses: number;
    profit: number;
  }>;
  dailyBreakdown?: Array<{ date: string; sales: number; expenses: number; profit: number }>;
  recentRecords?: Array<{ type: string; amount: number; description: string; date: string }>;
  currency: string;
}): Promise<string> {
  // Prefer live records-based breakdown; fall back to summaries if no records
  const breakdown = (data.dailyBreakdown && data.dailyBreakdown.length > 0)
    ? data.dailyBreakdown
    : data.summaries.map(s => ({
        date:     s.summary_date,
        sales:    Number(s.total_sales),
        expenses: Number(s.total_expenses),
        profit:   Number(s.profit),
      }));

  const latest    = breakdown[breakdown.length - 1];
  const weekSales = breakdown.reduce((s, d) => s + d.sales,    0);
  const weekExp   = breakdown.reduce((s, d) => s + d.expenses, 0);
  const weekProfit = weekSales - weekExp;

  const systemPrompt = buildChatSystemPrompt({
    userName:     data.user.full_name,
    businessType: data.user.business_type ?? "other",
    businessName: data.user.business_name,
    recentSummary: latest
      ? {
          sales:    latest.sales,
          expenses: latest.expenses,
          profit:   latest.profit,
          date:     latest.date,
        }
      : undefined,
    weekSales,
    weekExpenses: weekExp,
    weekProfit,
    dailyBreakdown: breakdown,
    recentRecords:  data.recentRecords,
  });

  // Convert history to OpenAI messages (last 10 turns)
  const historyMessages = data.history.slice(-10).map(m => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user",   content: data.message },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not answer that. Please try again.";
}
