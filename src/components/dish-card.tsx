import { Link } from "@tanstack/react-router";
import { Leaf, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatInr, formatKcal, spiceLabel } from "@/lib/kitchen/format";
import type { MenuItem } from "@/lib/kitchen/types";

export function DishCard({
  item,
  onAdded,
}: {
  item: MenuItem;
  onAdded?: (item: MenuItem) => void;
}) {
  const add = useCart((s) => s.add);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--tg-shadow)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-elevated">
        <img
          src={item.image_url}
          alt={item.name}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone={item.is_veg ? "veg" : "hot"}>{item.is_veg ? "Veg" : "Non-veg"}</Badge>
          {item.is_weekly_special && <Badge tone="primary">Weekly special</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            {item.state_origin}
          </p>
          <h3 className="font-display text-xl font-medium">{item.name}</h3>
          <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
        </div>
        <p className="text-xs text-subtle">
          {item.flavor} · {spiceLabel(item.spice_level)} · {formatKcal(item.calories)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <p className="text-base font-medium tabular-nums">{formatInr(item.price_paise)}</p>
          <Button
            size="sm"
            onClick={() => {
              add(item, 1);
              onAdded?.(item);
            }}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}

export function VegDot({ veg }: { veg: boolean }) {
  return veg ? (
    <Leaf className="size-3.5 text-veg" aria-label="Vegetarian" />
  ) : (
    <span
      className="inline-block size-2.5 rounded-[2px] bg-nonveg"
      aria-label="Non-vegetarian"
    />
  );
}

export function SpecialStrip({ items }: { items: MenuItem[] }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 md:-mx-0 md:px-0">
      {items.map((item) => (
        <Link
          key={item.id}
          to="/specials"
          className="w-[78vw] shrink-0 overflow-hidden rounded-xl bg-surface shadow-[var(--tg-shadow)] sm:w-80"
        >
          <div className="relative aspect-[4/3]">
            <img src={item.image_url} alt="" className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,color-mix(in_oklab,var(--tg-fg)_72%,transparent))] p-4 text-primary-fg">
              <p className="text-[11px] uppercase tracking-[0.16em] opacity-80">
                {item.state_origin}
              </p>
              <p className="font-display text-2xl">{item.name}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
