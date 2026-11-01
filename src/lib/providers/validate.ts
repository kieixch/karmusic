export class QueryError extends Error {}

export function intParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value == null || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new QueryError("Expected a positive integer.");
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new QueryError(`Value must be between ${min} and ${max}.`);
  }
  return parsed;
}

export function enumParam<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value == null || value === "") return fallback;
  if (!allowed.includes(value as T)) throw new QueryError("Unsupported value.");
  return value as T;
}

export function searchQuery(value: string | null): string {
  const query = (value ?? "").trim();
  if (!query) throw new QueryError("A search query is required.");
  if (query.length > 100) throw new QueryError("Search query is too long (maximum 100 characters).");
  return query;
}

export function uuidParam(value: string): string {
  if (!/^[0-9a-fA-F-]{36}$/.test(value)) throw new QueryError("Invalid track identifier.");
  return value;
}

export function numericIdParam(value: string): string {
  if (!/^\d{1,20}$/.test(value)) throw new QueryError("Invalid track identifier.");
  return value;
}
