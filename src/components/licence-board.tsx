import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { KitchenPublic } from "@/lib/kitchen/types";

export function LicenceBoard({ kitchen, framed }: { kitchen: KitchenPublic; framed?: boolean }) {
  const inner = (
    <div className="relative overflow-hidden rounded-lg bg-elevated px-6 py-8 text-center shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_12%,transparent)]">
      <div className="pointer-events-none absolute inset-3 rounded-md shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-primary)_28%,transparent)]" />
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
        Display of food licence
      </p>
      <div className="mx-auto mt-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl">{kitchen.kitchen_name}</h2>
      <p className="mt-1 text-sm text-muted">{kitchen.licence_type}</p>
      <p className="mt-5 font-display text-3xl tabular-nums tracking-[0.12em] text-primary">
        {kitchen.licence_number}
      </p>
      <dl className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Authority</dt>
          <dd className="mt-1 text-fg">{kitchen.licence_authority}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Valid</dt>
          <dd className="mt-1 tabular-nums text-fg">
            {kitchen.licence_valid_from} — {kitchen.licence_valid_until}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Premises</dt>
          <dd className="mt-1 text-fg">
            {kitchen.address_line}, {kitchen.city} {kitchen.pincode}
          </dd>
        </div>
      </dl>
      {kitchen.licence_image_url && (
        <img
          src={kitchen.licence_image_url}
          alt="Uploaded food licence"
          className="mx-auto mt-6 max-h-64 rounded-md object-contain"
        />
      )}
    </div>
  );

  if (!framed) return inner;
  return <Card className="p-3">{inner}</Card>;
}
