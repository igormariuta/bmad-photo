import { useEffect, useLayoutEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { ICON_BUTTON_CLASS_NAME } from "../Button/Button";

export type Theme = "light" | "dark";

// Also hardcoded (this key + the localStorage/prefers-color-scheme fallback logic below) in the
// two flash-prevention <script> tags — apps/gallery/index.html and
// apps/landing/src/layouts/Layout.astro — since those must run inline, non-deferred, before
// hydration, and can't import this module. Keep all three in sync by hand if this ever changes.
export const THEME_STORAGE_KEY = "theme";

// Server-rendered consumers (Astro's `client:load`) can't call useLayoutEffect during their
// build-time SSR pass without a console warning; a plain useEffect there is a no-op anyway
// (SSR never runs effects), so this only matters for picking the right hook once hydrated.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  // The blocking pre-paint script (see Dev Notes) may have already set `.dark` — trust it
  // first so this stays in sync with whatever's already rendered.
  if (document.documentElement.classList.contains("dark")) return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Independent of any app wiring it into a header — reads/applies its own initial theme
 * (localStorage, falling back to `prefers-color-scheme`), so it's correct even without the
 * separate flash-prevention script.
 *
 * Initial render always starts at the SSR-safe default ("light"), never reading `document` —
 * a server-pre-rendered consumer (e.g. Astro's `client:load`) builds its static markup with
 * `document` undefined too, so the first client commit matches it exactly and needs no
 * attribute patch. The layout effect below corrects to the real theme right after mount: a
 * hydration commit doesn't reliably repaint mismatched attributes even when the fiber's
 * internal state is already correct, but a genuine follow-up render (what this effect
 * triggers) does. `useLayoutEffect` (not `useEffect`) keeps this invisible for plain
 * client-rendered consumers (e.g. the Gallery SPA) by correcting before the first paint. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useIsomorphicLayoutEffect(() => {
    const initial = readInitialTheme();
    applyTheme(initial);
    setTheme(initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
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
