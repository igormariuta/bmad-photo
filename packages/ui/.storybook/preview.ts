import type { Preview } from "@storybook/react-vite";
import "./preview.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "bg",
      values: [
        { name: "bg", value: "var(--m-bg)" },
        { name: "dark", value: "#181818" },
      ],
    },
  },
};

export default preview;
