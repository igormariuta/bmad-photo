import type { Meta, StoryObj } from "@storybook/react-vite";
import { PencilSquareIcon, EyeSlashIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Menu } from "./Menu";

const meta = {
  title: "Overlays/Menu",
  component: Menu,
  args: { triggerLabel: "Post options", items: [] },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex justify-end border-2 border-dim p-5">
      <Menu
        triggerLabel="Post options"
        items={[
          {
            id: "edit",
            label: "Edit",
            icon: <PencilSquareIcon className="size-4" />,
            onSelect: () => {},
          },
          {
            id: "hide",
            label: "Hide",
            icon: <EyeSlashIcon className="size-4" />,
            onSelect: () => {},
          },
          {
            id: "delete",
            label: "Delete",
            icon: <TrashIcon className="size-4" />,
            danger: true,
            onSelect: () => {},
          },
        ]}
      />
    </div>
  ),
};
