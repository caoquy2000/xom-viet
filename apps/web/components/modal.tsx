"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose(): void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal ${wide ? "modal-wide" : ""}`}
          aria-describedby={description ? "modal-description" : undefined}
        >
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Đóng">
              <X size={22} />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description id="modal-description" className="muted">
              {description}
            </Dialog.Description>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
