import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select, type SelectOption } from "./Select";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "ai", label: "AI & Machine Learning" },
  { value: "web", label: "Web Development" },
  { value: "mobile", label: "Mobile" },
  { value: "design", label: "Design" },
];

const meta = {
  title: "Select",
  component: Select,
  args: { id: "select", label: "Select", options: CATEGORY_OPTIONS, value: "", onChange: () => {} },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyPlaceholder: Story = {
  render: () => {
    function EmptySelect() {
      const [value, setValue] = useState<string>("");
      return (
        <Select
          id="select-empty"
          label="Category"
          placeholder="Pick one…"
          options={CATEGORY_OPTIONS}
          value={value}
          onChange={(next) => setValue(next as string)}
        />
      );
    }
    return <EmptySelect />;
  },
};

export const FilledSingle: Story = {
  render: () => {
    function FilledSelect() {
      const [value, setValue] = useState<string>("web");
      return (
        <Select
          id="select-filled"
          label="Category"
          options={CATEGORY_OPTIONS}
          value={value}
          onChange={(next) => setValue(next as string)}
        />
      );
    }
    return <FilledSelect />;
  },
};

export const ErrorRequiredMultiple: Story = {
  render: () => {
    function MultiSelect() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Select
          id="select-multi"
          label="Categories"
          multiple
          required
          options={CATEGORY_OPTIONS}
          value={value}
          onChange={(next) => setValue(next as string[])}
          error="Pick at least one category"
        />
      );
    }
    return <MultiSelect />;
  },
};

export const Disabled: Story = {
  args: {
    id: "select-disabled",
    label: "Category",
    disabled: true,
    options: CATEGORY_OPTIONS,
    value: "ai",
    onChange: () => {},
  },
};
