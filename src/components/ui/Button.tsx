import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-soft active:bg-accent-dim disabled:bg-accent/40 disabled:text-black/50",
  secondary:
    "bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/[0.06] disabled:text-white/35",
  ghost: "bg-transparent text-white/75 hover:bg-white/[0.07] hover:text-white disabled:text-white/30",
  danger: "bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/25",
  outline: "border border-white/15 bg-transparent text-white hover:bg-white/[0.06]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-xs font-medium",
  md: "h-11 gap-2 rounded-xl px-4 text-sm font-semibold",
  lg: "h-12 gap-2 rounded-xl px-6 text-base font-semibold",
  icon: "size-10 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "focus-ring inline-flex select-none items-center justify-center whitespace-nowrap transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
