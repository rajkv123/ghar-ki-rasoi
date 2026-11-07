export type KitchenPublic = {
  kitchen_name: string;
  tagline: string;
  address_line: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  upi_vpa: string;
  upi_name: string;
  subscription_upi_vpa: string;
  subscription_upi_name: string;
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
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  state_origin: string;
  flavor: string;
  category: string;
  meal_slot: string;
  price_paise: number;
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
  sort_order: number;
};

export type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string;
  meals_per_week: number;
  price_paise: number;
  per_meal_price_paise: number;
  calories_per_day: number;
  serves: number;
  perks: string;
  is_active: boolean;
};

export type Profile = {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  address_line: string | null;
  area: string | null;
  city: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  theme: string | null;
};

export type Subscription = {
  id: number;
  user_id: string;
  plan_id: number;
  status: string;
  started_at: string;
  renews_at: string;
  last_paid_at: string | null;
  payment_ref: string | null;
  plan: Plan | null;
};

export type PendingSubscriptionPayment = {
  id: number;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  payment_ref: string;
  payment_submitted_at: string | null;
  plan_name: string;
  price_paise: number;
};

export type OrderStatus =
  "pending_payment" | "paid" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

export type OrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number | null;
  name: string;
  qty: number;
  unit_price_paise: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image_url: string;
  is_veg: boolean;
};

export type Order = {
  id: number;
  user_id: string;
  status: OrderStatus;
  subtotal_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_area: string;
  delivery_lat: number;
  delivery_lng: number;
  distance_km: number;
  eta_minutes: number;
  payment_method: string;
  payment_ref: string | null;
  paid_at: string | null;
  preparing_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
};

export type KitchenRole = {
  role: "owner" | "staff" | null;
  canClaim: boolean;
};

export type KitchenStats = {
  ordersToday: number;
  pendingKitchen: number;
  activeSubscribers: number;
  revenueTodayPaise: number;
  liveMenu: number;
};

export type CartLineInput = {
  menuItemId: number;
  qty: number;
};
