/**
 * SPAL shared TypeScript types
 */

// ── SPAL Goals (voice-first coaching) ───────────────────────────────────────
export interface CoachBreakdown {
  id: string;
  title: string;
  completed: boolean;
}

export interface CoachGoal {
  id: string;
  title: string;
  createdAt: string;          // ISO timestamp
  dueDate?: string | null;    // ISO date, optional
  status: "active" | "completed";
  progress: number;           // 0–100, derived from breakdowns
  breakdowns: CoachBreakdown[];
}

export type BusinessType =
  | "food_seller"
  | "bar_owner"
  | "fashion_vendor"
  | "salon"
  | "kiosk"
  | "market_trader"
  | "other";

export type BusinessGoal =
  | "track_sales"
  | "know_profit"
  | "reduce_expenses"
  | "grow_business"
  | "understand_spending";

export interface User {
  id: string;
  phone_number: string;
  full_name?: string;
  business_name?: string;
  business_type?: BusinessType;
  business_goals?: BusinessGoal[];
  currency: string;
  whatsapp_number?: string;
  streak_days: number;
  last_active?: string;
  onboarding_completed: boolean;
  created_at: string;
  active_business_id?: string;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  business_type: BusinessType;
  currency: string;
  tracking_methods: string[];
  business_goals: string[];
  is_archived: boolean;
  created_at: string;
}

export type RecordType = "sale" | "expense";
export type InputMethod = "voice" | "text" | "quick";

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  cost_price?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessRecord {
  id: string;
  user_id: string;
  type: RecordType;
  amount: number;
  description?: string;
  category?: string;
  input_method?: InputMethod;
  raw_input?: string;
  record_date: string;
  created_at: string;
  payment_status?: 'paid' | 'owing';
  customer_name?: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  total_sales: number;
  total_expenses: number;
  profit: number;
  ai_insight?: string;
  ai_message?: string;
}

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_sales: number;
  total_expenses: number;
  profit: number;
  top_insight?: string;
  report_data?: Record<string, unknown>;
  sent_via?: string[];
  sent_at?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// API response shapes
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
