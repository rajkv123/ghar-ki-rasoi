import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DishCard } from "@/components/dish-card";
import { A_LA_CARTE_STATES } from "@/lib/kitchen/catalog";
import { getCatalog } from "@/lib/kitchen/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/specials")({
  loader: async () => ({ catalog: await getCatalog() }),
  component: SpecialsPage,
});

function SpecialsPage() {
  const { catalog } = Route.useLoaderData();
  const [state, setState] = useState<string>("all");
  const specials = catalog.filter(
    (d) => (d.is_weekly_special || d.is_alacarte) && A_LA_CARTE_STATES.has(d.state_origin),
  );
  const states = useMemo(() => {
    const present = new Set(specials.map((d) => d.state_origin));
    return [...A_LA_CARTE_STATES].filter((s) => present.has(s));
  }, [specials]);
  const items = specials.filter((d) => state === "all" || d.state_origin === state);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Bihar & Uttar Pradesh
      </p>
      <h1 className="mt-2 font-display text-4xl">Flavours by state</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Explore our Bihar and Uttar Pradesh favourites, highlighted as weekly specials and available
        a la carte while they last.
      </p>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setState("all")}
          className={cn(
            "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium",
            state === "all" ? "bg-primary text-primary-fg" : "bg-fg/6",
          )}
        >
          All
        </button>
        {states.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium",
              state === s ? "bg-primary text-primary-fg" : "bg-fg/6",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DishCard key={item.id} item={item} onAdded={(d) => toast(`Added ${d.name}`)} />
        ))}
      </div>
    </div>
  );
}
