import tailwindcss from "eslint-plugin-tailwindcss";

/**
 * Flat-config block enforcing Tailwind's no-arbitrary-value rule as a flat
 * ban: Story 1.2's preset already maps every needed color/spacing/radius
 * value into the theme scale, so no bracket arbitrary-value usage is ever
 * legitimate.
 */
export function tailwindConfig(cssConfigPath) {
  return {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { tailwindcss },
    settings: {
      tailwindcss: {
        cssConfigPath,
      },
    },
    rules: {
      "tailwindcss/no-arbitrary-value": "error",
    },
  };
}
