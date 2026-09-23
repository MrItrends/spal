/**
 * SPAL shared types — the subset used by both the mobile and desktop apps
 * (dashboard hooks, store). Each app may keep its own additional types for
 * things only it needs; this file is the single source of truth for what's
 * genuinely shared.
 */

export type BusinessType =
  | "food_seller"
  | "bar_owner"
  | "fashion_vendor"
  | "salon"
  | "kiosk"
  | "market_trader"
  | "other";

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

export interface CoachBreakdown {
  id: string;
  title: string;
  completed: boolean;
}

export interface CoachGoal {
  id: string;
  title: string;
  createdAt: string;
  dueDate?: string | null;
  status: "active" | "completed";
  progress: number;
  breakdowns: CoachBreakdown[];
}

export type RecordType = "sale" | "expense";
export type InputMethod = "voice" | "text" | "quick";

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
  payment_status?: "paid" | "owing";
  customer_name?: string;
}

export interface InventoryVariation {
  size_or_flavour: string;
  unit_price?: number | null;
  quantity?: number | null;
  sku?: string | null;
  gtin?: string | null;
  cost_price?: number | null;
  discount?: number | null;
  low_stock_threshold?: number | null;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
  cost_price?: number | null;
  selling_price?: number | null;
  category?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  initial_stock?: number | null;
  sku?: string | null;
  gtin?: string | null;
  discount?: number | null;
  discount_eligible?: boolean | null;
  variations?: InventoryVariation[] | null;
  created_at: string;
  updated_at: string;
}

export type MenuType = "food" | "drinks";

export interface MenuItem {
  id: string;
  user_id: string;
  name: string;
  menu_type: MenuType;
  category?: string | null;
  unit: string;
  quantity: number;
  sold: number;
  price: number;
  image_url?: string | null;
  images?: string[] | null;
  created_at: string;
  updated_at: string;
}
