"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { toast } from "sonner"

// Interface for JobCategory (no categoryIcon)
interface JobCategory {
  _id: string
  name: string
  role: string[]
  createdAt: string
  updatedAt: string
  __v: number
}

// Interface for EditCategoryModalProps
interface EditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: JobCategory | null
  onSubmit: (id: string, formData: FormData) => void
  isPending: boolean
}

// Utility function to safely parse and normalize roles
const normalizeRoles = (roles: string[] | undefined): string[] => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return [
      "Academic/Faculty Pharmacist",
      "Clinical Pharmacist",
      "Community Pharmacist",
      "Consultant Pharmacist",
      "Drug Safety Specialist",
      "Formulation Scientist",
    ]
  }
  const normalized = roles.flatMap((role) => {
    try {
      const parsed = JSON.parse(role)
      return Array.isArray(parsed) ? parsed : [role]
    } catch {
      return [role]
    }
  })
  return [...new Set(normalized.filter((r) => typeof r === "string" && r.trim()))]
}

const EditCategoryModal = ({ open, onOpenChange, category, onSubmit, isPending }: EditCategoryModalProps) => {
  const [editCategoryName, setEditCategoryName] = useState(category?.name || "")
  const [editRoles, setEditRoles] = useState<string[]>(normalizeRoles(category?.role))
  const [editRoleInput, setEditRoleInput] = useState("")

  // Reset form state when category changes
  useEffect(() => {
    setEditCategoryName(category?.name || "")
    setEditRoles(normalizeRoles(category?.role))
    setEditRoleInput("")
  }, [category])

  const handleAddEditRole = () => {
    if (editRoleInput.trim()) {
      const trimmedRole = editRoleInput.trim()
      if (editRoles.includes(trimmedRole)) {
        toast.error("Role already exists")
        return
      }
      setEditRoles([...editRoles, trimmedRole])
      setEditRoleInput("")
    }
  }

  const handleRemoveEditRole = (index: number) => {
    setEditRoles(editRoles.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!category) {
      toast.error("No category selected")
      return
    }
    if (isPending) return // Prevent submission if already pending
    const errors: string[] = []
    if (!editCategoryName) errors.push("Category name is required")
    if (editRoles.length === 0) errors.push("At least one role is required")

    if (errors.length > 0) {
      toast.error(errors.join(", "))
      return
    }

    const formData = new FormData()
    formData.append("name", editCategoryName)
    formData.append("role", JSON.stringify(editRoles))
    onSubmit(category._id, formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="edit-category-title">
      <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none max-w-md">
        <DialogHeader>
          <DialogTitle id="edit-category-title" className="text-[24px] font-bold text-[#44B6CA]">
            Edit Job Category
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <label htmlFor="edit-category-name" className="block text-sm font-medium text-[#595959] mb-2">
              Category Name
            </label>
            <Input
              id="edit-category-name"
              placeholder="Input name..."
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              aria-required="true"
              aria-label="Category name input"
            />
          </div>
          <div>
            <label htmlFor="edit-role-input" className="block text-sm font-medium text-[#595959] mb-2">
              Roles
            </label>
            <div className="flex gap-2">
              <Input
                id="edit-role-input"
                placeholder="Add role..."
                value={editRoleInput}
                onChange={(e) => setEditRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddEditRole()
                  }
                }}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
                aria-required="true"
                aria-label="Add role input"
              />
              <Button
                onClick={handleAddEditRole}
                className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white"
                aria-label="Add role button"
              >
                Add
              </Button>
            </div>
            <div
              className="mt-2 flex flex-wrap gap-2 max-h-62 overflow-y-auto"
              role="listbox"
              aria-label="List of roles"
              tabIndex={0} // Enables keyboard focus
            >
              {editRoles.map((role, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span>{role}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEditRole(index)}
                    className="p-0 h-auto hover:bg-[#44B6CA] hover:text-white"
                    aria-label={`Remove role ${role}`}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Cancel editing category"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white"
            onClick={handleSubmit}
            disabled={isPending}
            aria-disabled={isPending}
            aria-label="Update category"
          >
            {isPending ? "Updating..." : "Update Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditCategoryModal