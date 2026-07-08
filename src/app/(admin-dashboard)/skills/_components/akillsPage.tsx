"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Search, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Schema for Skill
const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
})

// Interface for Skill
interface Skill {
  _id: string
  name: string
  categoryIcon: string
  createdAt: string
  updatedAt: string
  __v: number
}

// Interface for API Response
interface ApiResponse {
  success: boolean
  message: string
  data: Skill[]
}

// Skeleton Row
const SkeletonRow = () => (
  <TableRow>
    <TableCell>
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </TableCell>
    <TableCell>
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </TableCell>
  </TableRow>
)

// Skills Table Component with Refined Design
interface SkillsTableProps {
  skills: Skill[]
  isLoading: boolean
  isError: boolean
  onEdit: (skill: Skill) => void
  onDelete: (id: string) => void
}

const SkillsTable = ({ skills, isLoading, isError, onEdit, onDelete }: SkillsTableProps) => (
  <div className="">
    <Table className="min-w-full">
      <TableHeader className="bg-[#DFFAFF]">
        <TableRow>
          <TableHead className="px-6 py-3 text-left text-base font-semibold text-[#595959] uppercase border-b border-[#BFBFBF]">
            Skill Name
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-base font-semibold text-[#595959] uppercase border-b border-[#BFBFBF]">
            Added Date
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-base font-semibold text-[#595959] uppercase border-b border-[#BFBFBF]">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-[#BFBFBF]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <SkeletonRow key={`skeleton-${index}`} />)
        ) : isError ? (
          <TableRow>
            <TableCell colSpan={3} className="px-6 py-4 text-center text-red-500">
              Error loading skills. Please try again later.
            </TableCell>
          </TableRow>
        ) : skills.length > 0 ? (
          skills.map((skill) => (
            <TableRow
              key={skill._id}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <TableCell className="px-6 py-4 text-base font-normal text-[#595959]">
                {skill.name}
              </TableCell>
              <TableCell className="px-6 py-4 text-base font-normal text-[#595959]">
                {skill.createdAt
                  ? new Date(skill.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Invalid Date"}
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(skill)}
                    className="hover:bg-[#44B6CA] hover:text-white text-[#737373]"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(skill._id)}
                    className="hover:bg-red-500 hover:text-white text-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={3} className="px-6 py-4 text-center text-[#595959]">
              No skills found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
)

export default function SkillsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const { data: session, status } = useSession()
  const token = session?.user?.accessToken
  const itemsPerPage = 10

  // Form setup
  const form = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: "" },
  })

  // Fetch skills
  const { data, isLoading, isError, refetch } = useQuery<ApiResponse>({
    queryKey: ["skills", searchTerm],
    queryFn: async () => {
      if (!token) throw new Error("No authentication token available")
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
      })
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to fetch skills")
      }
      const data = await response.json()
      return data as ApiResponse
    },
    enabled: status === "authenticated",
  })

  // Filter and paginate skills client-side
  const skills = data?.data || []
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage) || 1
  const paginatedSkills = filteredSkills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Add/Update mutation (sending JSON)
  const crudMutation = useMutation({
    mutationFn: async (values: z.infer<typeof skillSchema>) => {
      if (!token) throw new Error("No authentication token available")
      const url = editingSkill
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/skill/${editingSkill._id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/skill`
      const method = editingSkill ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: values.name, categoryIcon: "" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${editingSkill ? "update" : "add"} skill`)
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success(`${editingSkill ? "Skill updated" : "Skill added"} successfully!`)
      setIsCrudModalOpen(false)
      setEditingSkill(null)
      form.reset()
      setCurrentPage(1)
      setSearchTerm("")
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || `Failed to ${editingSkill ? "update" : "add"} skill`)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("No authentication token available")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/skill/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete skill")
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success("Skill deleted successfully!")
      setIsDeleteModalOpen(false)
      setSkillToDelete(null)
      setCurrentPage(1)
      setSearchTerm("")
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete skill")
    },
  })

  const openAddModal = () => {
    setEditingSkill(null)
    form.reset({ name: "" })
    setIsCrudModalOpen(true)
  }

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill)
    form.setValue("name", skill.name)
    setIsCrudModalOpen(true)
  }

  const handleDeleteConfirm = (id: string) => {
    setSkillToDelete(id)
    setIsDeleteModalOpen(true)
  }

  // Manual pagination controls
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    if (currentPage - delta > 2) range.unshift("...")
    if (currentPage + delta < totalPages - 1) range.push("...")
    if (!range.includes(1)) range.unshift(1)
    if (!range.includes(totalPages)) range.push(totalPages)
    return range
  }

  const visiblePages = getVisiblePages()

  if (status === "loading") {
    return <div className="text-center text-[#595959]">Loading session...</div>
  }

  if (!session) {
    return <div className="text-center text-[#595959]">Please sign in to view skills.</div>
  }

  if (isError) {
    return <div className="text-center text-red-500">Error loading skills. Please try again later.</div>
  }

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="bg-[#DFFAFF] rounded-[8px]">
          <CardTitle className="flex items-center justify-between py-[25px]">
            <div className="flex items-center gap-2 text-[40px] font-bold text-[#44B6CA]">
              <Settings className="h-[32px] w-[32px]" />
              Skills List
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#595959]" />
                <Input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 pr-4 py-2 w-[250px] border-[#BFBFBF] focus:ring-[#44B6CA]"
                />
              </div>
              <Button
                onClick={openAddModal}
                className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkillsTable
            skills={paginatedSkills}
            isLoading={isLoading}
            isError={isError}
            onEdit={openEditModal}
            onDelete={handleDeleteConfirm}
          />
          {filteredSkills.length > itemsPerPage && (
            <div className="mt-4 flex justify-center items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-[#BFBFBF] hover:bg-[#44B6CA] hover:text-white disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {visiblePages.map((page, index) => (
                <Button
                  key={index}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  disabled={page === "..."}
                  className={`border-[#BFBFBF] min-w-[44px] ${
                    page === currentPage
                      ? "bg-[#44B6CA] text-white"
                      : "hover:bg-[#44B6CA] hover:text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label={typeof page === "number" ? `Go to page ${page}` : undefined}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-[#BFBFBF] hover:bg-[#44B6CA] hover:text-white disabled:opacity-50"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRUD Modal (Add/Update) */}
      <Dialog open={isCrudModalOpen} onOpenChange={setIsCrudModalOpen}>
        <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none">
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Edit Skill" : "Add Skill"}</DialogTitle>
            <DialogDescription>
              {editingSkill ? "Update the skill details below." : "Enter the new skill details."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => crudMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., JavaScript" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={crudMutation.isPending}>
                  {crudMutation.isPending ? "Saving..." : editingSkill ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {skillToDelete && skills.find((s) => s._id === skillToDelete)?.name}&quot;? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              No
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-900 text-white"
              onClick={() => skillToDelete && deleteMutation.mutate(skillToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}