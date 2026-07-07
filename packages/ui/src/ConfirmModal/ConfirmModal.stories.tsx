import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfirmModal } from "./ConfirmModal";
import { Button } from "../Button/Button";

const meta = {
  title: "Overlays/ConfirmModal",
  component: ConfirmModal,
  args: {
    isOpen: false,
    onOpenChange: () => {},
    title: "",
    description: "",
    confirmLabel: "",
    onConfirm: () => {},
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [isDefaultOpen, setIsDefaultOpen] = useState(false);
      const [isDangerOpen, setIsDangerOpen] = useState(false);
      return (
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={() => setIsDefaultOpen(true)}>Confirm (default)</Button>
          <ConfirmModal
            isOpen={isDefaultOpen}
            onOpenChange={setIsDefaultOpen}
            tone="default"
            title="Publish this post?"
            description="It'll appear on the home feed and your profile right away."
            confirmLabel="Publish"
            onConfirm={() => {}}
          />

          <Button variant="danger" onClick={() => setIsDangerOpen(true)}>
            Confirm (danger)
          </Button>
          <ConfirmModal
            isOpen={isDangerOpen}
            onOpenChange={setIsDangerOpen}
            title="Delete this post?"
            description="This post and all its comments will be permanently removed. This can't be undone."
            confirmLabel="Delete post"
            onConfirm={() => {}}
          />
        </div>
      );
    }
    return <Demo />;
  },
};
