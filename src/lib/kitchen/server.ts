import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { SEED_DISHES } from "@/lib/kitchen/catalog";
import {
  deliveryFeePaise,
  haversineKm,
  rideMinutes,
} from "@/lib/kitchen/geo";
import { isoFromUnknown, SITE_LOCATION, todayIsoDate } from "@/lib/kitchen/format";
import { sumMacros } from "@/lib/kitchen/calories";
import type {
  CartLineInput,
  KitchenPublic,
  KitchenRole,
  KitchenStats,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  Plan,
  Profile,
  Subscription,
} from "@/lib/kitchen/types";

const STAFF_ROLES = new Set(["owner", "staff"]);

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function asNum(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapItem(row: Record<string, unknown>): MenuItem {
  return {
    id: asNum(row.id),
    name: String(row.name),
    description: String(row.description),
    state_origin: String(row.state_origin),
    flavor: String(row.flavor),
    category: String(row.category),
    meal_slot: String(row.meal_slot),
    price_paise: asNum(row.price_paise),
    calories: asNum(row.calories),
    protein_g: asNum(row.protein_g),
    carbs_g: asNum(row.carbs_g),
    fat_g: asNum(row.fat_g),
    is_veg: asBool(row.is_veg),
    spice_level: asNum(row.spice_level),
    image_url: String(row.image_url),
    is_available: asBool(row.is_available),
    available_date: row.available_date ? String(row.available_date).slice(0, 10) : null,
    is_weekly_special: asBool(row.is_weekly_special),
    is_alacarte: asBool(row.is_alacarte),
    sort_order: asNum(row.sort_order),
  };
}

function mapPlan(row: Record<string, unknown>): Plan {
  return {
    id: asNum(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    meals_per_week: asNum(row.meals_per_week),
    price_paise: asNum(row.price_paise),
    per_meal_price_paise: asNum(row.per_meal_price_paise),
    calories_per_day: asNum(row.calories_per_day),
    serves: asNum(row.serves, 1),
    perks: String(row.perks),
    is_active: asBool(row.is_active),
  };
}

function mapKitchen(row: Record<string, unknown>): KitchenPublic {
  return {
    kitchen_name: String(row.kitchen_name),
    tagline: String(row.tagline),
    address_line: String(row.address_line),
    city: String(row.city),
    pincode: String(row.pincode),
    lat: asNum(row.lat),
    lng: asNum(row.lng),
    phone: String(row.phone),
    upi_vpa: String(row.upi_vpa),
    upi_name: String(row.upi_name),
    licence_number: String(row.licence_number),
    licence_type: String(row.licence_type),
    licence_authority: String(row.licence_authority),
    licence_valid_from: String(row.licence_valid_from),
    licence_valid_until: String(row.licence_valid_until),
    licence_image_url: row.licence_image_url ? String(row.licence_image_url) : null,
    avg_prep_minutes: asNum(row.avg_prep_minutes, 35),
    delivery_radius_km: asNum(row.delivery_radius_km, 12),
    default_theme: String(row.default_theme ?? "clay"),
    about: String(row.about),
  };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    user_id: String(row.user_id),
    display_name: row.display_name ? String(row.display_name) : null,
    phone: row.phone ? String(row.phone) : null,
    address_line: row.address_line ? String(row.address_line) : null,
    area: row.area ? String(row.area) : null,
    city: row.city ? String(row.city) : null,
    pincode: row.pincode ? String(row.pincode) : null,
    lat: row.lat == null ? null : asNum(row.lat),
    lng: row.lng == null ? null : asNum(row.lng),
    theme: row.theme ? String(row.theme) : null,
  };
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: asNum(row.id),
    order_id: asNum(row.order_id),
    menu_item_id: row.menu_item_id == null ? null : asNum(row.menu_item_id),
    name: String(row.name),
    qty: asNum(row.qty),
    unit_price_paise: asNum(row.unit_price_paise),
    calories: asNum(row.calories),
    protein_g: asNum(row.protein_g),
    carbs_g: asNum(row.carbs_g),
    fat_g: asNum(row.fat_g),
    image_url: String(row.image_url),
    is_veg: asBool(row.is_veg),
  };
}

