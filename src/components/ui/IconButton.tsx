import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}

const sizes = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", active = false, className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={props["aria-pressed"] ?? (active ? true : undefined)}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        "text-white/75 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-35",
        active && "bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
