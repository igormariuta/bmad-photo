import { useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { ICON_BUTTON_CLASS_NAME } from "../Button/Button";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  // The blocking pre-paint script (see Dev Notes) may have already set `.dark` — trust it
  // first so this stays in sync with whatever's already rendered.
  if (document.documentElement.classList.contains("dark")) return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Independent of any app wiring it into a header — reads/applies its own initial theme on
 * first render (localStorage, falling back to `prefers-color-scheme`), so it's correct even
 * without the separate flash-prevention script. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = readInitialTheme();
    if (typeof document !== "undefined") applyTheme(initial);
    return initial;
  });

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      className={`${ICON_BUTTON_CLASS_NAME} size-9`}
    >
      {theme === "dark" ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
