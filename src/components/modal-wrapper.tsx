import React from "react";
import { Dialog, DialogContent } from "@components/shadcn-ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

type ModalProps = {
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  width?: number;
  hideCloseIcon?: boolean;
};

const ModalWrapper = ({
  isOpen,
  onOpenChange,
  children,
  width,
  hideCloseIcon,
}: ModalProps) => {
  const maxWidth = width ? `${width}px` : `500px`;

  return (
    <Dialog open={isOpen} modal onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={`${
          hideCloseIcon && "[&>button]:hidden"
        } px-2 shadow-none border-none bg-transparent sm:max-w-full`}
        style={{ maxWidth }}
      >
        <DialogTitle className="sr-only"></DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ModalWrapper;
