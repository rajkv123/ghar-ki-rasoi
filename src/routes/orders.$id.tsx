import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DeliveryTrack } from "@/components/delivery-track";
import { UpiPay } from "@/components/upi-pay";
import { CalorieMeter } from "@/components/calorie-meter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RedirectToSignIn } from "@/lib/auth/gates";
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
      return status === "out_for_delivery" || status === "preparing" ? 8000 : false;
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
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
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {orderCode(order.id)}
        </p>
        <h1 className="mt-1 font-display text-4xl">{ORDER_STATUS_LABEL[order.status]}</h1>
        <p className="mt-1 text-sm text-muted tabular-nums">
          {formatInr(order.total_paise)} · {order.eta_minutes} min window
        </p>
      </div>

      {order.status === "pending_payment" && (
        <UpiPay
          order={order}
          kitchen={kitchen}
          onPaid={() => {
            void q.refetch();
          }}
        />
      )}

      {order.status !== "pending_payment" && order.status !== "cancelled" && (
        <DeliveryTrack order={order} kitchen={kitchen} />
      )}

      <Card className="p-5">
        <h2 className="font-display text-xl">Plate</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.qty} × {item.name}
              </span>
              <span className="tabular-nums">{formatInr(item.unit_price_paise * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
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
