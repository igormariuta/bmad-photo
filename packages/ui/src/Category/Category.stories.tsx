import type { Meta, StoryObj } from "@storybook/react-vite";
import { Category } from "./Category";

const meta = {
  title: "Data Display/Category",
  component: Category,
  args: { children: "ai" },
} satisfies Meta<typeof Category>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
