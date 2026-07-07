import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";

const meta = {
  title: "Forms/Textarea",
  component: Textarea,
  args: { id: "textarea", label: "Textarea" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    id: "textarea-empty",
    label: "Biography",
  },
};

export const Filled: Story = {
  render: () => {
    function FilledTextarea() {
      const [value, setValue] = useState("A short bio that wraps onto more than one line.");
      return (
        <Textarea
          id="textarea-filled"
          label="Biography"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }
    return <FilledTextarea />;
  },
};

export const Error: Story = {
  args: {
    id: "textarea-error",
    label: "Biography",
    defaultValue: "x",
    error: "Bio must be at least 20 characters",
  },
};

export const Disabled: Story = {
  args: {
    id: "textarea-disabled",
    label: "Biography",
    defaultValue: "Read-only bio.",
    disabled: true,
  },
};
