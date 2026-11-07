import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatInr } from "@/lib/kitchen/format";
import {
  createPendingSubscription,
  getKitchen,
  getPlans,
  submitSubscriptionPayment,
} from "@/lib/kitchen/server";
import { genericUpiUri } from "@/lib/kitchen/upi";
import type { Plan } from "@/lib/kitchen/types";

const MEAL_OPTIONS = [
  { slug: "solo-lunch", label: "Solo Lunch Grove" },
  { slug: "solo-dinner", label: "Solo Dinner Grove" },
  { slug: "lunch-dinner", label: "Lunch & Dinner" },
] as const;

export const Route = createFileRoute("/subscribe")({
  loader: async () => ({
    plans: await getPlans(),
    kitchen: await getKitchen(),
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { plans, kitchen } = Route.useLoaderData();
  const { user } = useCurrentUserState();
  const [busy, setBusy] = useState<number | null>(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [payment, setPayment] = useState<{
    plan: Plan;
    subscriptionId: number;
  } | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittingRef, setSubmittingRef] = useState(false);
  const [qrSvg, setQrSvg] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  const paymentUri = useMemo(() => {
    if (!payment) return "";
    return genericUpiUri({
      vpa: kitchen.subscription_upi_vpa,
      name: kitchen.subscription_upi_name,
      paise: payment.plan.price_paise,
      note: `Gharaunda Rasoi ${payment.plan.name}`,
      tr: `GR-SUB-${payment.subscriptionId}`,
    });
  }, [kitchen.subscription_upi_name, kitchen.subscription_upi_vpa, payment]);

  useEffect(() => {
    if (!paymentUri) {
      setQrSvg("");
      setQrError(null);
      return;
    }
    let cancelled = false;
    setQrError(null);
    void import("qrcode")
      .then(async (QR) => {
        const svg = await QR.toString(paymentUri, {
          type: "svg",
          margin: 2,
          width: 280,
          color: { dark: "#1c1410", light: "#ffffff" },
        });
        if (!cancelled) setQrSvg(svg);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setQrError(err instanceof Error ? err.message : "Could not generate the payment QR");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [paymentUri]);

  if (needAuth) return <RedirectToSignIn />;

  const plansBySlug = new Map(plans.map((plan) => [plan.slug, plan]));

  async function subscribe(plan: Plan) {
    if (!user) {
      setNeedAuth(true);
      return;
    }
    setBusy(plan.id);
    try {
      const result = await createPendingSubscription({ data: plan.id });
      setPayment({ plan, subscriptionId: result.id });
      setPaymentRef("");
      setSubmitted(false);
      setQrSvg("");
      setQrError(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start subscription");
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
        Choose vegetarian or non-vegetarian meals, then select your meal time and portion. Every
        plan includes 5 meals per week.
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
              diet === option ? "bg-primary text-primary-fg" : "bg-fg/6 text-muted hover:bg-fg/10"
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
                    <div key={plan.id} className="rounded-lg border border-border bg-bg/50 p-4">
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
                        disabled={busy === plan.id}
                        onClick={() => void subscribe(plan)}
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
        Monthly price is calculated as 5 meals × 52 weeks ÷ 12 months, rounded to the nearest paise.
      </p>
      <Card className="mt-5 p-5">
        <h2 className="font-display text-xl">Delivery, billed separately</h2>
        <p className="mt-2 text-sm text-muted">
          Delivery is charged at actual cost (₹30–₹70), depending on distance and peak-hour
          surcharges. Delivered by third-party couriers such as Porter, Dunzo, or Swiggy Genie.
        </p>
      </Card>
      <p className="mt-8 text-sm text-muted">
        Manage your plan from{" "}
        <Link to="/account" className="underline-offset-4 hover:underline">
          your account
        </Link>
        .
      </p>
      {payment && (
        <Card className="mt-8 max-w-xl space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Subscription payment
            </p>
            <h2 className="mt-1 font-display text-2xl">{payment.plan.name}</h2>
            <p className="mt-1 text-lg font-medium tabular-nums">
              {formatInr(payment.plan.price_paise)} for one month
            </p>
          </div>
          {submitted ? (
            <p className="text-sm text-muted" role="status">
              UPI reference submitted. Your plan will activate after the kitchen verifies the
              payment.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Scan this QR in your UPI app. The selected subscription amount is included.
              </p>
              {qrError ? (
                <p className="text-sm text-primary" role="alert">
                  Could not generate the payment QR: {qrError}
                </p>
              ) : (
                <div
                  className="mx-auto size-64 rounded-lg bg-white p-2 [&_svg]:size-full"
                  role="img"
                  aria-label={`UPI QR code for ${formatInr(payment.plan.price_paise)}`}
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              )}
              <form
                className="space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSubmittingRef(true);
                  try {
                    await submitSubscriptionPayment({
                      data: {
                        subscriptionId: payment.subscriptionId,
                        payment_ref: paymentRef,
                      },
                    });
                    setSubmitted(true);
                    toast("Payment reference sent for verification");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Could not submit payment reference",
                    );
                  } finally {
                    setSubmittingRef(false);
                  }
                }}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="subscription-utr">UPI reference / UTR</Label>
                  <Input
                    id="subscription-utr"
                    value={paymentRef}
                    onChange={(event) => setPaymentRef(event.target.value)}
                    placeholder="Enter the payment reference"
                    minLength={6}
                    maxLength={100}
                    required
                  />
                </div>
                <Button type="submit" disabled={submittingRef}>
                  {submittingRef ? "Submitting…" : "Submit for payment verification"}
                </Button>
              </form>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
