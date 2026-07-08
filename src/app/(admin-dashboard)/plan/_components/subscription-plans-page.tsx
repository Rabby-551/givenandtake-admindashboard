"use client";

import type React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import SubscriptionPlansList from "./subscription-plans-list";
import SubscriptionPlanForm from "./subscription-plan-form";
import PlanDetailsModal from "./plan-details-modal";
import DeletePlanModal from "./delete-plan-modal";
import QueryProvider from "./query-client-provider";
import { fetchPlans, createPlan, updatePlan, deletePlan, Plan } from "@/lib/plans";
import { useSession } from "next-auth/react";

export interface PlanFormData {
  title: string;
  titleColor: string;
  description: string;
  price: string;
  features: string[];
  for: "" | "candidate" | "company" | "recruiter";
  valid: "PayAsYouGo" | "monthly" | "yearly";
  maxJobPostsPerYear: string;
  maxJobPostsPerMonth: string;
}

const createEmptyForm = (): PlanFormData => ({
  title: "",
  titleColor: "#44B6CA",
  description: "",
  price: "",
  features: [""],
  for: "",
  valid: "PayAsYouGo",
  maxJobPostsPerYear: "",
  maxJobPostsPerMonth: "",
});

const SubscriptionPlansPageContent: React.FC = () => {
  const session = useSession();
  const token = session.data?.user?.accessToken;

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(createEmptyForm());
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery<Plan[], Error>({
    queryKey: ["plans"],
    queryFn: () => {
      if (!token) throw new Error("No authentication token available");
      return fetchPlans(token);
    },
    enabled: !!token,
  });

  const totalPages = plans ? Math.ceil(plans.length / itemsPerPage) : 1;
  const paginatedPlans = plans
    ? plans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const handlePageChange = (page: number) => setCurrentPage(page);

  const createMutation = useMutation<
    Plan,
    Error,
    Omit<Plan, "_id" | "createdAt" | "updatedAt" | "__v">
  >({
    mutationFn: (newPlan) => {
      if (!token) throw new Error("No authentication token available");
      return createPlan(newPlan, token);
    },
    onSuccess: () => {
      toast.success("Plan added successfully!");
      resetForm();
      setShowAddForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to add plan. Please try again.");
      console.error("Error adding plan:", error);
    },
  });

  const updateMutation = useMutation<
    Plan,
    Error,
    { id: string; updatedPlan: Omit<Plan, "_id" | "createdAt" | "updatedAt" | "__v"> }
  >({
    mutationFn: ({ id, updatedPlan }) => {
      if (!token) throw new Error("No authentication token available");
      return updatePlan({ id, updatedPlan, token });
    },
    onSuccess: () => {
      toast.success("Plan updated successfully!");
      resetForm();
      setEditPlan(null);
      setShowAddForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to update plan. Please try again.");
      console.error("Error updating plan:", error);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => {
      if (!token) throw new Error("No authentication token available");
      return deletePlan({ id, token });
    },
    onSuccess: () => {
      toast.success("Plan deleted successfully!");
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete plan. Please try again.");
      console.error("Error deleting plan:", error);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    if (name === "features" && index !== undefined) {
      setFormData((prev) => {
        const newFeatures = [...prev.features];
        newFeatures[index] = value;
        return { ...prev, features: newFeatures };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (field: "for" | "valid", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addFeatureField = () => setFormData((prev) => ({ ...prev, features: [...prev.features, ""] }));
  const removeFeatureField = (index: number) =>
    setFormData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));

  const handleSubmit = () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      formData.features.some((f) => !f) ||
      !formData.for ||
      !formData.valid
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const annual =
      formData.maxJobPostsPerYear.trim() === ""
        ? undefined
        : Number.parseInt(formData.maxJobPostsPerYear, 10);
    const monthly =
      formData.maxJobPostsPerMonth.trim() === ""
        ? undefined
        : Number.parseInt(formData.maxJobPostsPerMonth, 10);

    if (formData.for !== "candidate") {
      if (annual !== undefined && Number.isNaN(annual)) {
        toast.error("Max job posts per year must be a number");
        return;
      }
      if (monthly !== undefined && Number.isNaN(monthly)) {
        toast.error("Max job posts per month must be a number");
        return;
      }
    }

    const planData: Omit<Plan, "_id" | "createdAt" | "updatedAt" | "__v"> = {
      title: formData.title,
      titleColor: formData.titleColor,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      features: formData.features.filter((f) => f.trim() !== ""),
      for: formData.for as "candidate" | "company" | "recruiter",
      valid: formData.valid,
      maxJobPostsPerYear: annual,
      maxJobPostsPerMonth: monthly,
    };

    if (editPlan) {
      updateMutation.mutate({ id: editPlan._id, updatedPlan: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const resetForm = () => setFormData(createEmptyForm());

  const handleAddPlan = () => {
    setShowAddForm(true);
    setEditPlan(null);
    resetForm();
  };

  const handleEditPlan = (plan: Plan) => {
    setEditPlan(plan);
    setFormData({
      title: plan.title,
      titleColor: plan.titleColor || "#44B6CA",
      description: plan.description,
      price: plan.price.toString(),
      features: plan.features.length > 0 ? plan.features : [""],
      for: plan.for,
      valid: plan.valid,
      maxJobPostsPerYear: plan.maxJobPostsPerYear?.toString() || "",
      maxJobPostsPerMonth: plan.maxJobPostsPerMonth?.toString() || "",
    });
    setShowAddForm(true);
  };

  const handleDeletePlan = (plan: Plan) => {
    setPlanToDelete(plan);
    setIsDeleteModalOpen(true);
  };

  const handleViewDetails = (planId: string) => {
    setSelectedPlanId(planId);
    setIsDetailsModalOpen(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditPlan(null);
    resetForm();
  };

  const handleDeleteConfirm = () => {
    if (planToDelete) deleteMutation.mutate(planToDelete._id);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  if (showAddForm) {
    return (
      <SubscriptionPlanForm
        formData={formData}
        editPlan={editPlan}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onAddFeature={addFeatureField}
        onRemoveFeature={removeFeatureField}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <>
      <SubscriptionPlansList
        plans={paginatedPlans}
        isLoading={isLoading}
        isError={isError}
        onAddPlan={handleAddPlan}
        onEditPlan={handleEditPlan}
        onDeletePlan={handleDeletePlan}
        onViewDetails={handleViewDetails}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <DeletePlanModal
        isOpen={isDeleteModalOpen}
        planToDelete={planToDelete}
        isDeleting={deleteMutation.isPending}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      {selectedPlanId && (
        <PlanDetailsModal
          planId={selectedPlanId}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          token={token ?? ""}
        />
      )}
    </>
  );
};

const SubscriptionPlansPage: React.FC = () => (
  <QueryProvider>
    <SubscriptionPlansPageContent />
  </QueryProvider>
);

export default SubscriptionPlansPage;