function mapOrder(row: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: asNum(row.id),
    user_id: String(row.user_id),
    status: String(row.status) as OrderStatus,
    subtotal_paise: asNum(row.subtotal_paise),
    delivery_fee_paise: asNum(row.delivery_fee_paise),
    discount_paise: asNum(row.discount_paise),
    total_paise: asNum(row.total_paise),
    total_calories: asNum(row.total_calories),
    total_protein_g: asNum(row.total_protein_g),
    total_carbs_g: asNum(row.total_carbs_g),
    total_fat_g: asNum(row.total_fat_g),
    delivery_name: String(row.delivery_name),
    delivery_phone: String(row.delivery_phone),
    delivery_address: String(row.delivery_address),
    delivery_area: String(row.delivery_area),
    delivery_lat: asNum(row.delivery_lat),
    delivery_lng: asNum(row.delivery_lng),
    distance_km: asNum(row.distance_km),
    eta_minutes: asNum(row.eta_minutes),
    payment_method: String(row.payment_method),
    payment_ref: row.payment_ref ? String(row.payment_ref) : null,
    paid_at: isoFromUnknown(row.paid_at),
    preparing_at: isoFromUnknown(row.preparing_at),
    dispatched_at: isoFromUnknown(row.dispatched_at),
    delivered_at: isoFromUnknown(row.delivered_at),
    notes: row.notes ? String(row.notes) : null,
    created_at: isoFromUnknown(row.created_at) ?? new Date().toISOString(),
    items,
  };
}

let seedPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const sql = await getSql();
      const count = await sql.query<{ n: number }>(
        "select count(*)::int as n from menu_items",
      );
      if ((count[0]?.n ?? 0) > 0) return;
      const today = todayIsoDate();
      for (const dish of SEED_DISHES) {
        await sql.query(
          `insert into menu_items (
            name, description, state_origin, flavor, category, meal_slot,
            price_paise, calories, protein_g, carbs_g, fat_g, is_veg, spice_level,
            image_url, is_available, available_date, is_weekly_special, is_alacarte, sort_order
          ) values (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15,$16,$17,$18
          )`,
          [
            dish.name,
            dish.description,
            dish.state_origin,
            dish.flavor,
            dish.category,
            dish.meal_slot,
            dish.price_paise,
            dish.calories,
            dish.protein_g,
            dish.carbs_g,
            dish.fat_g,
            dish.is_veg,
            dish.spice_level,
            dish.image_url,
            dish.daily ? today : null,
            dish.is_weekly_special,
            dish.is_alacarte,
            dish.sort_order,
          ],
        );
      }
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}

async function loadKitchen(): Promise<KitchenPublic> {
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from kitchen_settings where id = 1",
  );
  if (!rows[0]) throw new Error("Kitchen is not configured");
  return mapKitchen(rows[0]);
}

async function staffRole(userId: string): Promise<string | null> {
  const sql = await getSql();
  const rows = await sql.query<{ role: string }>(
    "select role from kitchen_staff where user_id = $1",
    [userId],
  );
  return rows[0]?.role ?? null;
}

async function requireStaff(userId: string): Promise<string> {
  const role = await staffRole(userId);
  if (!role || !STAFF_ROLES.has(role)) {
    throw new Error("Kitchen access only");
  }
  return role;
}

async function ordersWithItems(
  orderRows: Record<string, unknown>[],
): Promise<Order[]> {
  if (orderRows.length === 0) return [];
  const sql = await getSql();
  const ids = orderRows.map((r) => asNum(r.id));
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const itemRows = await sql.query<Record<string, unknown>>(
    `select * from order_items where order_id in (${placeholders}) order by id`,
    ids,
  );
  const byOrder = new Map<number, OrderItem[]>();
  for (const row of itemRows) {
    const item = mapOrderItem(row);
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  return orderRows.map((row) => mapOrder(row, byOrder.get(asNum(row.id)) ?? []));
}

export const getKitchen = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  return loadKitchen();
});

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  await ensureSeeded();
  const sql = await getSql();
  const today = todayIsoDate();
  const rows = await sql.query<Record<string, unknown>>(
    `select * from menu_items
     where is_available = true
       and (available_date is null or available_date = $1 or is_weekly_special = true)
     order by sort_order, id`,
    [today],
  );
  return rows.map(mapItem);
});

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<Record<string, unknown>>(
    "select * from subscription_plans where is_active = true order by price_paise",
  );
  return rows.map(mapPlan);
});

