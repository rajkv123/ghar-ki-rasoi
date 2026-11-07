import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatInr } from "@/lib/kitchen/format";
import { getPlans, startSubscription } from "@/lib/kitchen/server";
import { useState } from "react";

const MEAL_OPTIONS = [
  { slug: "solo-lunch", label: "Solo Lunch Grove" },
  { slug: "solo-dinner", label: "Solo Dinner Grove" },
  { slug: "lunch-dinner", label: "Lunch & Dinner" },
] as const;

export const Route = createFileRoute("/subscribe")({
  loader: async () => ({ plans: await getPlans() }),
  component: SubscribePage,
});

function SubscribePage() {
  const { plans } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<number | null>(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");

  if (needAuth) return <RedirectToSignIn />;

  const plansBySlug = new Map(plans.map((plan) => [plan.slug, plan]));

  async function subscribe(planId: number) {
    if (!user) {
      setNeedAuth(true);
      return;
    }
    setBusy(planId);
    try {
      await startSubscription({ data: planId });
      toast("Subscription started");
      void navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Meal subscriptions
      </p>
      <h1 className="mt-2 font-display text-4xl">Choose your weekly meals</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Choose vegetarian or non-vegetarian meals, then select your meal time
        and portion. Every plan includes 5 meals per week.
      </p>
      <div className="mt-8 flex gap-2" role="tablist" aria-label="Meal preference">
        {(["veg", "non-veg"] as const).map((option) => (
          <button
            key={option}
            id={`diet-tab-${option}`}
            type="button"
            role="tab"
            aria-selected={diet === option}
            aria-controls="subscription-options"
            onClick={() => setDiet(option)}
            className={`min-h-11 rounded-full px-5 text-sm font-medium ${
              diet === option
                ? "bg-primary text-primary-fg"
                : "bg-fg/6 text-muted hover:bg-fg/10"
            }`}
          >
            {option === "veg" ? "Veg" : "Non-veg"}
          </button>
        ))}
      </div>
      <div
        id="subscription-options"
        role="tabpanel"
        aria-labelledby={`diet-tab-${diet}`}
        className="mt-5 grid gap-5 md:grid-cols-3"
      >
        {MEAL_OPTIONS.map((option) => {
          const mini = plansBySlug.get(`${diet}-${option.slug}-mini`);
          const full = plansBySlug.get(`${diet}-${option.slug}-full`);

          return (
            <Card key={option.slug} className="flex flex-col p-5 sm:p-6">
              <h2 className="font-display text-2xl">{option.label}</h2>
              <p className="mt-2 text-sm text-muted">
                {option.slug === "lunch-dinner"
                  ? "5 lunches + 5 dinners per week"
                  : "5 meals per week"}
                {" · average monthly pricing"}
              </p>
              <div className="mt-5 grid gap-3">
                {[
                  { plan: mini, size: "Mini Meal" },
                  { plan: full, size: "Full Meal" },
                ].map(({ plan, size }) =>
                  plan ? (
                    <div
                      key={plan.id}
                      className="rounded-lg border border-border bg-bg/50 p-4"
                    >
                      <p className="text-sm font-medium">{size}</p>
                      <p className="mt-1 text-sm text-muted">
                        {formatInr(plan.per_meal_price_paise)} per meal
                      </p>
                      <p className="mt-2 font-display text-2xl tabular-nums">
                        {formatInr(plan.price_paise)}
                        <span className="text-sm font-sans text-muted"> / month</span>
                      </p>
                      <Button
                        className="mt-3 w-full"
                        disabled={busy === plan.id || isPending}
                        onClick={() => void subscribe(plan.id)}
                      >
                        {busy === plan.id ? "Starting…" : `Choose ${size.toLowerCase()}`}
                      </Button>
                    </div>
                  ) : null,
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-5 text-sm text-muted">
        Monthly price is calculated as 5 meals × 52 weeks ÷ 12 months, rounded
        to the nearest paise.
      </p>
      <p className="mt-8 text-sm text-muted">
        Pay the first month by UPI after you start — we will raise a Grove order
        from <Link to="/account" className="underline-offset-4 hover:underline">your account</Link>.
      </p>
    </div>
  );
}
