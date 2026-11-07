import { useEffect, useMemo, useRef, useState } from "react";
import { Bike, Home, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatKm } from "@/lib/kitchen/format";
import { interpolate, rideMinutes } from "@/lib/kitchen/geo";
import { ORDER_STATUS_LABEL } from "@/lib/kitchen/status";
import type { KitchenPublic, Order } from "@/lib/kitchen/types";

function progressOf(order: Order): number {
  if (order.status === "delivered") return 1;
  if (order.status === "cancelled") return 0;
  if (order.status !== "out_for_delivery" || !order.dispatched_at) {
    if (order.status === "preparing") return 0.08;
    if (order.status === "paid") return 0.04;
    return 0;
  }
  const start = new Date(order.dispatched_at).getTime();
  const rideMs = Math.max(8, rideMinutes(order.distance_km)) * 60 * 1000;
  return Math.min(0.96, Math.max(0.12, (Date.now() - start) / rideMs));
}

const STEPS: Order["status"][] = [
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function DeliveryTrack({
  order,
  kitchen,
}: {
  order: Order;
  kitchen: KitchenPublic;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (order.status !== "out_for_delivery") return;
    const t = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(t);
  }, [order.status]);

  const progress = useMemo(() => {
    void now;
    return progressOf(order);
  }, [order, now]);

  const rider = interpolate(
    { lat: kitchen.lat, lng: kitchen.lng },
    { lat: order.delivery_lat, lng: order.delivery_lng },
    progress,
  );

  const remaining =
    order.status === "delivered"
      ? 0
      : order.status === "out_for_delivery"
        ? Math.max(1, Math.round((1 - progress) * rideMinutes(order.distance_km)))
        : order.eta_minutes;

  const pathRef = useRef<SVGPathElement>(null);
  const [dot, setDot] = useState({ x: 48, y: 210 });
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const p = path.getPointAtLength(len * progress);
    setDot({ x: p.x, y: p.y });
  }, [progress]);

  const d = 0.03;
  const minLat = Math.min(kitchen.lat, order.delivery_lat) - d;
  const maxLat = Math.max(kitchen.lat, order.delivery_lat) + d;
  const minLng = Math.min(kitchen.lng, order.delivery_lng) - d;
  const maxLng = Math.max(kitchen.lng, order.delivery_lng) + d;
  const osm = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${rider.lat}%2C${rider.lng}`;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Delivery trail
            </p>
            <h2 className="mt-1 font-display text-2xl">
              {ORDER_STATUS_LABEL[order.status]}
            </h2>
          </div>
          <p className="text-sm tabular-nums text-muted">
            {order.status === "delivered"
              ? "At your door"
              : `About ${remaining} min · ${formatKm(order.distance_km)}`}
          </p>
        </div>

        <ol className="mt-5 grid grid-cols-4 gap-2">
          {STEPS.map((step, i) => {
            const current = STEPS.indexOf(
              order.status === "pending_payment" ? "paid" : order.status,
            );
            const on = current >= i;
            return (
              <li key={step} className="text-center">
                <div
                  className={
                    on
                      ? "mx-auto h-1 rounded-full bg-primary"
                      : "mx-auto h-1 rounded-full bg-fg/10"
                  }
                />
                <p className="mt-2 text-[11px] text-muted">
                  {step === "paid"
                    ? "Paid"
                    : step === "preparing"
                      ? "Kitchen"
                      : step === "out_for_delivery"
                        ? "Riding"
                        : "Door"}
                </p>
              </li>
            );
          })}
        </ol>

        <div className="relative mt-5 overflow-hidden rounded-lg bg-elevated">
          <svg viewBox="0 0 400 240" className="block w-full" aria-hidden>
            <rect width="400" height="240" fill="var(--tg-elevated)" />
            {[40, 80, 120, 160, 200].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="400"
                y2={y}
                stroke="var(--tg-border)"
                strokeWidth="1"
              />
            ))}
            {[50, 100, 150, 200, 250, 300, 350].map((x) => (
              <line
                key={x}
                x1={x}
                y1="0"
                x2={x}
                y2="240"
                stroke="var(--tg-border)"
                strokeWidth="1"
              />
            ))}
            <path
              ref={pathRef}
              d="M48 188 C 110 60, 250 40, 352 72"
              fill="none"
              stroke="var(--tg-primary)"
              strokeWidth="3"
              strokeDasharray="6 7"
              strokeLinecap="round"
            />
            <circle cx="48" cy="188" r="8" fill="var(--tg-accent)" />
            <circle cx="352" cy="72" r="8" fill="var(--tg-primary)" />
            <circle cx={dot.x} cy={dot.y} r="10" fill="var(--tg-fg)" />
            <circle cx={dot.x} cy={dot.y} r="4" fill="var(--tg-bg)" />
          </svg>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between p-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-bg/90 px-2 py-1">
              <Home className="size-3.5" />
              Kitchen
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg/90 px-2 py-1">
              <Bike className="size-3.5" />
              Rider
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-bg/90 px-2 py-1">
              <MapPin className="size-3.5" />
              {order.delivery_area}
            </span>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted">
          From {kitchen.address_line}, {kitchen.city} to {order.delivery_address}.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <iframe
          title="Live map from kitchen to your pin"
          src={osm}
          className="h-64 w-full border-0"
        />
      </Card>
    </div>
  );
}
