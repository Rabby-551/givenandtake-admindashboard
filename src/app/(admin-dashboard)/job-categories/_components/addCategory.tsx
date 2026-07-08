"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, X } from "lucide-react"
import { toast } from "sonner"

// Interface for CategoryFormProps
interface CategoryFormProps {
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  isPending: boolean
}

const CategoryForm = ({ onSubmit, onCancel, isPending }: CategoryFormProps) => {
  const [categoryName, setCategoryName] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [roleInput, setRoleInput] = useState("")

  const handleAddRole = () => {
    if (roleInput.trim()) {
      const trimmedRole = roleInput.trim()
      if (roles.includes(trimmedRole)) {
        toast.error("Role already exists")
        return
      }
      setRoles([...roles, trimmedRole])
      setRoleInput("")
    }
  }

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const errors: string[] = []
    if (!categoryName) errors.push("Category name is required")
    if (roles.length === 0) errors.push("At least one role is required")

    if (errors.length > 0) {
      toast.error(errors.join(", "))
      return
    }

    const formData = new FormData()
    formData.append("name", categoryName)
    formData.append("role", JSON.stringify(roles))
    onSubmit(formData)
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-[#DFFAFF] rounded-t-[8px]">
        <CardTitle className="flex items-center gap-2 text-[40px] font-bold text-[#44B6CA] py-[25px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-0 h-auto hover:bg-[#44B6CA] hover:text-white"
            aria-label="Go back"
          >
            <ChevronLeft className="h-[32px] w-[32px] text-[#44B6CA]" />
          </Button>
          Add Job Category
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-[#DFFAFF] rounded-b-[8px]">
        <div className="space-y-6">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-[#595959] mb-2">
              Category Name
            </label>
            <Input
              id="category-name"
              placeholder="Enter category name..."
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="role-input" className="block text-sm font-medium text-[#595959] mb-2">
              Roles
            </label>
            <div className="flex gap-2">
              <Input
                id="role-input"
                placeholder="Add role..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddRole()
                  }
                }}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
                aria-required="true"
              />
              <Button
                onClick={handleAddRole}
                className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white"
                aria-label="Add role"
              >
                Add
              </Button>
            </div>
            <div
              className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto"
              role="listbox"
              aria-label="List of roles"
            >
              {roles.map((role, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span>{role}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRole(index)}
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
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white px-8 py-2 rounded-[8px]"
            disabled={isPending}
            aria-disabled={isPending}
            aria-label="Submit category form"
          >
            {isPending ? "Adding..." : "Add Category"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CategoryForm
