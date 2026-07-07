import { useId } from "react";
import { Modal } from "../Modal/Modal";
import { ModalHeader } from "../Modal/ModalHeader";
import { Button } from "../Button/Button";

export interface ConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Defaults to 'danger' — the reference's own usage was always a delete confirmation. */
  tone?: "danger" | "default";
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  isOpen,
  onOpenChange,
  tone = "danger",
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();
  const isDanger = tone === "danger";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} labelledBy={titleId}>
      {(close) => (
        <>
          <ModalHeader
            eyebrow={isDanger ? "// Danger" : "// Confirm"}
            eyebrowClassName={`text-eyebrow uppercase ${isDanger ? "text-error" : "text-accent"}`}
            title={title}
            titleId={titleId}
            subtitle={description}
            onClose={close}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Button variant="outline" fullWidth onClick={close}>
                Cancel
              </Button>
            </div>
            <div className="flex-1">
              <Button
                variant={isDanger ? "danger" : "primary"}
                fullWidth
                onClick={() => {
                  onConfirm();
                  close();
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
