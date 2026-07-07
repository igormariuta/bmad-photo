import { stylelintConfig } from "@bmad/eslint-config/stylelint";

// colors.css and spacing.css are the single source of truth for the --m-*
// tokens themselves — they legitimately hold the literal values every other
// file must instead reference via var(--m-*).
export default {
  ...stylelintConfig,
  ignoreFiles: [...stylelintConfig.ignoreFiles, "src/colors.css", "src/spacing.css"],
};
