import { Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/kitchen/theme";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose theme"
        onClick={() => setOpen((v) => !v)}
      >
        <Palette className="size-5" />
      </Button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg bg-elevated p-1.5 shadow-[var(--tg-shadow)]"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={theme === t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors duration-150",
                theme === t.id ? "bg-primary/10 text-fg" : "hover:bg-fg/5",
              )}
            >
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-xs text-muted">{t.note}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
