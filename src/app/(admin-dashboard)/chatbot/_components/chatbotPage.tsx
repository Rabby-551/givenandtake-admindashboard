"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle,
  Circle,
  Plus,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QA {
  _id: string;
  question: string;
  answer: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  question: string;
  answer: string;
  tags: string;
}

export default function ChatbotManager() {
  const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // State
  const [qaList, setQaList] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    question: "",
    answer: "",
    tags: "",
  });

  // Fetch QA list
  const fetchQAList = async (includeInactive = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/chatbot/qa${includeInactive ? "?includeInactive=true" : ""}`,
        {
          // credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch Q&A list");

      const data = await response.json();
      setQaList(data.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load Q&A list" });
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchQAList();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      setMessage({ type: "error", text: "Question and answer are required" });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        isActive: true,
      };

      const method = editingId ? "PUT" : "POST";
      const endpoint = editingId ? `/chatbot/qa/${editingId}` : "/chatbot/qa";

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        // credentials: "include",
      });

      if (!response.ok)
        throw new Error(`Failed to ${editingId ? "update" : "create"} Q&A`);

      setMessage({
        type: "success",
        text: `Q&A ${editingId ? "updated" : "created"} successfully`,
      });

      setFormData({ question: "", answer: "", tags: "" });
      setEditingId(null);
      await fetchQAList();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Q&A
  const handleEdit = (qa: QA) => {
    setFormData({
      question: qa.question,
      answer: qa.answer,
      tags: qa.tags.join(", "),
    });
    setEditingId(qa._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Q&A
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Q&A?")) return;

    try {
      const response = await fetch(`${apiUrl}/chatbot/qa/${id}`, {
        method: "DELETE",
        // credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete Q&A");

      setMessage({ type: "success", text: "Q&A deleted successfully" });
      await fetchQAList();
    } catch {
      setMessage({ type: "error", text: "Failed to delete Q&A" });
    }
  };

  // Toggle Q&A status
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/chatbot/qa/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
        // credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to update status");

      setMessage({
        type: "success",
        text: `Q&A ${!currentStatus ? "activated" : "deactivated"}`,
      });

      await fetchQAList();
    } catch {
      setMessage({ type: "error", text: "Failed to update status" });
    }
  };

  // Rebuild knowledge base
  const handleRebuild = async () => {
    if (!confirm("This will rebuild the chatbot knowledge base. Continue?"))
      return;

    try {
      setSubmitting(true);
      const response = await fetch(`${apiUrl}/chatbot/rebuild`, {
        method: "POST",
        // credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to rebuild knowledge base");

      setMessage({
        type: "success",
        text: "Knowledge base rebuilt successfully",
      });
    } catch {
      setMessage({ type: "error", text: "Failed to rebuild knowledge base" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">
                    Chatbot Knowledge Base
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Manage Q&A pairs for your AI assistant
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRebuild}
              disabled={submitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Rebuild Base
            </Button>
          </div>

          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className="border-l-4"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 border-border bg-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                {editingId ? "Edit Q&A" : "New Q&A"}
              </CardTitle>
              <CardDescription>Add or update knowledge</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Question
                  </label>
                  <Textarea
                    placeholder="What is your question?"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    className="mt-1 min-h-20 resize-none bg-secondary text-foreground placeholder-muted-foreground border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Answer
                  </label>
                  <Textarea
                    placeholder="What is the response?"
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    className="mt-1 min-h-28 resize-none bg-secondary text-foreground placeholder-muted-foreground border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Tags
                  </label>
                  <Input
                    placeholder="billing, support, general"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="bg-secondary text-foreground placeholder-muted-foreground border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate with commas
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({ question: "", answer: "", tags: "" });
                        setEditingId(null);
                      }}
                      className="border-border hover:bg-secondary"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Knowledge Pairs{" "}
                {qaList.length > 0 && (
                  <span className="text-primary ml-2">({qaList.length})</span>
                )}
              </h2>
              {loading && (
                <span className="text-sm text-muted-foreground animate-pulse">
                  Loading...
                </span>
              )}
            </div>

            {qaList.length === 0 ? (
              <Card className="border-border bg-card/50">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-2">
                    <Zap className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-muted-foreground">No Q&A pairs yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first Q&A to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 auto-rows-max">
                {qaList.map((qa) => (
                  <Card
                    key={qa._id}
                    className="overflow-hidden border-border bg-card hover:bg-card/80 transition-colors hover:border-primary/30"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() =>
                                  handleToggleStatus(qa._id, qa.isActive)
                                }
                                className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                                title={qa.isActive ? "Deactivate" : "Activate"}
                              >
                                {qa.isActive ? (
                                  <CheckCircle className="w-5 h-5 text-accent" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground line-clamp-2 text-sm">
                                  {qa.question}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {qa.answer}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {qa.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-7">
                            {qa.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs bg-secondary text-muted-foreground border-border"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border pl-7 text-xs text-muted-foreground">
                          <span>
                            {new Date(qa.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(qa)}
                              className="gap-1 text-xs h-7 px-2 hover:bg-secondary hover:text-accent"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(qa._id)}
                              className="gap-1 text-xs h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
