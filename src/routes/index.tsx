import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bike, Leaf, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { DishCard, SpecialStrip } from "@/components/dish-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCatalog, getKitchen, getPlans } from "@/lib/kitchen/server";
import { formatInr, SITE_LOCATION } from "@/lib/kitchen/format";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [kitchen, catalog, plans] = await Promise.all([
      getKitchen(),
      getCatalog(),
      getPlans(),
    ]);
    return { kitchen, catalog, plans };
  },
  component: Home,
});

function Home() {
  const { kitchen, catalog, plans } = Route.useLoaderData();
  const specials = catalog.filter((d) => d.is_weekly_special);
  const daily = catalog.filter((d) => !d.is_weekly_special).slice(0, 4);
  const starter = plans[0];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/dishes/hero-kitchen.jpg"
            alt=""
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--tg-bg)_88%,transparent)_0%,color-mix(in_oklab,var(--tg-bg)_55%,transparent)_55%,color-mix(in_oklab,var(--tg-bg)_28%,transparent)_100%)]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="stagger-in max-w-xl space-y-5">
            <Badge tone="accent">Home kitchen · {SITE_LOCATION}</Badge>
            <h1 className="font-display text-4xl font-medium sm:text-6xl">
              State feasts, cooked at home, delivered warm.
            </h1>
            <p className="text-base text-muted sm:text-lg">
              {kitchen.tagline} Daily boards from Gharaunda Rasoi, Begur, weekly
              A La Carte from Karnataka, Bihar, UP.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/menu">
                  Today's board
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/subscribe">Subscribe</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 pt-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/80 px-3 py-1.5">
                <ShieldCheck className="size-4 text-primary" />
                Licence {kitchen.licence_number}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bg/80 px-3 py-1.5">
                <Bike className="size-4" />
                {kitchen.avg_prep_minutes} min prep · {kitchen.delivery_radius_km} km ride
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-4 px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              This week
            </p>
            <h2 className="mt-1 font-display text-3xl">A la carte state specials</h2>
          </div>
          <Link to="/specials" className="text-sm font-medium underline-offset-4 hover:underline">
            All specials
          </Link>
        </div>
        <SpecialStrip items={specials} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Daily board
            </p>
            <h2 className="mt-1 font-display text-3xl">Cooked today in our home</h2>
          </div>
          <Link to="/menu" className="text-sm font-medium underline-offset-4 hover:underline">
            Full menu
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {daily.map((item) => (
            <DishCard
              key={item.id}
              item={item}
              onAdded={(d) => toast(`Added ${d.name}`)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[
          {
            icon: UtensilsCrossed,
            title: "Daily menu",
            body: "The owner posts today's thali and sides each morning, with a photo and a calorie card.",
          },
          {
            icon: Leaf,
            title: "Honest calories",
            body: "Every plate sums protein, carbs and fat. Your bag shows the share of a 2,000 kcal day.",
          },
          {
            icon: Bike,
            title: "Home to door",
            body: "ETA from our Begur kitchen, then a live trail as the rider leaves the hearth.",
          },
        ].map((f) => (
          <Card key={f.title} className="p-5">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-display text-xl">{f.title}</h3>
            <p className="mt-2 text-sm text-muted">{f.body}</p>
          </Card>
        ))}
      </section>

      {starter && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Card className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
                Subscription
              </p>
              <h2 className="mt-2 font-display text-3xl">{starter.name}</h2>
              <p className="mt-2 max-w-lg text-sm text-muted">{starter.description}</p>
              <p className="mt-3 text-sm tabular-nums text-muted">
                {formatInr(starter.price_paise)} / month · {starter.calories_per_day} kcal / day
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/subscribe">See all plans</Link>
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
