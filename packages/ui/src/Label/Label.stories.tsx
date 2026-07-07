import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./Label";

const meta = {
  title: "Label",
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "POSTS",
  },
};

export const Caret: Story = {
  args: {
    children: "MOST ACTIVE USER",
    caret: true,
  },
};

export const MutedOverride: Story = {
  args: {
    children: "VOTE",
    className: "text-eyebrow text-muted2",
  },
};
