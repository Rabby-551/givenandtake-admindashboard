// plans.ts
export interface Plan {
  _id: string
  title: string
  titleColor: string
  description: string
  price: number
  features: string[]
  for: "candidate" | "company" | "recruiter"
  valid: "monthly" | "yearly" | "PayAsYouGo"
  maxJobPostsPerYear?: number
  maxJobPostsPerMonth?: number
  createdAt: string
  updatedAt: string
  __v: number
}


export interface ApiResponse {
  success: boolean
  message: string
  data: Plan[] | Plan
}

// Fetch all plans
export const fetchPlans = async (token: string): Promise<Plan[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch plans")
  }
  const data: ApiResponse = await response.json()
  return data.data as Plan[]
}

// Fetch single plan
export const fetchPlanById = async (id: string, token: string): Promise<Plan> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to fetch plan details")
  }
  const data: ApiResponse = await response.json()
  return data.data as Plan
}

// Create a new plan
export const createPlan = async (
  newPlan: Omit<Plan, "_id" | "createdAt" | "updatedAt" | "__v">,
  token: string,
): Promise<Plan> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newPlan),
  })
  if (!response.ok) {
    throw new Error("Failed to create plan")
  }
  return response.json()
}

// Update a plan
export const updatePlan = async ({
  id,
  updatedPlan,
  token,
}: {
  id: string
  updatedPlan: Omit<Plan, "_id" | "createdAt" | "updatedAt" | "__v">
  token: string
}): Promise<Plan> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedPlan),
  })
  if (!response.ok) {
    throw new Error("Failed to update plan")
  }
  return response.json()
}

// Delete a plan
export const deletePlan = async ({ id, token }: { id: string; token: string }): Promise<void> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/subscription/plans/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error("Failed to delete plan")
  }
}
