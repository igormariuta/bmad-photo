import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { noArbitraryStyleValueRule } from "./src/no-arbitrary-style-value.js";
import { tailwindConfig } from "./src/tailwind.js";
import { boundariesConfig } from "./src/boundaries.js";

// packages/eslint-config sits exactly two directories below the repo root
// regardless of which consumer (apps/* or packages/*) imports this module.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const THEME_TAILWIND_CSS = path.join(
  REPO_ROOT,
  "packages/theme/src/tailwind-preset.css",
);

export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**", ".astro/**"],
  },
);

const noArbitraryStyleValueConfig = {
  files: ["**/*.{jsx,tsx}"],
  plugins: {
    local: {
      rules: { "no-arbitrary-style-value": noArbitraryStyleValueRule },
    },
  },
  rules: {
    "local/no-arbitrary-style-value": "error",
  },
};

/**
 * Assembles the full flat-config array for a workspace member.
 *
 * @param {{ element: "theme" | "ui" | "app" }} options
 * - `element` maps to the AD-1 boundary type for this package/app. `theme`
 *   has no JSX/Tailwind surface, so it only gets the boundaries rule.
 */
export function createConfig({ element }) {
  const configs = [...baseConfig, boundariesConfig(REPO_ROOT)];

  if (element !== "theme") {
    configs.push(tailwindConfig(THEME_TAILWIND_CSS), noArbitraryStyleValueConfig);
  }

  return configs;
}

export default baseConfig;
