import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./Panel";

const meta = {
  title: "Layout/Panel",
  component: Panel,
  args: {
    caption: "// FOCAL LENGTH",
    children: <p className="text-body text-fg">Panel content</p>,
  },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Bordered: Story = { args: { bordered: true } };
export const MutedTone: Story = { args: { tone: "muted", caption: "// PILLAR" } };
