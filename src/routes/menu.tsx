import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DishCard } from "@/components/dish-card";
import { getCatalog, getKitchen } from "@/lib/kitchen/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  loader: async () => {
    const [kitchen, catalog] = await Promise.all([getKitchen(), getCatalog()]);
    return { kitchen, catalog };
  },
  component: MenuPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "veg", label: "Veg" },
  { id: "daily", label: "Today" },
] as const;

function MenuPage() {
  const { kitchen, catalog } = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const items = useMemo(() => {
    return catalog.filter((d) => {
      if (filter === "veg") return d.is_veg;
      if (filter === "lunch") return d.meal_slot === "lunch" || d.meal_slot === "any";
      if (filter === "dinner") return d.meal_slot === "dinner" || d.meal_slot === "any";
      if (filter === "daily") return !d.is_weekly_special;
      return true;
    });
  }, [catalog, filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {kitchen.city} home kitchen
      </p>
      <h1 className="mt-2 font-display text-4xl">Daily board</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Posted each morning from {kitchen.address_line}. Calories are calculated
        per dish — add to your bag to see the plate total.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
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
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DishCard
            key={item.id}
            item={item}
            onAdded={(d) => toast(`Added ${d.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
