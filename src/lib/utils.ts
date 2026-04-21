import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine classnames intelligently.
 *
 * - `clsx` resolves conditionals and arrays into a flat string
 * - `twMerge` dedupes conflicting Tailwind classes
 *   (e.g. `cn("p-4", "p-8")` → "p-8", not "p-4 p-8")
 *
 * Used by every shadcn/ui component in components/ui/.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
