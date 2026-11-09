import { useMemo, useState } from "react";
import { QrCode, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { UPI_APPS, upiUri } from "@/lib/kitchen/upi";
import { submitUpiRef } from "@/lib/kitchen/server";
import type { KitchenPublic, Order } from "@/lib/kitchen/types";
import { cn } from "@/lib/utils";

export function UpiPay({
  order,
  kitchen,
  onPaid,
}: {
  order: Order;
  kitchen: KitchenPublic;
  onPaid: () => void;
}) {
  const [appId, setAppId] = useState("gpay");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = useMemo(
    () => ({
      vpa: kitchen.upi_vpa,
      name: kitchen.upi_name,
      paise: order.total_paise,
      note: `Gharaunda Rasoi ${orderCode(order.id)}`,
      tr: orderCode(order.id),
    }),
    [kitchen, order],
  );
  const app = UPI_APPS.find((a) => a.id === appId) ?? UPI_APPS[0];

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Pay with any UPI</p>
      <h2 className="mt-1 font-display text-2xl">{formatInr(order.total_paise)}</h2>

      {order.payment_ref ? (
        <p className="mt-4 text-sm text-muted" role="status">
          UPI reference submitted. Your order will move to the kitchen after we verify the payment.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-6 md:grid-cols-[288px_1fr]">
            <img
              src="/upi.png"
              alt={`UPI payment QR code for ${formatInr(order.total_paise)}`}
              className="mx-auto size-72 rounded-lg bg-white object-contain p-2"
            />
            <div>
              <div className="space-y-3">
                <p className="flex items-start gap-2 text-sm text-muted">
                  <QrCode className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    Scan this QR to pay {formatInr(order.total_paise)}. If your app doesn’t fill in
                    the amount, enter it before paying.
                  </span>
                </p>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Smartphone className="size-5 text-primary" aria-hidden="true" />
                  Open your UPI app below
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {UPI_APPS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAppId(a.id);
                      window.location.href = upiUri(a, pay);
                    }}
                    className={cn(
                      "flex min-h-12 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium",
                      app.id === a.id ? "bg-primary text-primary-fg" : "bg-fg/6 hover:bg-fg/10",
                    )}
                  >
                    <img
                      src={a.icon}
                      alt=""
                      aria-hidden="true"
                      className="size-6 shrink-0 object-contain"
                    />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-subtle">
                BHIM and CRED app icon artwork by Arcticons Team, licensed under CC BY-SA 4.0
                (github.com/Arcticons-Team/Arcticons).
              </p>
              <p className="mt-3 text-sm text-muted">
                After the payment succeeds, paste the UTR / UPI reference below. Your order remains
                awaiting verification until the kitchen confirms the payment.
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                await submitUpiRef({
                  data: { orderId: order.id, payment_ref: ref },
                });
                onPaid();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not record payment");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="utr">UPI reference / UTR</Label>
              <Input
                id="utr"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="e.g. 3241XXXXXX"
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            {error && <p className="text-sm text-primary">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit payment reference"}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
