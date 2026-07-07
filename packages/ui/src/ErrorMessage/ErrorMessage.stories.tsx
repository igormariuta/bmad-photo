import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorMessage } from "./ErrorMessage";

const meta = {
  title: "Feedback/ErrorMessage",
  component: ErrorMessage,
  args: { error: new Error("Cannot read 'energy' of undefined"), status: 500 },
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
