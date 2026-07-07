import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dot } from "./Dot";

const meta = {
  title: "Data Display/Dot",
  component: Dot,
} satisfies Meta<typeof Dot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
