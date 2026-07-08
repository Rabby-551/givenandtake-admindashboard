"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import FaqList from "./faq-list";
import AddFaqModal from "./add-faq-modal";
import EditFaqModal from "./EditFaqModal";

/** ===== Types ===== */
export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  __v?: number;
}

type ApiListResponse<T> = {
  status: "success" | "error";
  message?: string;
  data: T[];
};

type ApiItemResponse<T> = {
  status: "success" | "error";
  message?: string;
  data: T;
};

/** Form values coming from your Add/Edit modals */
export type FaqFormValues = {
  _id?: string;
  question: string;
  answer: string;
  category?: string;
  /** order may come as a number or "" from the form */
  order: number | "";
};

/** Payload your server expects */
type UpsertPayload = {
  _id?: string;
  question: string;
  answer: string;
  order: number;
  category?: string;
};

const API_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/faqs`; // ← adjust if needed

/** ===== API calls (typed) ===== */
const fetchFaqs = async (): Promise<Faq[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch FAQs");
  const json: ApiListResponse<Faq> = await res.json();
  return json.data;
};

const upsertFaq = async (faq: FaqFormValues): Promise<ApiItemResponse<Faq>> => {
  const payload: UpsertPayload = {
    ...(faq._id ? { _id: faq._id } : {}),
    question: faq.question,
    answer: faq.answer,
    order: faq.order === "" ? 0 : Number(faq.order),
    ...(faq.category ? { category: faq.category } : {}),
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save FAQ");
  const json: ApiItemResponse<Faq> = await res.json();
  return json;
};

const deleteFaq = async (id: string): Promise<{ status: string; message?: string }> => {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete FAQ");
  return res.json() as Promise<{ status: string; message?: string }>;
};

/** ===== Component ===== */
export default function FaqPage() {
  const queryClient = useQueryClient();

  // UI state
  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

  const { data: faqs, isLoading: isListLoading } = useQuery<Faq[]>({
    queryKey: ["faqs"],
    queryFn: fetchFaqs,
  });

  const upsertMutation = useMutation<ApiItemResponse<Faq>, Error, FaqFormValues>({
    mutationFn: upsertFaq,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faqs"] }),
  });

  const deleteMutation = useMutation<{ status: string; message?: string }, Error, string>({
    mutationFn: deleteFaq,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["faqs"] }),
  });

  // Add submit
  const handleAddSubmit = (form: FaqFormValues) => {
    upsertMutation.mutate(form, {
      onSuccess: () => setAddOpen(false),
    });
  };

  // Edit open
  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setEditOpen(true);
  };

  // Edit submit
  const handleEditSubmit = (form: FaqFormValues) => {
    upsertMutation.mutate(form, {
      onSuccess: () => {
        setEditOpen(false);
        setEditingFaq(null);
      },
    });
  };

  // Delete
  const handleDelete = (id: string) => {
    // keep browser confirm for now; could replace with a modal for better UX
    if (confirm("Delete this FAQ?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
        <Button onClick={() => setAddOpen(true)} className="bg-[#42A3B2] text-white cursor-pointer">
          Add FAQ
        </Button>
      </div>

      {isListLoading ? (
        <div className="p-6">Loading FAQs…</div>
      ) : (
        <FaqList
          faqs={faqs ?? []}
          onDelete={handleDelete}
          onEdit={handleEdit}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Add */}
      <AddFaqModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddSubmit}
        isLoading={upsertMutation.isPending}
      />

      {/* Edit */}
      <EditFaqModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditingFaq(null);
        }}
        initialFaq={editingFaq}
        onSubmit={handleEditSubmit}
        isLoading={upsertMutation.isPending}
      />
    </div>
  );
}
