import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnderlineTabs, type UnderlineTabItem } from "./UnderlineTabs";

const TABS: UnderlineTabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

const meta = {
  title: "Navigation/UnderlineTabs",
  component: UnderlineTabs,
  args: { ariaLabel: "Demo tabs", current: "", onSelect: () => {}, tabs: TABS },
} satisfies Meta<typeof UnderlineTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [current, setCurrent] = useState("overview");
      return <UnderlineTabs ariaLabel="Demo tabs" current={current} onSelect={setCurrent} tabs={TABS} />;
    }
    return <Demo />;
  },
};

export const NoBaseline: Story = {
  render: () => {
    function Demo() {
      const [current, setCurrent] = useState("overview");
      return (
        <UnderlineTabs
          ariaLabel="Demo tabs (no baseline)"
          baseline={false}
          current={current}
          onSelect={setCurrent}
          tabs={TABS}
        />
      );
    }
    return <Demo />;
  },
};
