import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INDIAN_STATES } from "@/lib/kitchen/catalog";
import { todayIsoDate } from "@/lib/kitchen/format";
import {
  listKitchenMenu,
  saveMenuItem,
  setMenuAvailability,
} from "@/lib/kitchen/server";
import type { MenuItem } from "@/lib/kitchen/types";
import { formatInr } from "@/lib/kitchen/format";

export const Route = createFileRoute("/kitchen/menu")({
  component: KitchenMenuPage,
});

const emptyForm = {
  name: "",
  description: "",
  state_origin: "Karnataka",
  flavor: "",
  category: "thali",
  meal_slot: "lunch",
  price_rupees: 199,
  calories: 600,
  protein_g: 20,
  carbs_g: 70,
  fat_g: 18,
  is_veg: true,
  spice_level: 2,
  image_url: "/dishes/home-thali.jpg",
  is_available: true,
  available_date: todayIsoDate(),
  is_weekly_special: false,
  is_alacarte: true,
};

function KitchenMenuPage() {
  const q = useQuery({
    queryKey: ["kitchen-menu"],
    queryFn: () => listKitchenMenu(),
  });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing("new");
    setForm({ ...emptyForm, available_date: todayIsoDate() });
  }

  function openEdit(item: MenuItem) {
    setEditing(item.id);
    setForm({
      name: item.name,
      description: item.description,
      state_origin: item.state_origin,
      flavor: item.flavor,
      category: item.category,
      meal_slot: item.meal_slot,
      price_rupees: item.price_paise / 100,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      is_veg: item.is_veg,
      spice_level: item.spice_level,
      image_url: item.image_url,
      is_available: item.is_available,
      available_date: item.available_date ?? todayIsoDate(),
      is_weekly_special: item.is_weekly_special,
      is_alacarte: item.is_alacarte,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Board</h2>
          <Button onClick={openNew}>Add today's dish</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {(q.data ?? []).map((item) => (
            <li key={item.id}>
              <Card className="flex items-center gap-3 p-3">
                <img src={item.image_url} alt="" className="size-14 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.state_origin} · {formatInr(item.price_paise)} · {item.calories} kcal
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.is_weekly_special && <Badge tone="primary">Special</Badge>}
                    {!item.is_available && <Badge>Hidden</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await setMenuAvailability({
                      data: { id: item.id, is_available: !item.is_available },
                    });
                    void q.refetch();
                  }}
                >
                  {item.is_available ? "Hide" : "Show"}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </div>
      {editing !== null && (
        <Card className="h-fit space-y-3 p-4">
          <h3 className="font-display text-xl">
            {editing === "new" ? "New dish" : "Edit dish"}
          </h3>
          <ImageUpload
            label="Photo"
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />
          <div className="space-y-1.5">
            <Label htmlFor="dn">Name</Label>
            <Input
              id="dn"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dd">Description</Label>
            <Textarea
              id="dd"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>State</Label>
              <select
                value={form.state_origin}
                onChange={(e) => setForm((f) => ({ ...f, state_origin: e.target.value }))}
                className="flex h-11 w-full rounded-md bg-elevated px-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)]"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Meal</Label>
              <select
                value={form.meal_slot}
                onChange={(e) => setForm((f) => ({ ...f, meal_slot: e.target.value }))}
                className="flex h-11 w-full rounded-md bg-elevated px-3 text-sm shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tg-fg)_14%,transparent)]"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="any">Any</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fl">Flavour</Label>
            <Input
              id="fl"
              value={form.flavor}
              onChange={(e) => setForm((f) => ({ ...f, flavor: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pr">Price (₹)</Label>
              <Input
                id="pr"
                type="number"
                value={form.price_rupees}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price_rupees: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal">Calories</Label>
              <Input
                id="cal"
                type="number"
                value={form.calories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calories: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Protein g</Label>
              <Input
                type="number"
                value={form.protein_g}
                onChange={(e) =>
                  setForm((f) => ({ ...f, protein_g: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Carbs g</Label>
              <Input
                type="number"
                value={form.carbs_g}
                onChange={(e) =>
                  setForm((f) => ({ ...f, carbs_g: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fat g</Label>
              <Input
                type="number"
                value={form.fat_g}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fat_g: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Spice 1–5</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.spice_level}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spice_level: Number(e.target.value) }))
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_veg}
              onChange={(e) => setForm((f) => ({ ...f, is_veg: e.target.checked }))}
            />
            Vegetarian
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_weekly_special}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_weekly_special: e.target.checked }))
              }
            />
            Weekly state special
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_alacarte}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_alacarte: e.target.checked }))
              }
            />
            A la carte
          </label>
          <div className="space-y-1.5">
            <Label>Available date (daily board)</Label>
            <Input
              type="date"
              value={form.available_date ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, available_date: e.target.value || null }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveMenuItem({
                    data: {
                      id: editing === "new" ? undefined : editing,
                      ...form,
                      available_date: form.is_weekly_special
                        ? null
                        : form.available_date,
                    },
                  });
                  toast("Dish saved");
                  setEditing(null);
                  void q.refetch();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
