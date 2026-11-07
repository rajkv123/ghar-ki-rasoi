import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { listKitchenOrders, updateOrderStatus } from "@/lib/kitchen/server";
import { KITCHEN_NEXT, KITCHEN_NEXT_LABEL, ORDER_STATUS_LABEL } from "@/lib/kitchen/status";

export const Route = createFileRoute("/kitchen/orders")({
  component: KitchenOrdersPage,
});

function KitchenOrdersPage() {
  const q = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => listKitchenOrders({ data: {} }),
    refetchInterval: 12_000,
  });

  return (
    <div>
      <h2 className="font-display text-2xl">Orders</h2>
      <ul className="mt-4 space-y-3">
        {(q.data ?? []).map((order) => {
          const next = KITCHEN_NEXT[order.status];
          return (
            <li key={order.id}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {orderCode(order.id)} · {ORDER_STATUS_LABEL[order.status]}
                    </p>
                    <p className="text-sm text-muted">
                      {order.delivery_name} · {order.delivery_phone}
                    </p>
                    <p className="text-sm text-muted">
                      {order.delivery_address}, {order.delivery_area}
                    </p>
                  </div>
                  <p className="tabular-nums">{formatInr(order.total_paise)}</p>
                </div>
                <ul className="text-sm text-muted">
                  {order.items.map((i) => (
                    <li key={i.id}>
                      {i.qty} × {i.name}
                    </li>
                  ))}
                </ul>
                {order.payment_ref && (
                  <p className="text-xs tabular-nums text-subtle">
                    UPI ref {order.payment_ref}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {next && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await updateOrderStatus({ data: { id: order.id, status: next } });
                        toast(KITCHEN_NEXT_LABEL[order.status] ?? "Updated");
                        void q.refetch();
                      }}
                    >
                      {KITCHEN_NEXT_LABEL[order.status]}
                    </Button>
                  )}
                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updateOrderStatus({
                          data: { id: order.id, status: "cancelled" },
                        });
                        void q.refetch();
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
