import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "RadioGroup",
  component: RadioGroup,
  args: { name: "radio", label: "Radio", value: "", onChange: () => {}, options: [] },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultSelection: Story = {
  render: () => {
    function FeedSortRadioGroup() {
      const [value, setValue] = useState("standard");
      return (
        <RadioGroup
          name="feed-sort"
          label="Feed sort"
          required
          value={value}
          onChange={setValue}
          options={[
            { value: "standard", label: "Standard feed" },
            { value: "chrono", label: "Chronological" },
            { value: "top", label: "Top this week" },
          ]}
        />
      );
    }
    return <FeedSortRadioGroup />;
  },
};