export const getKitchenRole = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<KitchenRole> => {
    const sql = await getSql();
    const role = await staffRole(context.userId);
    const count = await sql.query<{ n: number }>(
      "select count(*)::int as n from kitchen_staff",
    );
    return {
      role: (role as KitchenRole["role"]) ?? null,
      canClaim: (count[0]?.n ?? 0) === 0,
    };
  });

export const claimKitchen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const count = await sql.query<{ n: number }>(
      "select count(*)::int as n from kitchen_staff",
    );
    if ((count[0]?.n ?? 0) > 0) {
      const existing = await staffRole(context.userId);
      if (!existing) throw new Error("This kitchen already has an owner");
      return { role: existing };
    }
    await sql.query(
      "insert into kitchen_staff (user_id, role) values ($1, 'owner')",
      [context.userId],
    );
    return { role: "owner" };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from profiles where user_id = $1",
      [context.userId],
    );
    return rows[0] ? mapProfile(rows[0]) : null;
  });

type ProfileInput = {
  display_name: string;
  phone: string;
  address_line: string;
  area: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  theme: string | null;
};

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: ProfileInput) => data)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql.query(
      `insert into profiles (
        user_id, display_name, phone, address_line, area, city, pincode, lat, lng, theme, updated_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        phone = excluded.phone,
        address_line = excluded.address_line,
        area = excluded.area,
        city = excluded.city,
        pincode = excluded.pincode,
        lat = excluded.lat,
        lng = excluded.lng,
        theme = excluded.theme,
        updated_at = now()`,
      [
        context.userId,
        data.display_name.trim(),
        data.phone.trim(),
        data.address_line.trim(),
        data.area.trim(),
        data.city.trim(),
        data.pincode.trim(),
        data.lat,
        data.lng,
        data.theme,
      ],
    );
    return { ok: true };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Subscription | null> => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select s.*, p.slug as plan_slug from subscriptions s
       join subscription_plans p on p.id = s.plan_id
       where s.user_id = $1 and s.status = 'active'
       order by s.id desc limit 1`,
      [context.userId],
    );
    if (!rows[0]) return null;
    const planRows = await sql.query<Record<string, unknown>>(
      "select * from subscription_plans where id = $1",
      [rows[0].plan_id],
    );
    return {
      id: asNum(rows[0].id),
      user_id: String(rows[0].user_id),
      plan_id: asNum(rows[0].plan_id),
      status: String(rows[0].status),
      started_at: isoFromUnknown(rows[0].started_at) ?? "",
      renews_at: isoFromUnknown(rows[0].renews_at) ?? "",
      last_paid_at: isoFromUnknown(rows[0].last_paid_at),
      plan: planRows[0] ? mapPlan(planRows[0]) : null,
    };
  });

export const startSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((planId: number) => planId)
  .handler(async ({ context, data: planId }) => {
    const sql = await getSql();
    const plans = await sql.query<Record<string, unknown>>(
      "select * from subscription_plans where id = $1 and is_active = true",
      [planId],
    );
    if (!plans[0]) throw new Error("Plan not found");
    await sql.query(
      "update subscriptions set status = 'cancelled' where user_id = $1 and status = 'active'",
      [context.userId],
    );
    const renews = new Date();
    renews.setDate(renews.getDate() + 30);
    const inserted = await sql.query<{ id: number }>(
      `insert into subscriptions (user_id, plan_id, status, renews_at, last_paid_at)
       values ($1,$2,'active',$3,now()) returning id`,
      [context.userId, planId, renews.toISOString()],
    );
    return { id: inserted[0]?.id ?? 0 };
  });

export const pauseSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql.query(
      "update subscriptions set status = 'paused' where user_id = $1 and status = 'active'",
      [context.userId],
    );
    return { ok: true };
  });

type PlaceOrderInput = {
  lines: CartLineInput[];
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_area: string;
  delivery_lat: number;
  delivery_lng: number;
  payment_method: string;
  notes?: string;
};

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: PlaceOrderInput) => data)
  .handler(async ({ context, data }) => {
    if (!data.lines.length) throw new Error("Your bag is empty");
    if (!data.delivery_name.trim() || !data.delivery_phone.trim()) {
      throw new Error("Name and phone are required");
    }
    const kitchen = await loadKitchen();
    const distance = haversineKm(
      { lat: kitchen.lat, lng: kitchen.lng },
      { lat: data.delivery_lat, lng: data.delivery_lng },
    );
    if (distance > kitchen.delivery_radius_km + 0.4) {
      throw new Error(
        `We ride ${kitchen.delivery_radius_km} km from the ${SITE_LOCATION} home kitchen. This pin is ${distance.toFixed(1)} km.`,
      );
    }
    const sql = await getSql();
    const ids = data.lines.map((l) => l.menuItemId);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const menuRows = await sql.query<Record<string, unknown>>(
      `select * from menu_items where id in (${placeholders})`,
      ids,
    );
    const byId = new Map(menuRows.map((r) => [asNum(r.id), mapItem(r)]));
    const resolved = data.lines.map((line) => {
      const item = byId.get(line.menuItemId);
      if (!item || !item.is_available) {
        throw new Error("A dish on your bag is no longer on the board");
      }
      const qty = Math.min(20, Math.max(1, Math.round(line.qty)));
      return { item, qty };
    });
    const subtotal = resolved.reduce((n, l) => n + l.item.price_paise * l.qty, 0);
    const macros = sumMacros(
      resolved.map((l) => ({
        calories: l.item.calories,
        protein_g: l.item.protein_g,
        carbs_g: l.item.carbs_g,
        fat_g: l.item.fat_g,
        qty: l.qty,
      })),
    );
    const sub = await sql.query<{ n: number }>(
      "select count(*)::int as n from subscriptions where user_id = $1 and status = 'active'",
      [context.userId],
    );
    const discount = (sub[0]?.n ?? 0) > 0 ? Math.round(subtotal * 0.1) : 0;
    const delivery = deliveryFeePaise(distance);
    const total = Math.max(0, subtotal + delivery - discount);
    const eta = kitchen.avg_prep_minutes + rideMinutes(distance);
    const orderRows = await sql.query<Record<string, unknown>>(
      `insert into orders (
        user_id, status, subtotal_paise, delivery_fee_paise, discount_paise, total_paise,
        total_calories, total_protein_g, total_carbs_g, total_fat_g,
        delivery_name, delivery_phone, delivery_address, delivery_area,
        delivery_lat, delivery_lng, distance_km, eta_minutes, payment_method, notes
      ) values (
        $1,'pending_payment',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) returning *`,
      [
        context.userId,
        subtotal,
        delivery,
        discount,
        total,
        macros.calories,
        macros.protein_g,
        macros.carbs_g,
        macros.fat_g,
        data.delivery_name.trim(),
        data.delivery_phone.trim(),
        data.delivery_address.trim(),
        data.delivery_area.trim(),
        data.delivery_lat,
        data.delivery_lng,
        Math.round(distance * 10) / 10,
        eta,
        data.payment_method,
        data.notes?.trim() || null,
      ],
    );
    const orderId = asNum(orderRows[0]?.id);
    for (const line of resolved) {
      await sql.query(
        `insert into order_items (
          order_id, menu_item_id, name, qty, unit_price_paise, calories, protein_g, carbs_g, fat_g, image_url, is_veg
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          orderId,
          line.item.id,
          line.item.name,
          line.qty,
          line.item.price_paise,
          line.item.calories,
          line.item.protein_g,
          line.item.carbs_g,
          line.item.fat_g,
          line.item.image_url,
          line.item.is_veg,
        ],
      );
    }
    const [order] = await ordersWithItems(orderRows);
    return order;
  });

