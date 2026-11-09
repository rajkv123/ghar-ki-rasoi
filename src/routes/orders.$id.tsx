import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DeliveryTrack } from "@/components/delivery-track";
import { UpiPay } from "@/components/upi-pay";
import { CalorieMeter } from "@/components/calorie-meter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { getMyOrder } from "@/lib/kitchen/server";
import { ORDER_STATUS_LABEL } from "@/lib/kitchen/status";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const { user, isPending } = useCurrentUserState();
  const q = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getMyOrder({ data: orderId }),
    enabled: !!user && Number.isFinite(orderId),
    refetchInterval: (query) => {
      const { status, payment_ref } = query.state.data?.order ?? {};
      if (status === "pending_payment" && payment_ref) return 8000;
      return status === "paid" || status === "preparing" || status === "out_for_delivery"
        ? 8000
        : false;
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" search={{ redirectTo: `/orders/${id}` }} />;
  }
  if (q.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p>That order is not on your table.</p>
      </div>
    );
  }
  if (!q.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { order, kitchen } = q.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      {order.status === "pending_payment" && (
        <UpiPay
          order={order}
          kitchen={kitchen}
          onPaid={() => {
            void q.refetch();
          }}
        />
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Order {orderCode(order.id)}</h1>
            <p className="mt-1 text-sm text-muted">Order status</p>
          </div>
          <span className="rounded-full bg-fg/6 px-3 py-1.5 text-sm font-medium">
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
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
          <div>
            <dt className="text-muted">Customer address</dt>
            <dd className="mt-0.5 font-medium">
              {order.delivery_address}, {order.delivery_area}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold">
            <dt>Order amount</dt>
            <dd className="tabular-nums">{formatInr(order.total_paise)}</dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-border pt-4">
          <h2 className="font-display text-lg">Items</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.qty} × {item.name}
                </span>
                <span className="tabular-nums">{formatInr(item.unit_price_paise * item.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
        {order.payment_ref && (
          <p className="mt-4 border-t border-border pt-4 text-sm">
            <span className="text-muted">UPI ref </span>
            <span className="font-medium tabular-nums">{order.payment_ref}</span>
          </p>
        )}
        {order.status !== "pending_payment" && order.status !== "cancelled" && (
          <div className="mt-5 border-t border-border pt-4">
            <DeliveryTrack order={order} kitchen={kitchen} />
          </div>
        )}
        <details className="mt-5 border-t border-border pt-4 text-sm">
          <summary className="cursor-pointer font-medium">Amount breakdown</summary>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatInr(order.subtotal_paise)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Delivery</dt>
              <dd className="tabular-nums">{formatInr(order.delivery_fee_paise)}</dd>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Discount</dt>
                <dd className="tabular-nums">−{formatInr(order.discount_paise)}</dd>
              </div>
            )}
          </dl>
        </details>
        <div className="mt-5 border-t border-border pt-4">
          <CalorieMeter
            macros={{
              calories: order.total_calories,
              protein_g: order.total_protein_g,
              carbs_g: order.total_carbs_g,
              fat_g: order.total_fat_g,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
