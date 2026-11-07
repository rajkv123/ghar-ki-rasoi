export const SITE_NAME = "Gharaunda Rasoi";
export const SITE_LOCATION = "Begur, Bengaluru";

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatKcal(kcal: number): string {
  return `${new Intl.NumberFormat("en-IN").format(Math.round(kcal))} kcal`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function orderCode(id: number): string {
  return `TG-${String(id).padStart(5, "0")}`;
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function isoFromUnknown(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}

export function spiceLabel(level: number): string {
  if (level <= 1) return "Gentle";
  if (level === 2) return "Home mild";
  if (level === 3) return "Warm";
  if (level === 4) return "Andhra heat";
  return "Festival fire";
}
