import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Card } from "@/components/ui/card";
import { UpiPay } from "@/components/upi-pay";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { getKitchen, listMyOrders } from "@/lib/kitchen/server";
import { ORDER_STATUS_LABEL } from "@/lib/kitchen/status";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, isPending } = useCurrentUserState();
  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(),
    enabled: !!user,
    refetchInterval: 10_000,
  });
  const pendingOrders = (q.data ?? []).some((order) => order.status === "pending_payment");
  const kitchenQ = useQuery({
    queryKey: ["kitchen"],
    queryFn: () => getKitchen(),
    enabled: !!user && pendingOrders,
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Your orders</h1>
      {q.isError && (
        <p className="mt-4 text-sm text-primary" role="alert">
          Could not load your orders. Please refresh the page to try again.
        </p>
      )}
      {kitchenQ.isError && pendingOrders && (
        <p className="mt-4 text-sm text-primary" role="alert">
          Could not load UPI payment details. Please refresh the page to try again.
        </p>
      )}
      <ul className="mt-6 space-y-3">
        {(q.data ?? []).map((order) => (
          <li key={order.id}>
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">Order {orderCode(order.id)}</h2>
                  <span className="mt-1 inline-flex rounded-full bg-fg/6 px-2.5 py-1 text-xs font-medium">
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className="text-lg font-semibold tabular-nums">{formatInr(order.total_paise)}</p>
              </div>
              <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Order date</dt>
                  <dd className="mt-0.5 font-medium">
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(order.created_at))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Customer</dt>
                  <dd className="mt-0.5 font-medium">{order.delivery_name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Customer mobile</dt>
                  <dd className="mt-0.5 font-medium">{order.delivery_phone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted">Customer address</dt>
                  <dd className="mt-0.5 font-medium">
                    {order.delivery_address}, {order.delivery_area}
                  </dd>
                </div>
              </dl>
              <div className="border-t border-border pt-4">
                <h3 className="font-medium">Items</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span>
                        {item.qty} × {item.name}
                      </span>
                      <span className="tabular-nums">
                        {formatInr(item.unit_price_paise * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {order.payment_ref && (
                <p className="border-t border-border pt-4 text-sm">
                  <span className="text-muted">UPI ref </span>
                  <span className="font-medium tabular-nums">{order.payment_ref}</span>
                </p>
              )}
              {order.status === "pending_payment" && kitchenQ.data && (
                <UpiPay
                  order={order}
                  kitchen={kitchenQ.data}
                  onPaid={() => {
                    void q.refetch();
                  }}
                />
              )}
            </Card>
          </li>
        ))}
      </ul>
      {q.data?.length === 0 && !q.isError && (
        <p className="mt-6 text-muted">
          No orders yet.{" "}
          <Link to="/menu" className="font-medium underline-offset-4 hover:underline">
            Start from the board
          </Link>
          .
        </p>
      )}
    </div>
  );
}
