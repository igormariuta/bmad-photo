import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Field } from "./Field";

const meta = {
  title: "Forms/Field",
  component: Field,
  args: { id: "field", label: "Field" },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    id: "field-empty",
    label: "Email",
    type: "email",
    required: true,
  },
};

export const Filled: Story = {
  render: () => {
    function FilledField() {
      const [value, setValue] = useState("filled@example.com");
      return (
        <Field
          id="field-filled"
          label="Email"
          type="email"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    return <FilledField />;
  },
};

export const Error: Story = {
  args: {
    id: "field-error",
    label: "Email",
    type: "email",
    defaultValue: "not-an-email",
    error: "Enter a valid email address",
  },
};

export const Disabled: Story = {
  args: {
    id: "field-disabled",
    label: "Email",
    type: "email",
    defaultValue: "locked@example.com",
    disabled: true,
  },
};

export const Password: Story = {
  args: {
    id: "field-password",
    label: "Password",
    type: "password",
    defaultValue: "hunter2",
    required: true,
  },
};
