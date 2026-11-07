import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatInr, orderCode } from "@/lib/kitchen/format";
import { UPI_APPS, genericUpiUri, upiUri } from "@/lib/kitchen/upi";
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
  const [svg, setSvg] = useState("");
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
  const generic = genericUpiUri(pay);
  const app = UPI_APPS.find((a) => a.id === appId) ?? UPI_APPS[0];

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then(async (QR) => {
      const next = await QR.toString(generic, {
        type: "svg",
        margin: 1,
        width: 220,
        color: { dark: "#1c1410", light: "#00000000" },
      });
      if (!cancelled) setSvg(next);
    });
    return () => {
      cancelled = true;
    };
  }, [generic]);

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Pay with any UPI
      </p>
      <h2 className="mt-1 font-display text-2xl">
        {formatInr(order.total_paise)}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {kitchen.upi_name} · {kitchen.upi_vpa}
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-[200px_1fr]">
        <div
          className="mx-auto size-[200px] rounded-lg bg-elevated p-3 [&_svg]:size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div>
          <p className="text-sm text-muted">
            Scan the QR from any UPI app, or open the one you use. After the
            payment succeeds, paste the UTR / UPI reference.
          </p>
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
                  "min-h-11 rounded-md px-2 text-sm font-medium",
                  app.id === a.id
                    ? "bg-primary text-primary-fg"
                    : "bg-fg/6 hover:bg-fg/10",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
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
          />
        </div>
        {error && <p className="text-sm text-primary">{error}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "I have paid"}
        </Button>
      </form>
    </Card>
  );
}
