import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalorieMeter } from "@/components/calorie-meter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cartMacros, cartSubtotal, useCart } from "@/lib/cart";
import {
  DELIVERY_AREAS,
  deliveryFeePaise,
  findArea,
  haversineKm,
  rideMinutes,
} from "@/lib/kitchen/geo";
import { formatInr, formatKm } from "@/lib/kitchen/format";
import { getKitchen, getMyProfile, placeOrder } from "@/lib/kitchen/server";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/checkout")({
  loader: async () => ({ kitchen: await getKitchen() }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { kitchen } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState(DELIVERY_AREAS[0].id);
  const [busy, setBusy] = useState(false);
  const area = findArea(areaId) ?? DELIVERY_AREAS[0];

  useEffect(() => {
    if (!user) return;
    void getMyProfile()
      .then((p) => {
        if (!p) return;
        if (p.display_name) setName(p.display_name);
        if (p.phone) setPhone(p.phone);
        if (p.address_line) setAddress(p.address_line);
        if (p.area) {
          const match = DELIVERY_AREAS.find((a) => a.name === p.area);
          if (match) setAreaId(match.id);
        }
      })
      .catch(() => undefined);
  }, [user]);

  const distance = haversineKm(
    { lat: kitchen.lat, lng: kitchen.lng },
    { lat: area.lat, lng: area.lng },
  );
  const fee = deliveryFeePaise(distance);
  const eta = kitchen.avg_prep_minutes + rideMinutes(distance);
  const macros = cartMacros(lines);
  const subtotal = cartSubtotal(lines);
  const total = subtotal + fee;
  const inRange = distance <= kitchen.delivery_radius_km + 0.4;

  const osm = useMemo(() => {
    const d = 0.025;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${area.lng - d}%2C${area.lat - d}%2C${area.lng + d}%2C${area.lat + d}&layer=mapnik&marker=${area.lat}%2C${area.lng}`;
  }, [area]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-muted">
          Meals leave Gharaunda Rasoi · 560068. Pin a neighbourhood we ride to.
        </p>
        {lines.length === 0 ? (
          <p className="mt-6">
            Nothing to check out.{" "}
            <Link to="/menu" className="font-medium underline-offset-4 hover:underline">
              Add dishes
            </Link>
            .
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inRange) return;
              setBusy(true);
              try {
                const order = await placeOrder({
                  data: {
                    lines: lines.map((l) => ({
                      menuItemId: l.item.id,
                      qty: l.qty,
                    })),
                    delivery_name: name,
                    delivery_phone: phone,
                    delivery_address: address,
                    delivery_area: area.name,
                    delivery_lat: area.lat,
                    delivery_lng: area.lng,
                    payment_method: "upi",
                  },
                });
                clear();
                toast("Order placed — pay with UPI");
                void navigate({ to: "/orders/$id", params: { id: String(order.id) } });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not place order");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">House / street</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area">Neighbourhood</Label>
              <select
                id="area"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="flex h-11 w-full rounded-md bg-elevated px-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)]"
              >
                {DELIVERY_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.pincode}
                  </option>
                ))}
              </select>
            </div>
            <Card className="overflow-hidden">
              <iframe title="Delivery pin" src={osm} className="h-56 w-full border-0" />
            </Card>
            <Button type="submit" disabled={busy || !inRange} className="w-full sm:w-auto">
              {busy ? "Placing…" : "Place order"}
            </Button>
          </form>
        )}
      </div>
      <aside>
        <Card className="sticky top-24 space-y-4 p-5">
          <h2 className="font-display text-xl">Ride & calories</h2>
          <CalorieMeter macros={macros} />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Distance</dt>
              <dd className="tabular-nums">{formatKm(distance)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">ETA</dt>
              <dd className="tabular-nums">{eta} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatInr(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">{fee === 0 ? "Free" : formatInr(fee)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>To pay</dt>
              <dd className="tabular-nums">{formatInr(total)}</dd>
            </div>
          </dl>
          {!inRange && (
            <p className="text-sm text-primary">
              This pin is outside our {kitchen.delivery_radius_km} km ride from the home kitchen.
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
