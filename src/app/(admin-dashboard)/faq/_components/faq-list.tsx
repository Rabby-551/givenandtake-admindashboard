"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import type { Faq } from "./faq-page"; // ← or: import type { Faq } from "../FaqPage"

interface FaqListProps {
  faqs: ReadonlyArray<Faq>;
  onDelete: (id: string) => void;
  onEdit: (faq: Faq) => void;
  isDeleting: boolean;
}

export default function FaqList({ faqs, onDelete, onEdit, isDeleting }: FaqListProps) {
  if (!faqs.length) {
    return (
      <Card className="p-12 text-center border-slate-200">
        <div className="mb-4 text-4xl">📚</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No FAQs yet</h3>
        <p className="text-slate-600">Create your first FAQ by clicking the &quot;Add FAQ&quot; button above.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Existing FAQs ({faqs.length})</h2>
      {faqs.map((faq) => (
        <Card key={faq._id} className="p-4 border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 mb-2 text-pretty">{faq.question}</h3>
              <p className="text-slate-700 text-sm mb-3 text-pretty">{faq.answer}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="text-slate-500">
                  Order: <span className="font-medium">{faq.order ?? 0}</span>
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => onEdit(faq)}
              className="flex-shrink-0 cursor-pointer hover:bg-[#42A3B2] hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(faq._id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
