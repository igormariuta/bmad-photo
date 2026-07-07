import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkline } from "./Sparkline";

const meta = {
  title: "Data Display/Sparkline",
  component: Sparkline,
  args: { series: [2, 5, 3, 8, 6, 9], gradientId: "story-spark", ariaLabel: "Posts per month" },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithData: Story = {
  args: { series: [2, 5, 3, 8, 6, 9], gradientId: "story-spark-data", ariaLabel: "Posts per month over the last six months" },
};

export const AllZero: Story = {
  args: { series: [0, 0, 0, 0, 0, 0], gradientId: "story-spark-empty", ariaLabel: "No posts in the last six months" },
};
