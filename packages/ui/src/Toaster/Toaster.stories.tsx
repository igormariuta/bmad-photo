import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster, addToastSuccess, addToastError } from "./Toaster";
import { Button } from "../Button/Button";

const meta = {
  title: "Overlays/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toaster />
      <Button onClick={() => addToastSuccess("Post published successfully")}>Show success</Button>
      <Button variant="danger" onClick={() => addToastError("Something went wrong")}>
        Show error
      </Button>
    </div>
  ),
};
