import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/35",
          "focus-ring transition focus:border-accent/40",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 text-sm text-white placeholder:text-white/35",
          "focus-ring transition focus:border-accent/40",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 rounded-lg border border-white/[0.08] bg-ink-800 px-3 text-sm text-white",
          "focus-ring transition focus:border-accent/40",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);
