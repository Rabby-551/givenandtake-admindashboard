"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Reuse your shared types:
import type { Faq, FaqFormValues } from "./faq-page"; // or wherever you exported them

interface EditFaqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFaq: Faq | null;                 // {_id, question, answer, order, ...}
  onSubmit: (faq: FaqFormValues) => void; // will include _id
  isLoading: boolean;
}

type FormState = {
  _id?: string;
  question: string;
  answer: string;
  order: string | number;
};

const emptyForm: FormState = {
  question: "",
  answer: "",
  order: "",
};

export default function EditFaqModal({
  open,
  onOpenChange,
  initialFaq,
  onSubmit,
  isLoading,
}: EditFaqModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open && initialFaq) {
      setForm({
        _id: initialFaq._id,
        question: initialFaq.question ?? "",
        answer: initialFaq.answer ?? "",
        order: initialFaq.order ?? "",
      });
    }
  }, [open, initialFaq]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;

    const payload: FaqFormValues = {
      _id: form._id,
      question: form.question,
      answer: form.answer,
      order: form.order === "" ? 0 : Number(form.order),
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Edit FAQ</DialogTitle>
          <DialogDescription>Update this FAQ entry</DialogDescription>
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
              rows={4}
              value={form.answer}
              onChange={(e) => handleChange("answer", e.target.value)}
              required
            />
          </div>

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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Close
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !form.question.trim() || !form.answer.trim()}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
