"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function InlineError({
  message,
  onRetry,
  note,
}: {
  message: string;
  onRetry?: () => void;
  note?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4 sm:flex-row sm:items-center"
    >
      <AlertTriangle className="size-5 shrink-0 text-amber-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-100">{message}</p>
        {note ? <p className="mt-0.5 text-xs text-amber-100/50">{note}</p> : null}
      </div>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
