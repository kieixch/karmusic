export class AppError extends Error {
  code: string;

  constructor(message: string, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(message)
  );
}
