import boundaries from "eslint-plugin-boundaries";

/**
 * AD-1 one-way dependency direction: apps/* -> packages/ui -> packages/theme.
 * `theme` may depend on nothing internal; `ui` may depend only on `theme`;
 * `app` may depend on `ui` and `theme`. No element may import an app, and no
 * element may deep-import another workspace member's `src` — only through
 * its published package entry point.
 */
const ELEMENTS = [
  { type: "theme", pattern: "packages/theme" },
  { type: "ui", pattern: "packages/ui" },
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
              allow: {
                element: { types: ["ui", "theme"], fileInternalPath: PUBLISHED_ENTRY },
              },
            },
          ],
        },
      ],
    },
  };
}
