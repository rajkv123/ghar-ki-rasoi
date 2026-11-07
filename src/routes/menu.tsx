import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DishCard } from "@/components/dish-card";
import { DAILY_BOARD_STATES } from "@/lib/kitchen/catalog";
import { getCatalog } from "@/lib/kitchen/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  loader: async () => ({ catalog: await getCatalog() }),
  component: MenuPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "daily", label: "Today" },
] as const;

function MenuPage() {
  const { catalog } = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const items = useMemo(() => {
    return catalog.filter((d) => {
      if (!DAILY_BOARD_STATES.has(d.state_origin)) return false;
      if (d.is_veg !== (diet === "veg")) return false;
      if (filter === "lunch") return d.meal_slot === "lunch" || d.meal_slot === "any";
      if (filter === "dinner") return d.meal_slot === "dinner" || d.meal_slot === "any";
      if (filter === "daily") return !d.is_weekly_special;
      return true;
    });
  }, [catalog, diet, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Gharaunda Rasoi, Begur, Mylsandra Road
      </p>
      <h1 className="mt-2 font-display text-4xl">Daily board</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Posted each morning from Gharaunda Rasoi, Begur, Mylsandra Road. Calories are calculated per
        dish — add to your bag to see the plate total.
      </p>
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Meal preference">
        {(["veg", "non-veg"] as const).map((option) => (
          <button
            key={option}
            id={`diet-tab-${option}`}
            type="button"
            role="tab"
            aria-selected={diet === option}
            aria-controls="daily-board-items"
            onClick={() => setDiet(option)}
            className={cn(
              "min-h-11 rounded-full px-5 text-sm font-medium",
              diet === option ? "bg-primary text-primary-fg" : "bg-fg/6 hover:bg-fg/10",
            )}
          >
            {option === "veg" ? "Veg" : "Non-veg"}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter daily board">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium",
              filter === f.id ? "bg-primary text-primary-fg" : "bg-fg/6",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div
        id="daily-board-items"
        role="tabpanel"
        aria-labelledby={`diet-tab-${diet}`}
        className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item) => (
          <DishCard key={item.id} item={item} onAdded={(d) => toast(`Added ${d.name}`)} />
        ))}
      </div>
    </div>
  );
}
