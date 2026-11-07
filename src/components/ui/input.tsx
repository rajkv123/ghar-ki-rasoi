import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)] placeholder:text-subtle outline-none transition-[box-shadow] duration-150 focus-visible:shadow-[inset_0_0_0_2px_var(--tg-primary)]",
        className,
      )}
      {...props}
    />
  );
}
