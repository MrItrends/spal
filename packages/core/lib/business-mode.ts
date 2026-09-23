import type { BusinessType } from "./types";

/**
 * SPAL runs two dashboard experiences, chosen by business type:
 *
 *  - "perishable"     — sellers of perishable / prepared goods: restaurants
 *                       (food_seller) and bars/drinks (bar_owner). Menu-first.
 *  - "non-perishable" — everyone else: kiosks/supermarkets, clothing/fashion,
 *                       salons, market traders, etc. Inventory-first.
 *
 * Single source of truth for the split — both the mobile and desktop apps
 * import this from @spal/core.
 */
export const PERISHABLE_TYPES: BusinessType[] = ["food_seller", "bar_owner"];

export type BusinessMode = "perishable" | "non-perishable";

export function businessMode(type?: BusinessType | string | null): BusinessMode {
  return type && PERISHABLE_TYPES.includes(type as BusinessType) ? "perishable" : "non-perishable";
}

export function isPerishable(type?: BusinessType | string | null): boolean {
  return businessMode(type) === "perishable";
}
