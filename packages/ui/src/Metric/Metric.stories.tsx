import type { Meta, StoryObj } from "@storybook/react-vite";
import { Metric } from "./Metric";
import { Dot } from "../Dot/Dot";

const meta = {
  title: "Data Display/Metric",
  component: Metric,
  args: { kind: "likes", value: 412 },
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Likes: Story = {
  args: { kind: "likes", value: 412 },
};

export const Views: Story = {
  args: { kind: "views", value: 18240 },
};

export const Posts: Story = {
  args: { kind: "posts", value: 37 },
};

export const Comments: Story = {
  args: { kind: "comments", value: 88 },
};

export const Rating: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Metric kind="rating" value={42} />
      <Metric kind="rating" value={-7} />
      <Metric kind="rating" value={0} />
    </div>
  ),
};

export const Accent: Story = {
  args: { kind: "likes", value: 413, accent: true },
};

export const MetaRow: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2.5 text-caption text-muted">
      <span>@username</span>
      <Dot />
      <span>14 Jun</span>
      <Dot />
      <Metric kind="comments" value={12} />
      <Dot />
      <Metric kind="views" value={840} />
    </div>
  ),
};
