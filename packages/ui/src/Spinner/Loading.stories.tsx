import type { Meta, StoryObj } from "@storybook/react-vite";
import { Loading } from "./Loading";

const meta = {
  title: "Loading",
  component: Loading,
} satisfies Meta<typeof Loading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Block: Story = {
  render: () => <Loading />,
};

export const Inline: Story = {
  render: () => <Loading inline />,
};
