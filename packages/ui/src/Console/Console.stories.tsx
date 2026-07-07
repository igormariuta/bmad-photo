import type { Meta, StoryObj } from "@storybook/react-vite";
import { Console } from "./Console";

const meta = {
  title: "Overlays/Console",
  component: Console,
  args: { title: "stacktrace.log", children: null },
} satisfies Meta<typeof Console>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Console title="stacktrace.log">
      <span className="text-error">Error</span>
      {": "}
      <span className="text-fg">Cannot read &apos;energy&apos; of undefined</span>
    </Console>
  ),
};
