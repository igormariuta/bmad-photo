import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatBar } from "./StatBar";

const meta = {
  title: "Data Display/StatBar",
  component: StatBar,
  args: { label: "CPU", value: 38, cells: 48 },
} satisfies Meta<typeof StatBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidValue: Story = {
  args: { label: "CPU", value: 38, cells: 48 },
};

export const LowValue: Story = {
  args: { label: "Motivation", value: 4, cells: 48 },
};

export const NearFull: Story = {
  args: { label: "Caffeine", value: 98, cells: 48 },
};
