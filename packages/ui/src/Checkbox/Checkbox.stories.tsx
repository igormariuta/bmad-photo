import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: { id: "checkbox", label: "Checkbox", checked: false, onChange: () => {} },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    id: "checkbox-unchecked",
    label: "Email me on replies",
    checked: false,
    onChange: () => {},
  },
};

export const Checked: Story = {
  render: () => {
    function CheckedCheckbox() {
      const [checked, setChecked] = useState(true);
      return (
        <Checkbox id="checkbox-checked" label="Show my drafts publicly" checked={checked} onChange={setChecked} />
      );
    }
    return <CheckedCheckbox />;
  },
};

export const ErrorRequired: Story = {
  args: {
    id: "checkbox-error",
    label: "Accept the house rules",
    checked: false,
    required: true,
    error: "You must accept to continue",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: {
    id: "checkbox-disabled",
    label: "Beta features (locked)",
    checked: true,
    disabled: true,
    onChange: () => {},
  },
};
