import boundaries from "eslint-plugin-boundaries";

/**
 * AD-1 one-way dependency direction: apps/* -> packages/ui -> packages/theme.
 * `theme` may depend on nothing internal; `ui` may depend only on `theme`;
 * `app` may depend on `ui` and `theme`. No element may import an app, and no
 * element may deep-import another workspace member's `src` — only through
 * its published package entry point.
 *
 * AD-3 (Story 3.1): within `apps/*`, Gallery's `insights/` and `browse/`
 * feature folders are carved out as their own element types so neither can
 * import the other — `insights/` always reflects the full readable set and
 * must stay unaffected by Browse's Facet filters. Both patterns are listed
 * before the generic `app` catch-all so files under them classify as
 * `insights`/`browse` rather than falling through to `app`.
 */
const ELEMENTS = [
  { type: "theme", pattern: "packages/theme" },
  { type: "ui", pattern: "packages/ui" },
  { type: "insights", pattern: "apps/*/src/features/insights" },
  { type: "browse", pattern: "apps/*/src/features/browse" },
  { type: "app", pattern: "apps/*" },
];

// Both @bmad/ui and @bmad/theme publish their package entry at src/index.ts —
// the `fileInternalPath` constraint folds "only through the published entry
// point" (no deep `src/*` imports) directly into the dependency policy.
const PUBLISHED_ENTRY = "src/index.ts";

export function boundariesConfig(rootPath) {
  return {
    plugins: { boundaries },
    settings: {
      "boundaries/root-path": rootPath,
      "boundaries/elements": ELEMENTS,
      // Workspace members are TypeScript, so the resolver needs .ts/.tsx.
      // preserveSymlinks: false makes it realpath through pnpm's
      // node_modules symlinks to the actual packages/* source file —
      // otherwise every workspace import would resolve as "external" and
      // silently bypass the dependency policies.
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
          preserveSymlinks: false,
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "ui" } },
              allow: { element: { type: "theme", fileInternalPath: PUBLISHED_ENTRY } },
            },
            {
              from: { element: { type: "app" } },
              allow: [
                { element: { types: ["ui", "theme"], fileInternalPath: PUBLISHED_ENTRY } },
                // app-shell composes both tab panels directly (Story 3.1) —
                // only insights/browse themselves are restricted below.
                { element: { types: ["insights", "browse"] } },
              ],
            },
            {
              // AD-3: insights/ reads the readable-set selectors off the
              // store (an `app`-typed file) and packages/ui, but never
              // anything from browse/ — no policy below grants it, and the
              // config's `default: "disallow"` makes that the enforced end
              // state.
              from: { element: { type: "insights" } },
              allow: [
                { element: { type: "app" } },
                { element: { type: "ui", fileInternalPath: PUBLISHED_ENTRY } },
              ],
            },
            {
              // AD-3: browse/ may not import from insights/.
              from: { element: { type: "browse" } },
              allow: [
                { element: { type: "app" } },
                { element: { type: "ui", fileInternalPath: PUBLISHED_ENTRY } },
              ],
            },
          ],
        },
      ],
    },
  };
}
