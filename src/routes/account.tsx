import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DELIVERY_AREAS, findArea } from "@/lib/kitchen/geo";
import { formatInr, todayIsoDate } from "@/lib/kitchen/format";
import { ORDER_STATUS_LABEL } from "@/lib/kitchen/status";
import {
  cancelMySubscription,
  getMyProfile,
  getMySubscription,
  listMyOrders,
  resumeSubscription,
  saveMySubscriptionDates,
  saveMyProfile,
  scheduleSubscriptionPause,
} from "@/lib/kitchen/server";
import { THEMES, isThemeId } from "@/lib/kitchen/theme";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const { theme, setTheme } = useTheme();
  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
    enabled: !!user,
  });
  const subQ = useQuery({
    queryKey: ["mysub"],
    queryFn: () => getMySubscription(),
    enabled: !!user,
  });
  const ordersQ = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(),
    enabled: !!user,
    refetchInterval: 10_000,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState(DELIVERY_AREAS[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");
  const [subscriptionAction, setSubscriptionAction] = useState<
    "dates" | "pause" | "resume" | "cancel" | null
  >(null);

  useEffect(() => {
    const p = profileQ.data;
    if (!p) return;
    setName(p.display_name ?? "");
    setPhone(p.phone ?? "");
    setAddress(p.address_line ?? "");
    const match = DELIVERY_AREAS.find((a) => a.name === p.area);
    if (match) setAreaId(match.id);
    if (isThemeId(p.theme)) setTheme(p.theme);
  }, [profileQ.data]);

  useEffect(() => {
    const subscription = subQ.data;
    if (!subscription) return;
    setStartDate(subscription.start_date);
    setEndDate(subscription.end_date);
    setPauseFrom(subscription.pause_from ?? "");
    setPauseTo(subscription.pause_to ?? "");
  }, [subQ.data]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const area = findArea(areaId) ?? DELIVERY_AREAS[0];
  const sub = subQ.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-4xl">Your table</h1>
        <p className="mt-1 text-sm text-muted">{user.primaryEmail ?? user.displayName}</p>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-xl">Manage your subscription</h2>
        {sub?.plan ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{sub.plan.name}</p>
              <span className="rounded-full bg-fg/6 px-3 py-1 text-xs font-medium capitalize">
                {sub.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted">
              {formatInr(sub.plan.price_paise)} · {sub.plan.calories_per_day} kcal / day
            </p>
            {sub.status === "pending_payment" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted" role="status">
                  {sub.payment_ref
                    ? "Payment reference submitted; your plan will activate after the kitchen verifies the payment."
                    : "Payment has not been submitted. Pause and date management will be available after payment is verified. Return to the "}
                  {!sub.payment_ref && (
                    <>
                      <Link to="/subscribe" className="underline-offset-4 hover:underline">
                        subscription page
                      </Link>{" "}
                      to choose a plan and continue.
                    </>
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={subscriptionAction !== null}
                  onClick={() => void cancelSubscription(sub.id)}
                >
                  {subscriptionAction === "cancel" ? "Cancelling…" : "Cancel subscription"}
                </Button>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setSubscriptionAction("dates");
                    try {
                      await saveMySubscriptionDates({
                        data: { start_date: startDate, end_date: endDate },
                      });
                      toast("Subscription dates saved");
                      await subQ.refetch();
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Could not update subscription dates",
                      );
                    } finally {
                      setSubscriptionAction(null);
                    }
                  }}
                >
                  <h3 className="text-sm font-semibold">Subscription dates</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="subscription-start">Start date</Label>
                      <Input
                        id="subscription-start"
                        type="date"
                        max={todayIsoDate()}
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subscription-end">End date</Label>
                      <Input
                        id="subscription-end"
                        type="date"
                        min={todayIsoDate()}
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="outline" disabled={subscriptionAction !== null}>
                    {subscriptionAction === "dates" ? "Saving dates…" : "Save dates"}
                  </Button>
                </form>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Pause subscription</h3>
                  {sub.pause_from && sub.pause_to ? (
                    <p className="mt-1 text-sm text-muted" role="status">
                      {sub.status === "paused" ? "Your subscription is paused" : "Pause scheduled"}{" "}
                      · {formatSubscriptionDate(sub.pause_from)} –{" "}
                      {formatSubscriptionDate(sub.pause_to)}
                    </p>
                  ) : sub.status === "paused" ? (
                    <p className="mt-1 text-sm text-muted" role="status">
                      Your subscription is paused.
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">
                      Choose the dates to pause deliveries. Starting today pauses the plan
                      immediately; your end date extends by the paused days.
                    </p>
                  )}
                  <form
                    className="mt-3 space-y-3"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setSubscriptionAction("pause");
                      try {
                        await scheduleSubscriptionPause({
                          data: { pause_from: pauseFrom, pause_to: pauseTo },
                        });
                        toast("Pause dates saved");
                        await subQ.refetch();
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Could not schedule subscription pause",
                        );
                      } finally {
                        setSubscriptionAction(null);
                      }
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="pause-from">Pause from</Label>
                        <Input
                          id="pause-from"
                          type="date"
                          min={todayIsoDate()}
                          max={endDate}
                          value={pauseFrom}
                          onChange={(event) => setPauseFrom(event.target.value)}
                          disabled={subscriptionAction !== null || sub.status === "paused"}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pause-to">Pause through</Label>
                        <Input
                          id="pause-to"
                          type="date"
                          min={pauseFrom || todayIsoDate()}
                          max={endDate}
                          value={pauseTo}
                          onChange={(event) => setPauseTo(event.target.value)}
                          disabled={subscriptionAction !== null || sub.status === "paused"}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        disabled={subscriptionAction !== null || sub.status === "paused"}
                      >
                        {subscriptionAction === "pause"
                          ? "Saving pause…"
                          : pauseFrom === todayIsoDate()
                            ? "Pause subscription"
                            : "Schedule subscription pause"}
                      </Button>
                      {(sub.status === "paused" || sub.pause_from) && (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={subscriptionAction !== null}
                          onClick={async () => {
                            setSubscriptionAction("resume");
                            try {
                              await resumeSubscription();
                              toast("Subscription resumed");
                              setPauseFrom("");
                              setPauseTo("");
                              await subQ.refetch();
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Could not resume subscription",
                              );
                            } finally {
                              setSubscriptionAction(null);
                            }
                          }}
                        >
                          {subscriptionAction === "resume" ? "Resuming…" : "Resume subscription"}
                        </Button>
                      )}
                    </div>
                  </form>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    disabled={subscriptionAction !== null}
                    onClick={() => void cancelSubscription(sub.id)}
                  >
                    {subscriptionAction === "cancel" ? "Cancelling…" : "Cancel subscription"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No active plan.{" "}
            <Link to="/subscribe" className="font-medium underline-offset-4 hover:underline">
              Browse Grove memberships
            </Link>
            .
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-xl">Theme</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`rounded-md px-3 py-3 text-left text-sm ${
                theme === t.id ? "bg-primary text-primary-fg" : "bg-fg/6"
              }`}
            >
              <span className="block font-medium">{t.name}</span>
              <span className="block text-xs opacity-80">{t.note}</span>
            </button>
          ))}
        </div>
      </Card>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await saveMyProfile({
              data: {
                display_name: name,
                phone,
                address_line: address,
                area: area.name,
                city: area.city,
                pincode: area.pincode,
                lat: area.lat,
                lng: area.lng,
                theme,
              },
            });
            toast("Address saved");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save");
          }
        }}
      >
        <Card className="space-y-4 p-5">
          <h2 className="font-display text-xl">Delivery details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="an">Name</Label>
            <Input id="an" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap">Phone</Label>
            <Input id="ap" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aa">House / street</Label>
            <Input id="aa" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ar">Neighbourhood</Label>
            <select
              id="ar"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="flex h-11 w-full rounded-md bg-elevated px-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)]"
            >
              {DELIVERY_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Save</Button>
        </Card>
      </form>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent orders</h2>
          <Link to="/orders" className="text-sm underline-offset-4 hover:underline">
            All
          </Link>
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {(ordersQ.data ?? []).slice(0, 5).map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Order {o.id} · {formatInr(o.total_paise)} · {ORDER_STATUS_LABEL[o.status]}
              </span>
              <a href={`/orders/${o.id}`} className={buttonVariants({ size: "sm" })}>
                View order
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  async function cancelSubscription(subscriptionId: number) {
    if (!window.confirm("Cancel this subscription? This will stop future deliveries.")) return;
    setSubscriptionAction("cancel");
    try {
      await cancelMySubscription({ data: subscriptionId });
      toast("Subscription cancelled");
      await subQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel subscription");
    } finally {
      setSubscriptionAction(null);
    }
  }
}

function formatSubscriptionDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}
