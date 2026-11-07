import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DELIVERY_AREAS, findArea } from "@/lib/kitchen/geo";
import { formatInr } from "@/lib/kitchen/format";
import {
  getMyProfile,
  getMySubscription,
  listMyOrders,
  pauseSubscription,
  saveMyProfile,
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
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState(DELIVERY_AREAS[0].id);

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
        <h2 className="font-display text-xl">Subscription</h2>
        {sub?.plan ? (
          <div className="mt-3 space-y-2">
            <p className="font-medium">{sub.plan.name}</p>
            <p className="text-sm text-muted">
              {formatInr(sub.plan.price_paise)} · {sub.plan.calories_per_day} kcal / day
            </p>
            {sub.status === "pending_payment" ? (
              <p className="text-sm text-muted" role="status">
                {sub.payment_ref
                  ? "Payment reference submitted; your plan will activate after the kitchen verifies the payment."
                  : "Payment has not been submitted. Return to the "}
                {!sub.payment_ref && (
                  <>
                    <Link to="/subscribe" className="underline-offset-4 hover:underline">
                      subscription page
                    </Link>{" "}
                    to choose a plan and continue.
                  </>
                )}
              </p>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  await pauseSubscription();
                  toast("Subscription paused");
                  void subQ.refetch();
                }}
              >
                Pause plan
              </Button>
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
            <li key={o.id}>
              <Link
                to="/orders/$id"
                params={{ id: String(o.id) }}
                className="underline-offset-4 hover:underline"
              >
                Order {o.id} · {formatInr(o.total_paise)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
