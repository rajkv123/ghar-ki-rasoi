import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-lg bg-elevated px-3 py-2 text-sm text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)] placeholder:text-subtle outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[inset_0_0_0_2px_var(--tg-primary)]",
        className,
      )}
      {...props}
    />
  );
}
