import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "primary" | "accent" | "veg" | "hot";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "muted" && "bg-fg/8 text-muted",
        tone === "primary" && "bg-primary text-primary-fg",
        tone === "accent" && "bg-accent text-accent-fg",
        tone === "veg" && "bg-veg/12 text-veg",
        tone === "hot" && "bg-primary/12 text-primary",
        className,
      )}
      {...props}
    />
  );
}
