"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      const field = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type='hidden']), textarea, select",
      );
      field?.focus();
    }, 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-ink-850 p-5 shadow-soft animate-slide-up sm:rounded-2xl sm:animate-fade-in",
          size === "sm" && "sm:max-w-sm",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          "safe-bottom",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm muted">{description}</p> : null}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1 -mt-1">
            <X aria-hidden />
          </IconButton>
        </div>
        {children}
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} size="sm">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring h-10 rounded-lg px-4 text-sm font-medium text-white/70 hover:bg-white/[0.06]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className={cn(
            "focus-ring h-10 rounded-lg px-4 text-sm font-semibold",
            destructive
              ? "bg-red-500/20 text-red-100 hover:bg-red-500/30"
              : "bg-accent text-black hover:bg-accent-soft",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
