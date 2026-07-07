import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Modal } from "./Modal";
import { ModalHeader } from "./ModalHeader";
import { Button } from "../Button/Button";

const meta = {
  title: "Overlays/Modal",
  component: Modal,
  args: { isOpen: false, onOpenChange: () => {}, labelledBy: "modal-title", children: () => null },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [isOpen, setIsOpen] = useState(false);
      const titleId = useId();
      return (
        <>
          <Button variant="outline" onClick={() => setIsOpen(true)}>
            Open demo modal
          </Button>
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} labelledBy={titleId}>
            {(close) => (
              <>
                <ModalHeader
                  eyebrow="// DEMO"
                  title="Save changes?"
                  titleId={titleId}
                  subtitle="The real Modal shell — focus-trapped, Esc + backdrop close, body scroll locked."
                  onClose={close}
                />
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    close();
                  }}
                >
                  <Button type="submit" fullWidth>
                    Save
                  </Button>
                </form>
              </>
            )}
          </Modal>
        </>
      );
    }
    return <Demo />;
  },
};
