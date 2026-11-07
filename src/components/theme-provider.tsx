import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTheme,
  isThemeId,
  readStoredTheme,
  storeTheme,
  type ThemeId,
} from "@/lib/kitchen/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "clay",
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: string | null;
}) {
  const [theme, setThemeState] = useState<ThemeId>(() =>
    isThemeId(initial) ? initial : "clay",
  );

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
      return;
    }
    applyTheme(theme);
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    storeTheme(id);
    applyTheme(id);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
