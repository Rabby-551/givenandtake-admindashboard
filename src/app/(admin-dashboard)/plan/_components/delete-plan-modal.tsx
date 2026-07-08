"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plan } from "@/lib/plans";

interface DeletePlanModalProps {
  isOpen: boolean;
  planToDelete: Plan | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeletePlanModal: React.FC<DeletePlanModalProps> = ({
  isOpen,
  planToDelete,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-bold text-[#44B6CA]">
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-[#595959]">
            Are you sure you want to delete &quot;{planToDelete?.title}&quot;?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white cursor-pointer bg-transparent"
            onClick={onClose}
            disabled={isDeleting}
          >
            No
          </Button>
          <Button
            className="  text-white cursor-pointer"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePlanModal;
