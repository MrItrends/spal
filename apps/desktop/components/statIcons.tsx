import {
  ShoppingBasket03Icon, ReceiptDollarIcon, PackageIcon, MoneyBag01Icon,
  Invoice01Icon, CheckListIcon, Restaurant01Icon, Restaurant02Icon, Restaurant03Icon,
} from "hugeicons-react";

/**
 * Maps the string `iconKey`s the @spal/core dashboard hooks return to actual
 * icon components. The hooks stay UI-library-agnostic (no JSX); each app's
 * view owns this mapping. See packages/core/hooks/use*Dashboard.ts.
 */
export const STAT_ICONS = {
  sales: ShoppingBasket03Icon,
  expenses: ReceiptDollarIcon,
  inventory: PackageIcon,
  debt: MoneyBag01Icon,
} as const;

export const QUICK_ACTION_ICONS = {
  pos: Invoice01Icon,
  "add-item": CheckListIcon,
  restock: PackageIcon,
} as const;

export const DISH_ICONS = {
  "dish-a": Restaurant01Icon,
  "dish-b": Restaurant02Icon,
  "dish-c": Restaurant03Icon,
} as const;
