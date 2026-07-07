// Kept in sync with src/no-arbitrary-style-value.js's TOKENED_PROPERTIES —
// the two enforcement surfaces (JSX inline style vs. raw CSS/.astro) must
// hold the same property list or one surface silently under-enforces.
const TOKENED_DECLARATION_PROPERTIES = [
  "color",
  "background",
  "background-color",
  "border-color",
  "fill",
  "stroke",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "row-gap",
  "column-gap",
  "top",
  "right",
  "bottom",
  "left",
  "border-radius",
];

// Only var(--m-*) design tokens satisfy the strict-value check — any other
// variable, function, or literal (including inherit/currentColor/#fff) fails.
// stylelint-declaration-strict-value only accepts regex as a "/pattern/flags"
// string (its option validator rejects RegExp instances outright).
const TOKEN_VAR_PATTERN = "/^var\\(--m-[a-zA-Z0-9-]+\\)$/";

export const stylelintConfig = {
  plugins: ["stylelint-declaration-strict-value"],
  extends: ["stylelint-config-html/astro"],
  rules: {
    "scale-unlimited/declaration-strict-value": [
      TOKENED_DECLARATION_PROPERTIES,
      {
        ignoreVariables: false,
        ignoreValues: [TOKEN_VAR_PATTERN],
      },
    ],
  },
  ignoreFiles: ["dist/**", "node_modules/**", ".turbo/**"],
};

export default stylelintConfig;
