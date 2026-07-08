"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Interface for JobCategory (no categoryIcon)
interface JobCategory {
  _id: string
  name: string
  role: string[]
  createdAt: string
  updatedAt: string
  __v: number
}

// Interface for DetailsCategoryModalProps
interface DetailsCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: JobCategory | null
  isLoading: boolean
}

const DetailsCategoryModal = ({ open, onOpenChange, category, isLoading }: DetailsCategoryModalProps) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid Date"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="category-details-title">
      <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none max-w-md">
        <DialogHeader>
          <DialogTitle id="category-details-title" className="text-[24px] font-bold text-[#44B6CA]">
            Category Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" aria-hidden="true"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" aria-hidden="true"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" aria-hidden="true"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" aria-hidden="true"></div>
            </div>
          ) : category ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[#595959] mb-2" id="category-name-label">
                  Category Name
                </label>
                <p className="text-base text-[#595959]" aria-labelledby="category-name-label">
                  {category.name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#595959] mb-2" id="category-roles-label">
                  Roles
                </label>
                <div
                  className="mt-2 flex flex-wrap gap-2 max-h-62 overflow-y-auto"
                  role="listbox"
                  aria-label="List of roles"
                  tabIndex={0} // Enables keyboard focus
                >
                  {category.role && category.role.length > 0 ? (
                    category.role.map((role, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded text-sm text-[#595959]"
                        role="listitem"
                        tabIndex={0} // Makes each role focusable
                      >
                        {role}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-[#595959]">No roles available</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#595959] mb-2" id="category-created-label">
                  Created At
                </label>
                <p className="text-base text-[#595959]" aria-labelledby="category-created-label">
                  {formatDate(category.createdAt)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#595959] mb-2" id="category-updated-label">
                  Last Updated
                </label>
                <p className="text-base text-[#595959]" aria-labelledby="category-updated-label">
                  {formatDate(category.updatedAt)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-center text-[#595959]" aria-live="polite">
              No category details available
            </p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close category details modal"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DetailsCategoryModal