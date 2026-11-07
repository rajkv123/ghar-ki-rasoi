import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CalorieMeter } from "@/components/calorie-meter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cartMacros, cartSubtotal, useCart } from "@/lib/cart";
import { formatInr } from "@/lib/kitchen/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const macros = cartMacros(lines);
  const subtotal = cartSubtotal(lines);

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-display text-4xl">Your bag</h1>
        {lines.length === 0 ? (
          <p className="mt-6 text-muted">
            The bag is empty.{" "}
            <Link to="/menu" className="font-medium underline-offset-4 hover:underline">
              See today's board
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {lines.map((line) => (
              <li key={line.item.id}>
                <Card className="flex gap-4 p-3">
                  <img
                    src={line.item.image_url}
                    alt=""
                    className="size-20 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{line.item.name}</p>
                    <p className="text-xs text-muted">
                      {line.item.state_origin} · {line.item.calories} kcal each
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      {formatInr(line.item.price_paise)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-md bg-fg/6"
                        onClick={() => setQty(line.item.id, line.qty - 1)}
                        aria-label="Decrease"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-md bg-fg/6"
                        onClick={() => setQty(line.item.id, line.qty + 1)}
                        aria-label="Increase"
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="ml-auto grid size-9 place-items-center rounded-md hover:bg-fg/6"
                        onClick={() => remove(line.item.id)}
                        aria-label="Remove"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside>
        <Card className="sticky top-24 space-y-4 p-5">
          <h2 className="font-display text-xl">Plate calories</h2>
          <CalorieMeter macros={macros} />
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatInr(subtotal)}</span>
          </div>
          <p className="text-xs text-subtle">
            Delivery fee and subscriber discount are calculated at checkout from
            your pin.
          </p>
          <Button asChild className="w-full" disabled={lines.length === 0}>
            <Link to="/checkout">Checkout with UPI</Link>
          </Button>
        </Card>
      </aside>
    </div>
  );
}
