"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Interface for DeleteCategoryModalProps
interface DeleteCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  categoryId: string | null
  categoryName?: string
  isPending: boolean
}

const DeleteCategoryModal = ({ open, onOpenChange, onDelete, categoryId, categoryName, isPending }: DeleteCategoryModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="delete-category-title" aria-describedby="delete-category-description">
    <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none max-w-md">
      <DialogHeader>
        <DialogTitle id="delete-category-title" className="text-[24px] font-bold text-[#44B6CA]">
          Confirm Deletion
        </DialogTitle>
        <DialogDescription id="delete-category-description" className="text-[#595959]">
          Are you sure you want to delete {categoryName ? `the "${categoryName}" category` : "this category"}? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-4">
        <Button
          variant="outline"
          className="border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white"
          onClick={() => onOpenChange(false)}
          aria-label="Cancel deletion"
        >
          Cancel
        </Button>
        <Button
          className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white"
          onClick={() => categoryId && onDelete(categoryId)}
          disabled={isPending || !categoryId}
          aria-disabled={isPending || !categoryId}
          aria-label={`Delete ${categoryName || "category"}`}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default DeleteCategoryModal