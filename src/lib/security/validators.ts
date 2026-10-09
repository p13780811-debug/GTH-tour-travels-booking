export function cleanString(
  value: unknown,
  options: { min?: number; max?: number; pattern?: RegExp } = {},
): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  const min = options.min ?? 1;
  const max = options.max ?? 500;

  if (normalized.length < min || normalized.length > max) return null;
  if (options.pattern && !options.pattern.test(normalized)) return null;

  return normalized;
}

export function cleanEmail(value: unknown): string | null {
  const email = cleanString(value, { min: 5, max: 254 });
  if (!email) return null;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return emailPattern.test(email) ? email.toLowerCase() : null;
}

export function cleanSlug(value: unknown): string | null {
  return cleanString(value, {
    min: 1,
    max: 160,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
  });
}

export function cleanIata(value: unknown): string | null {
  const code = cleanString(value, { min: 3, max: 3, pattern: /^[A-Za-z]{3}$/ });
  return code ? code.toUpperCase() : null;
}

export function cleanDate(value: unknown): string | null {
  const date = cleanString(value, {
    min: 10,
    max: 10,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  });

  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : date;
}

export function cleanPositiveInteger(
  value: unknown,
  options: { min?: number; max?: number } = {},
): number | null {
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : NaN;

  if (!Number.isInteger(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

export function cleanStringArray(
  value: unknown,
  options: { maxItems?: number; maxLength?: number } = {},
): string[] {
  if (!Array.isArray(value)) return [];

  const maxItems = options.maxItems ?? 20;
  const maxLength = options.maxLength ?? 160;

  return value
    .slice(0, maxItems)
    .map((item) => cleanString(item, { max: maxLength }))
    .filter((item): item is string => Boolean(item));
}
