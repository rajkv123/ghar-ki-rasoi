import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import {
  confirmOrderPayment,
  confirmSubscriptionPayment,
  listKitchenOrders,
  listPendingSubscriptionPayments,
  updateOrderStatus,
} from "@/lib/kitchen/server";
import { KITCHEN_NEXT, KITCHEN_NEXT_LABEL, ORDER_STATUS_LABEL } from "@/lib/kitchen/status";

export const Route = createFileRoute("/kitchen/orders")({
  component: KitchenOrdersPage,
});

function KitchenOrdersPage() {
  const [confirmingSubscription, setConfirmingSubscription] = useState<number | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<number | null>(null);
  const [whatsappNotice, setWhatsappNotice] = useState<{
    url: string | null;
    customer: string;
    action: string;
  } | null>(null);
  const q = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: () => listKitchenOrders({ data: {} }),
    refetchInterval: 12_000,
  });
  const subscriptionPayments = useQuery({
    queryKey: ["pending-subscription-payments"],
    queryFn: () => listPendingSubscriptionPayments(),
    refetchInterval: 12_000,
  });

  return (
    <div>
      {whatsappNotice && (
        <Card className="mb-5 space-y-3 p-4" role="status">
          <p className="text-sm">
            Payment verified for {whatsappNotice.customer}. Send the confirmation from your WhatsApp
            account.
          </p>
          {whatsappNotice.url ? (
            <Button asChild size="sm">
              <a href={whatsappNotice.url} target="_blank" rel="noreferrer">
                {whatsappNotice.action}
              </a>
            </Button>
          ) : (
            <p className="text-sm text-muted">
              No valid customer phone number is saved. Ask them to add one in their account.
            </p>
          )}
        </Card>
      )}
      <section className="mb-8">
        <h2 className="font-display text-2xl">Subscription payments to verify</h2>
        <p className="mt-1 text-sm text-muted">
          Confirm only after checking that the UPI payment reached your account.
        </p>
        <ul className="mt-3 space-y-3">
          {(subscriptionPayments.data ?? []).map((payment) => (
            <li key={payment.id}>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {payment.display_name || "Subscriber"} · {payment.plan_name}
                    </p>
                    <p className="text-sm text-muted">
                      {formatInr(payment.price_paise)} · UPI ref {payment.payment_ref}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={confirmingSubscription === payment.id}
                  onClick={async () => {
                    setConfirmingSubscription(payment.id);
                    try {
                      await confirmSubscriptionPayment({ data: payment.id });
                      const digits = (payment.phone ?? "").replace(/\D/g, "");
                      const phone =
                        digits.length === 10
                          ? `91${digits}`
                          : digits.length >= 11 && digits.length <= 15
                            ? digits
                            : null;
                      const customer = payment.display_name || "subscriber";
                      const message =
                        `Thanks for subscribing to Gharaunda Rasoi's ${payment.plan_name}! ` +
                        `We have received and verified your payment of ${formatInr(payment.price_paise)}. ` +
                        "Your subscription is active. We look forward to serving you!";
                      setWhatsappNotice({
                        customer,
                        url: phone
                          ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                          : null,
                        action: "Send “Thanks for subscribing” on WhatsApp",
                      });
                      toast("Subscription payment verified");
                      void subscriptionPayments.refetch();
                    } catch (err) {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Could not confirm subscription payment",
                      );
                    } finally {
                      setConfirmingSubscription(null);
                    }
                  }}
                >
                  {confirmingSubscription === payment.id
                    ? "Verifying…"
                    : "Confirm payment received"}
                </Button>
              </Card>
            </li>
          ))}
          {subscriptionPayments.data?.length === 0 && (
            <p className="text-sm text-muted">No subscription payments awaiting verification.</p>
          )}
        </ul>
      </section>
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
                  <p className="text-xs tabular-nums text-subtle">UPI ref {order.payment_ref}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {order.status === "pending_payment" && order.payment_ref && (
                    <Button
                      size="sm"
                      disabled={confirmingOrder === order.id}
                      onClick={async () => {
                        setConfirmingOrder(order.id);
                        try {
                          await confirmOrderPayment({ data: order.id });
                          const digits = order.delivery_phone.replace(/\D/g, "");
                          const phone =
                            digits.length === 10
                              ? `91${digits}`
                              : digits.length >= 11 && digits.length <= 15
                                ? digits
                                : null;
                          const message =
                            `Thanks for your order with Gharaunda Rasoi! We have received and verified ` +
                            `your payment of ${formatInr(order.total_paise)} for ${orderCode(order.id)}. ` +
                            "We are preparing your meal.";
                          setWhatsappNotice({
                            customer: order.delivery_name,
                            url: phone
                              ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                              : null,
                            action: "Send order confirmation on WhatsApp",
                          });
                          toast("Order payment verified");
                          void q.refetch();
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Could not verify order payment",
                          );
                        } finally {
                          setConfirmingOrder(null);
                        }
                      }}
                    >
                      {confirmingOrder === order.id ? "Verifying…" : "Confirm payment received"}
                    </Button>
                  )}
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
