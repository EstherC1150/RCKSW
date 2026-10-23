import { create } from "zustand";

export type ThemeMode = "dark" | "light";

interface ThemeState {
  theme: ThemeMode;
  isMounted: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  initTheme: () => void;
}

const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  isMounted: false,

  initTheme: () => {
    if (typeof window === "undefined") return;
    try {
      const savedTheme = localStorage.getItem("rck-theme") as ThemeMode | null;
      const initialTheme: ThemeMode = savedTheme === "light" ? "light" : "dark";
      applyThemeToDOM(initialTheme);
      set({ theme: initialTheme, isMounted: true });
    } catch {
      applyThemeToDOM("dark");
      set({ theme: "dark", isMounted: true });
    }
  },

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem("rck-theme", theme);
    } catch {}
    applyThemeToDOM(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const nextTheme: ThemeMode = currentTheme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("rck-theme", nextTheme);
    } catch {}
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },
}));

export default useThemeStore;
