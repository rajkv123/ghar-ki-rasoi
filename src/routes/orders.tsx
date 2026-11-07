import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { listMyOrders } from "@/lib/kitchen/server";
import { ORDER_STATUS_LABEL } from "@/lib/kitchen/status";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

function OrdersPage() {
  const { user, isPending } = useCurrentUserState();
  const q = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(),
    enabled: !!user,
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
      <ul className="mt-6 space-y-3">
        {(q.data ?? []).map((order) => (
          <li key={order.id}>
            <Link to="/orders/$id" params={{ id: String(order.id) }}>
              <Card className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{orderCode(order.id)}</p>
                  <p className="text-sm text-muted">
                    {ORDER_STATUS_LABEL[order.status]} · {order.delivery_area}
                  </p>
                </div>
                <p className="tabular-nums">{formatInr(order.total_paise)}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {q.data?.length === 0 && (
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
