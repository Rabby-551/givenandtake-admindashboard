"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Reuse your shared types
import type { FaqFormValues } from "./faq-page"; // or wherever you exported it

interface AddFaqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (faq: FaqFormValues) => void;
  isLoading: boolean;
}

type FormState = {
  question: string;
  answer: string;
  category?: string;
  order: string; // input field as string
};

const emptyForm: FormState = {
  question: "",
  answer: "",
  category: "",
  order: "",
};

export default function AddFaqModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: AddFaqModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;

    const payload: FaqFormValues = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      order: form.order === "" ? 0 : Number(form.order),
      ...(form.category ? { category: form.category } : {}),
    };

    onSubmit(payload);
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add New FAQ</DialogTitle>
          <DialogDescription>
            Create a new frequently asked question entry
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Question *
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              placeholder="e.g., How do I reset my password?"
              value={form.question}
              onChange={(e) => handleChange("question", e.target.value)}
              required
            />
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Answer *
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              placeholder="Provide a clear and helpful answer…"
              rows={4}
              value={form.answer}
              onChange={(e) => handleChange("answer", e.target.value)}
              required
            />
          </div>

          {/* (Optional) Category */}
          {/* Uncomment if you want users to set a category now
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Category
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              placeholder="e.g., general"
              value={form.category ?? ""}
              onChange={(e) => handleChange("category", e.target.value)}
            />
          </div>
          */}

          {/* Order */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Order
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              placeholder="0"
              value={form.order}
              onChange={(e) => handleChange("order", e.target.value)}
              min={0}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setForm(emptyForm);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !form.question.trim() || !form.answer.trim()}
            >
              {isLoading ? "Adding..." : "Add FAQ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
