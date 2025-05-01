// src/lib/utils.ts

/**
 * Conditionally join class names together.
 *
 * Usage:
 *   cn('p-4', isActive && 'bg-blue-500', extraClass)
 */
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(' ');
}
