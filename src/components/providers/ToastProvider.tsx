"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastType = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, message, type }]);
      window.setTimeout(() => dismiss(id), type === "error" ? 7000 : 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-28"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.type === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft backdrop-blur-md animate-fade-in",
              item.type === "error" && "border-red-500/40 bg-red-950/85 text-red-100",
              item.type === "success" && "border-accent/30 bg-ink-800/95 text-white",
              item.type === "info" && "border-white/10 bg-ink-800/95 text-white",
            )}
          >
            {item.type === "error" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
            ) : item.type === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden />
            )}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="rounded-full p-1 text-white/50 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
