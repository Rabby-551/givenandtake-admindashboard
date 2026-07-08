"use client"

import type React from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plan } from "@/lib/plans"

interface PlanDetailsModalProps {
  planId: string
  isOpen: boolean
  onClose: () => void
  token: string
}

const fetchPlanById = async (id: string, token: string): Promise<Plan> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch plan details")
  }
  const data = await response.json()
  return data.data as Plan
}

const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ planId, isOpen, onClose, token }) => {
  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery<Plan, Error>({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlanById(planId, token),
    enabled: !!planId && !!token,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[24px] font-bold text-[#44B6CA]">Plan Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        ) : isError ? (
          <div className="text-red-500">Error loading plan details</div>
        ) : plan ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Plan Title</label>
              <p className="text-[#595959]">{plan.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Description</label>
              <p className="text-[#595959]">{plan.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Price</label>
              <p className="text-[#595959]">${plan.price.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Duration</label>
              <p className="text-[#595959] capitalize">{plan.valid}</p>
            </div>
            {plan.for !== "candidate" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#595959] mb-1">Max Jobs / Year</label>
                  <p className="text-[#595959]">{plan.maxJobPostsPerYear ?? "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#595959] mb-1">Max Jobs / Month</label>
                  <p className="text-[#595959]">
                    {plan.maxJobPostsPerMonth ?? "Auto (annual/12)"}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Features</label>
              <ul className="list-disc pl-5 text-[#595959]">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Valid For</label>
              <p className="text-[#595959] capitalize">{plan.valid}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Created At</label>
              <p className="text-[#595959]">{new Date(plan.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#595959] mb-1">Updated At</label>
              <p className="text-[#595959]">{new Date(plan.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        ) : null}
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            className="border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white bg-transparent"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PlanDetailsModal
