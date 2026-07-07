import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch } from "./Switch";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  args: { id: "switch", label: "Switch", checked: false, onChange: () => {} },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {
  render: () => {
    function OnSwitch() {
      const [checked, setChecked] = useState(true);
      return <Switch id="switch-on" label="Notifications" checked={checked} onChange={setChecked} />;
    }
    return <OnSwitch />;
  },
};

export const Off: Story = {
  args: {
    id: "switch-off",
    label: "Notifications",
    checked: false,
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    id: "switch-disabled",
    label: "Notifications",
    checked: true,
    disabled: true,
    onChange: () => {},
  },
};

export const ErrorRequired: Story = {
  args: {
    id: "switch-error",
    label: "Accept the house rules",
    checked: false,
    required: true,
    error: "You must accept to continue",
    onChange: () => {},
  },
};
