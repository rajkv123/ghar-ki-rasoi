import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr, orderCode, SITE_NAME } from "@/lib/kitchen/format";
import {
  confirmOrderPayment,
  confirmSubscriptionPayment,
  getKitchen,
  getKitchenRole,
  listKitchenOrders,
  listPendingSubscriptionPayments,
  updateOrderStatus,
} from "@/lib/kitchen/server";
import { KITCHEN_NEXT, KITCHEN_NEXT_LABEL, ORDER_STATUS_LABEL } from "@/lib/kitchen/status";
import { upiUri, UPI_APPS } from "@/lib/kitchen/upi";

export const Route = createFileRoute("/kitchen/orders")({
  component: KitchenOrdersPage,
});

function KitchenOrdersPage() {
  const [confirmingSubscription, setConfirmingSubscription] = useState<number | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<number | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState<
    Record<number, { name: string; phone: string; arrival: string }>
  >({});
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
  const kitchen = useQuery({ queryKey: ["kitchen"], queryFn: () => getKitchen() });
  const kitchenRole = useQuery({ queryKey: ["kitchen-role"], queryFn: () => getKitchenRole() });
  const isKitchenOwner = kitchenRole.data?.role === "owner";

  return (
    <div>
      {kitchenRole.isError && (
        <p className="mb-4 text-sm text-primary" role="alert">
          Could not verify kitchen role. WhatsApp messaging remains unavailable until your role is
          confirmed.
        </p>
      )}
      {isKitchenOwner && whatsappNotice && (
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
                      if (isKitchenOwner) {
                        setWhatsappNotice({
                          customer,
                          url: phone
                            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                            : null,
                          action: "Send “Thanks for subscribing” on WhatsApp",
                        });
                      }
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
      {kitchenRole.data?.role === "staff" && (
        <p className="mt-1 text-sm text-muted">
          WhatsApp Business messaging is available to the kitchen owner only.
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {(q.data ?? []).map((order) => {
          const next = KITCHEN_NEXT[order.status];
          const delivery = deliveryDetails[order.id] ?? { name: "", phone: "", arrival: "" };
          const orderConfirmationUrl = whatsappUrl(
            order.delivery_phone,
            `Hi ${order.delivery_name},\n\nYour order #${orderCode(order.id)} has been received.\n\n` +
              `Amount: ${formatInr(order.total_paise)}\n\nThank you for ordering from ${SITE_NAME}.`,
          );
          const paymentLink = kitchen.data
            ? upiUri(UPI_APPS.find((app) => app.id === "generic") ?? UPI_APPS[0], {
                vpa: kitchen.data.upi_vpa,
                name: kitchen.data.upi_name,
                paise: order.total_paise,
                note: `${SITE_NAME} ${orderCode(order.id)}`,
                tr: orderCode(order.id),
              })
            : null;
          const paymentUrl = paymentLink
            ? whatsappUrl(
                order.delivery_phone,
                `Hi ${order.delivery_name},\n\nPlease complete payment for Order #${orderCode(order.id)}.\n\n` +
                  `Pay Here:\n${paymentLink}`,
              )
            : null;
          const arrivalDate = delivery.arrival ? new Date(delivery.arrival) : null;
          const arrivalLabel =
            arrivalDate && !Number.isNaN(arrivalDate.getTime())
              ? new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(arrivalDate)
              : "";
          const outForDeliveryUrl =
            delivery.name.trim() && normalizeWhatsappPhone(delivery.phone) && arrivalLabel
              ? whatsappUrl(
                  order.delivery_phone,
                  `Hi ${order.delivery_name},\n\nYour order #${orderCode(order.id)} is out for delivery.\n\n` +
                    `Delivery Executive: ${delivery.name.trim()}\nPhone: ${delivery.phone.trim()}\n\n` +
                    `Expected Arrival: ${arrivalLabel}`,
                )
              : null;
          const deliveredUrl = whatsappUrl(
            order.delivery_phone,
            `Your order #${orderCode(order.id)} has been delivered.\n\nEnjoy your meal!`,
          );
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
                {isKitchenOwner && (
                  <div className="space-y-3 border-t border-border pt-3">
                    <p className="text-sm font-medium">WhatsApp Business messages</p>
                    <div className="flex flex-wrap gap-2">
                      {orderConfirmationUrl && order.status !== "cancelled" && (
                        <Button asChild size="sm" variant="outline">
                          <a href={orderConfirmationUrl} target="_blank" rel="noreferrer">
                            Send order confirmation
                          </a>
                        </Button>
                      )}
                      {order.status === "pending_payment" &&
                        (paymentUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={paymentUrl} target="_blank" rel="noreferrer">
                              Send payment link
                            </a>
                          </Button>
                        ) : (
                          <p className="self-center text-xs text-muted">
                            {kitchen.isLoading
                              ? "Loading payment details…"
                              : "Add a valid customer phone number to send the payment link."}
                          </p>
                        ))}
                    </div>
                    {order.status === "out_for_delivery" && (
                      <div className="space-y-3 rounded-md bg-fg/4 p-3">
                        <p className="text-sm text-muted">
                          Add the delivery executive and arrival details for the customer message.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label htmlFor={`driver-name-${order.id}`}>Delivery executive</Label>
                            <Input
                              id={`driver-name-${order.id}`}
                              value={delivery.name}
                              onChange={(event) =>
                                setDeliveryDetails((current) => ({
                                  ...current,
                                  [order.id]: { ...delivery, name: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`driver-phone-${order.id}`}>Executive phone</Label>
                            <Input
                              id={`driver-phone-${order.id}`}
                              type="tel"
                              value={delivery.phone}
                              onChange={(event) =>
                                setDeliveryDetails((current) => ({
                                  ...current,
                                  [order.id]: { ...delivery, phone: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`arrival-${order.id}`}>Expected arrival</Label>
                            <Input
                              id={`arrival-${order.id}`}
                              type="datetime-local"
                              value={delivery.arrival}
                              onChange={(event) =>
                                setDeliveryDetails((current) => ({
                                  ...current,
                                  [order.id]: { ...delivery, arrival: event.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                        {outForDeliveryUrl ? (
                          <Button asChild size="sm">
                            <a href={outForDeliveryUrl} target="_blank" rel="noreferrer">
                              Send out-for-delivery update
                            </a>
                          </Button>
                        ) : (
                          <p className="text-xs text-muted">
                            Enter a valid executive name, phone, and arrival time to prepare the
                            message.
                          </p>
                        )}
                      </div>
                    )}
                    {order.status === "delivered" && deliveredUrl && (
                      <Button asChild size="sm" variant="outline">
                        <a href={deliveredUrl} target="_blank" rel="noreferrer">
                          Send delivered message
                        </a>
                      </Button>
                    )}
                    <p className="text-xs text-muted">
                      WhatsApp opens a prefilled message; review and tap Send in the Business app.
                    </p>
                  </div>
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
                          if (isKitchenOwner) {
                            setWhatsappNotice({
                              customer: order.delivery_name,
                              url: phone
                                ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
                                : null,
                              action: "Send order confirmation on WhatsApp",
                            });
                          }
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

function normalizeWhatsappPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

function whatsappUrl(phone: string, message: string): string | null {
  const normalizedPhone = normalizeWhatsappPhone(phone);
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
    : null;
}
