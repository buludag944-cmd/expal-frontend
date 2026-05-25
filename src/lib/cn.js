import { clsx } from "clsx";

/** Merge class names (shadcn-style helper). */
export function cn(...inputs) {
  return clsx(inputs);
}
