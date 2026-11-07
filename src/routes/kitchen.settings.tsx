import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getKitchen, saveKitchenSettings } from "@/lib/kitchen/server";
import { THEMES } from "@/lib/kitchen/theme";

export const Route = createFileRoute("/kitchen/settings")({
  component: KitchenSettingsPage,
});

function KitchenSettingsPage() {
  const q = useQuery({ queryKey: ["kitchen"], queryFn: () => getKitchen() });
  const k = q.data;
  const [form, setForm] = useState({
    tagline: "",
    address_line: "",
    city: "",
    pincode: "",
    lat: 12.9293,
    lng: 77.5838,
    phone: "",
    upi_vpa: "",
    upi_name: "",
    subscription_upi_vpa: "",
    subscription_upi_name: "",
    licence_number: "",
    licence_type: "",
    licence_authority: "",
    licence_valid_from: "",
    licence_valid_until: "",
    licence_image_url: null as string | null,
    avg_prep_minutes: 35,
    delivery_radius_km: 12,
    default_theme: "clay",
    about: "",
  });

  useEffect(() => {
    if (!k) return;
    setForm({
      tagline: k.tagline,
      address_line: k.address_line,
      city: k.city,
      pincode: k.pincode,
      lat: k.lat,
      lng: k.lng,
      phone: k.phone,
      upi_vpa: k.upi_vpa,
      upi_name: k.upi_name,
      subscription_upi_vpa: k.subscription_upi_vpa,
      subscription_upi_name: k.subscription_upi_name,
      licence_number: k.licence_number,
      licence_type: k.licence_type,
      licence_authority: k.licence_authority,
      licence_valid_from: k.licence_valid_from,
      licence_valid_until: k.licence_valid_until,
      licence_image_url: k.licence_image_url,
      avg_prep_minutes: k.avg_prep_minutes,
      delivery_radius_km: k.delivery_radius_km,
      default_theme: k.default_theme,
      about: k.about,
    });
  }, [k]);

  if (!k) return null;

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await saveKitchenSettings({ data: form });
          toast("Kitchen saved");
          void q.refetch();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Could not save");
        }
      }}
    >
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl">Hearth</h2>
        <Field
          label="Tagline"
          value={form.tagline}
          onChange={(v) => setForm({ ...form, tagline: v })}
        />
        <Field
          label="Address"
          value={form.address_line}
          onChange={(v) => setForm({ ...form, address_line: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field
            label="Pincode"
            value={form.pincode}
            onChange={(v) => setForm({ ...form, pincode: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Latitude"
            value={String(form.lat)}
            onChange={(v) => setForm({ ...form, lat: Number(v) })}
          />
          <Field
            label="Longitude"
            value={String(form.lng)}
            onChange={(v) => setForm({ ...form, lng: Number(v) })}
          />
        </div>
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="space-y-1.5">
          <Label>About</Label>
          <Textarea
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl">UPI</h2>
        <Field
          label="UPI VPA"
          value={form.upi_vpa}
          onChange={(v) => setForm({ ...form, upi_vpa: v })}
        />
        <Field
          label="Payee name"
          value={form.upi_name}
          onChange={(v) => setForm({ ...form, upi_name: v })}
        />
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl">Subscription UPI</h2>
        <p className="text-sm text-muted">
          Subscription QR codes use this recipient and include the selected plan amount.
        </p>
        <Field
          label="Subscription UPI VPA"
          value={form.subscription_upi_vpa}
          onChange={(v) => setForm({ ...form, subscription_upi_vpa: v })}
        />
        <Field
          label="Subscription payee name"
          value={form.subscription_upi_name}
          onChange={(v) => setForm({ ...form, subscription_upi_name: v })}
        />
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl">Food licence</h2>
        <Field
          label="Licence number"
          value={form.licence_number}
          onChange={(v) => setForm({ ...form, licence_number: v })}
        />
        <Field
          label="Type"
          value={form.licence_type}
          onChange={(v) => setForm({ ...form, licence_type: v })}
        />
        <Field
          label="Authority"
          value={form.licence_authority}
          onChange={(v) => setForm({ ...form, licence_authority: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Valid from</Label>
            <Input
              type="date"
              value={form.licence_valid_from}
              onChange={(e) => setForm({ ...form, licence_valid_from: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valid until</Label>
            <Input
              type="date"
              value={form.licence_valid_until}
              onChange={(e) => setForm({ ...form, licence_valid_until: e.target.value })}
            />
          </div>
        </div>
        <ImageUpload
          label="Licence scan (optional)"
          value={form.licence_image_url ?? ""}
          onChange={(url) => setForm({ ...form, licence_image_url: url })}
        />
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-display text-xl">Ride</h2>
        <Field
          label="Prep minutes"
          value={String(form.avg_prep_minutes)}
          onChange={(v) => setForm({ ...form, avg_prep_minutes: Number(v) })}
        />
        <Field
          label="Delivery radius km"
          value={String(form.delivery_radius_km)}
          onChange={(v) => setForm({ ...form, delivery_radius_km: Number(v) })}
        />
        <div className="space-y-1.5">
          <Label>Default theme</Label>
          <select
            value={form.default_theme}
            onChange={(e) => setForm({ ...form, default_theme: e.target.value })}
            className="flex h-11 w-full rounded-md bg-elevated px-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)]"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </Card>
      <Button type="submit">Save kitchen</Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
