import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatInr } from "@/lib/kitchen/format";
import { getKitchenStats, listKitchenOrders } from "@/lib/kitchen/server";

export const Route = createFileRoute("/kitchen/")({
  component: KitchenHome,
});

function KitchenHome() {
  const stats = useQuery({
    queryKey: ["kitchen-stats"],
    queryFn: () => getKitchenStats(),
  });
  const orders = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => listKitchenOrders({ data: {} }),
  });
  const s = stats.data;
  const live = (orders.data ?? []).filter((o) =>
    ["paid", "preparing", "out_for_delivery"].includes(o.status),
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Orders today", v: s?.ordersToday ?? "—" },
          { k: "In the kitchen", v: s?.pendingKitchen ?? "—" },
          { k: "Active subscribers", v: s?.activeSubscribers ?? "—" },
          { k: "Collected today", v: s ? formatInr(s.revenueTodayPaise) : "—" },
        ].map((tile) => (
          <Card key={tile.k} className="p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{tile.k}</p>
            <p className="mt-2 font-display text-3xl tabular-nums">{tile.v}</p>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted">
        Live menu items: {s?.liveMenu ?? "—"}. This desk is sized for 1,000–2,000
        households — keep the daily board tight, ride radius honest.
      </p>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Live tickets</h2>
          <Link to="/kitchen/orders" className="text-sm underline-offset-4 hover:underline">
            All orders
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {live.slice(0, 8).map((o) => (
            <li key={o.id}>
              <Card className="flex items-center justify-between p-3 text-sm">
                <span>
                  #{o.id} · {o.delivery_area} · {o.status.replaceAll("_", " ")}
                </span>
                <span className="tabular-nums">{formatInr(o.total_paise)}</span>
              </Card>
            </li>
          ))}
          {live.length === 0 && (
            <p className="text-sm text-muted">No live tickets. The hearth is quiet.</p>
          )}
        </ul>
      </div>
    </div>
  );
}
