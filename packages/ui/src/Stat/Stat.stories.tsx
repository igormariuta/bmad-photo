import type { Meta, StoryObj } from "@storybook/react-vite";
import { StarIcon, EyeIcon } from "@heroicons/react/24/solid";
import { Stat } from "./Stat";

const meta = {
  title: "Data Display/Stat",
  component: Stat,
  args: { label: "KARMA", value: "1,240", signOf: 1240 },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
  args: { label: "KARMA", value: "1,240", signOf: 1240, sub: "net rating", subIcon: StarIcon },
};

export const Negative: Story = {
  args: { label: "KARMA", value: "-12", signOf: -12, sub: "net rating", subIcon: StarIcon },
};

export const Zero: Story = {
  args: { label: "TOTAL VIEWS", value: "0", signOf: 0, sub: "views total", subIcon: EyeIcon },
};