export const submitUpiRef = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { orderId: number; payment_ref: string }) => data)
  .handler(async ({ context, data }) => {
    const ref = data.payment_ref.trim();
    if (ref.length < 6) throw new Error("Enter the UPI reference / UTR");
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `update orders
       set payment_ref = $1, status = 'paid', paid_at = now()
       where id = $2 and user_id = $3 and status = 'pending_payment'
       returning *`,
      [ref, data.orderId, context.userId],
    );
    if (!rows[0]) throw new Error("Order not waiting for payment");
    const [order] = await ordersWithItems(rows);
    return order;
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from orders where user_id = $1 order by id desc limit 50",
      [context.userId],
    );
    return ordersWithItems(rows);
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((orderId: number) => orderId)
  .handler(async ({ context, data: orderId }) => {
    const sql = await getSql();
    const role = await staffRole(context.userId);
    const rows = role
      ? await sql.query<Record<string, unknown>>(
          "select * from orders where id = $1",
          [orderId],
        )
      : await sql.query<Record<string, unknown>>(
          "select * from orders where id = $1 and user_id = $2",
          [orderId, context.userId],
        );
    if (!rows[0]) throw new Error("Order not found");
    const [order] = await ordersWithItems(rows);
    const kitchen = await loadKitchen();
    return { order, kitchen };
  });

