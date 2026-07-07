import type { Meta, StoryObj } from "@storybook/react-vite";
import { InfoBox } from "./InfoBox";

const meta = {
  title: "Feedback/InfoBox",
  component: InfoBox,
  args: {
    children: "Drafts never reach the home feed — the unpublished overlay only ever shows to you.",
  },
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: {
    tone: "danger",
    children: "This action can't be undone — all comments on this post will be permanently removed.",
  },
};
