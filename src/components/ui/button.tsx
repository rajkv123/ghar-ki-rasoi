import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-h-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-fg shadow-sm hover:opacity-92",
        accent: "bg-accent text-accent-fg hover:opacity-92",
        outline:
          "bg-transparent text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_16%,transparent)] hover:bg-surface",
        ghost: "bg-transparent text-fg hover:bg-surface",
        soft: "bg-surface text-fg shadow-[var(--tg-shadow)] hover:bg-elevated",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 px-3 text-xs",
        lg: "h-12 min-h-12 px-5",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