export const getKitchenStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<KitchenStats> => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const today = todayIsoDate();
    const [ordersToday] = await sql.query<{ n: number }>(
      "select count(*)::int as n from orders where created_at::date = $1",
      [today],
    );
    const [pending] = await sql.query<{ n: number }>(
      `select count(*)::int as n from orders
       where status in ('paid','preparing','out_for_delivery')`,
    );
    const [subs] = await sql.query<{ n: number }>(
      "select count(*)::int as n from subscriptions where status = 'active'",
    );
    const [rev] = await sql.query<{ n: number }>(
      `select coalesce(sum(total_paise),0)::int as n from orders
       where created_at::date = $1 and status <> 'cancelled' and status <> 'pending_payment'`,
      [today],
    );
    const [live] = await sql.query<{ n: number }>(
      "select count(*)::int as n from menu_items where is_available = true",
    );
    return {
      ordersToday: ordersToday?.n ?? 0,
      pendingKitchen: pending?.n ?? 0,
      activeSubscribers: subs?.n ?? 0,
      revenueTodayPaise: rev?.n ?? 0,
      liveMenu: live?.n ?? 0,
    };
  });

export const listKitchenOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { cursor?: number } | undefined) => data ?? {})
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const cursor = data.cursor ?? 2147483647;
    const rows = await sql.query<Record<string, unknown>>(
      "select * from orders where id < $1 order by id desc limit 40",
      [cursor],
    );
    return ordersWithItems(rows);
  });

export const listKitchenMenu = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireStaff(context.userId);
    await ensureSeeded();
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from menu_items order by sort_order, id desc",
    );
    return rows.map(mapItem);
  });

type MenuInput = {
  id?: number;
  name: string;
  description: string;
  state_origin: string;
  flavor: string;
  category: string;
  meal_slot: string;
  price_rupees: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_veg: boolean;
  spice_level: number;
  image_url: string;
  is_available: boolean;
  available_date: string | null;
  is_weekly_special: boolean;
  is_alacarte: boolean;
};

