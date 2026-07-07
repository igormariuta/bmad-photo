import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Button } from "./Button";

const meta = {
  title: "Button",
  component: Button,
  args: { children: "Button" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button>Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Delete</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button disabled>Primary</Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="danger" disabled>
        Delete
      </Button>
    </div>
  ),
};

export const HrefAsAnchor: Story = {
  render: () => <Button href="#button">Anchor button</Button>,
};

export const FullWidth: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-xs">
      <Button type="submit" fullWidth>
        Log in
      </Button>
    </form>
  ),
};

export const Pending: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()} className="max-w-xs">
      <Button type="submit" fullWidth pending pendingLabel="Signing in…">
        Log in
      </Button>
    </form>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <Button type="submit" iconOnly>
        Publish post
      </Button>
    </form>
  ),
};

export const IconOnlyCustomIcon: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <Button type="submit" iconOnly icon={CheckIcon}>
        Save draft
      </Button>
    </form>
  ),
};

export const IconOnlyPending: Story = {
  render: () => (
    <form onSubmit={(e) => e.preventDefault()}>
      <Button type="submit" iconOnly pending>
        Publishing…
      </Button>
    </form>
  ),
};
