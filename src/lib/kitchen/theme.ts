export const THEME_IDS = ["clay", "coast", "monsoon", "tandoor", "lotus"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: {
  id: ThemeId;
  name: string;
  note: string;
}[] = [
  { id: "clay", name: "Clay Hearth", note: "Warm paper and terracotta" },
  { id: "coast", name: "Coconut Coast", note: "Sand and teal" },
  { id: "monsoon", name: "Monsoon Leaf", note: "Mist and forest" },
  { id: "tandoor", name: "Charcoal Tandoor", note: "Night kitchen" },
  { id: "lotus", name: "Lotus Paper", note: "Blush ink" },
];

const STORAGE_KEY = "trendgrove.theme";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEME_IDS as readonly string[]).includes(value);
}

export function readStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function storeTheme(id: ThemeId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = id;
}