export const saveMenuItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: MenuInput) => data)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    if (!data.name.trim()) throw new Error("Name is required");
    if (data.image_url.length > 450_000) throw new Error("Image is too large — try a smaller photo");
    const price = Math.round(data.price_rupees * 100);
    const sql = await getSql();
    if (data.id) {
      const rows = await sql.query<Record<string, unknown>>(
        `update menu_items set
          name=$1, description=$2, state_origin=$3, flavor=$4, category=$5, meal_slot=$6,
          price_paise=$7, calories=$8, protein_g=$9, carbs_g=$10, fat_g=$11, is_veg=$12,
          spice_level=$13, image_url=$14, is_available=$15, available_date=$16,
          is_weekly_special=$17, is_alacarte=$18
         where id=$19 returning *`,
        [
          data.name.trim(),
          data.description.trim(),
          data.state_origin,
          data.flavor.trim(),
          data.category,
          data.meal_slot,
          price,
          Math.round(data.calories),
          Math.round(data.protein_g),
          Math.round(data.carbs_g),
          Math.round(data.fat_g),
          data.is_veg,
          data.spice_level,
          data.image_url,
          data.is_available,
          data.available_date,
          data.is_weekly_special,
          data.is_alacarte,
          data.id,
        ],
      );
      return mapItem(rows[0]);
    }
    const rows = await sql.query<Record<string, unknown>>(
      `insert into menu_items (
        name, description, state_origin, flavor, category, meal_slot,
        price_paise, calories, protein_g, carbs_g, fat_g, is_veg, spice_level,
        image_url, is_available, available_date, is_weekly_special, is_alacarte, sort_order
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,50
      ) returning *`,
      [
        data.name.trim(),
        data.description.trim(),
        data.state_origin,
        data.flavor.trim(),
        data.category,
        data.meal_slot,
        price,
        Math.round(data.calories),
        Math.round(data.protein_g),
        Math.round(data.carbs_g),
        Math.round(data.fat_g),
        data.is_veg,
        data.spice_level,
        data.image_url,
        data.is_available,
        data.available_date,
        data.is_weekly_special,
        data.is_alacarte,
      ],
    );
    return mapItem(rows[0]);
  });

export const setMenuAvailability = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; is_available: boolean }) => data)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql.query("update menu_items set is_available = $1 where id = $2", [
      data.is_available,
      data.id,
    ]);
    return { ok: true };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: number; status: OrderStatus }) => data)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const extra =
      data.status === "preparing"
        ? ", preparing_at = coalesce(preparing_at, now())"
        : data.status === "out_for_delivery"
          ? ", dispatched_at = coalesce(dispatched_at, now()), preparing_at = coalesce(preparing_at, now())"
          : data.status === "delivered"
            ? ", delivered_at = coalesce(delivered_at, now()), dispatched_at = coalesce(dispatched_at, now())"
            : "";
    const rows = await sql.query<Record<string, unknown>>(
      `update orders set status = $1 ${extra} where id = $2 returning *`,
      [data.status, data.id],
    );
    if (!rows[0]) throw new Error("Order not found");
    const [order] = await ordersWithItems(rows);
    return order;
  });

type SettingsInput = {
  address_line: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  upi_vpa: string;
  upi_name: string;
  licence_number: string;
  licence_type: string;
  licence_authority: string;
  licence_valid_from: string;
  licence_valid_until: string;
  licence_image_url: string | null;
  avg_prep_minutes: number;
  delivery_radius_km: number;
  default_theme: string;
  about: string;
  tagline: string;
};

export const saveKitchenSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: SettingsInput) => data)
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql.query(
      `update kitchen_settings set
        tagline=$1, address_line=$2, city=$3, pincode=$4, lat=$5, lng=$6, phone=$7,
        upi_vpa=$8, upi_name=$9, licence_number=$10, licence_type=$11, licence_authority=$12,
        licence_valid_from=$13, licence_valid_until=$14, licence_image_url=$15,
        avg_prep_minutes=$16, delivery_radius_km=$17, default_theme=$18, about=$19
       where id = 1`,
      [
        data.tagline.trim(),
        data.address_line.trim(),
        data.city.trim(),
        data.pincode.trim(),
        data.lat,
        data.lng,
        data.phone.trim(),
        data.upi_vpa.trim(),
        data.upi_name.trim(),
        data.licence_number.trim(),
        data.licence_type.trim(),
        data.licence_authority.trim(),
        data.licence_valid_from,
        data.licence_valid_until,
        data.licence_image_url,
        data.avg_prep_minutes,
        data.delivery_radius_km,
        data.default_theme,
        data.about.trim(),
      ],
    );
    return loadKitchen();
  });
