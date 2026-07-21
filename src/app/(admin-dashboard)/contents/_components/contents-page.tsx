"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Lock, ExternalLink } from "lucide-react";
import QuillEditor from "@/components/TextEditor";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/** Public site origin, used to build "view page" links for custom pages. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

interface ContentData {
  _id?: string;
  type: string;
  title: string;
  description: string;
  isSystem?: boolean;
  published?: boolean;
  showInFooter?: boolean;
}

// Built-in pages that always exist and cannot be deleted.
const BUILT_IN_SECTIONS: { label: string; type: string }[] = [
  { label: "About Us", type: "about" },
  { label: "Privacy Policy", type: "privacy" },
  { label: "Candidate Card", type: "candidate" },
  { label: "Recruiter Card", type: "recruiter" },
  { label: "Company Card", type: "company" },
  { label: "Terms & Conditions", type: "terms" },
];

const emptyDraft = (): ContentData => ({
  type: "",
  title: "",
  description: "",
  isSystem: false,
  published: true,
  showInFooter: false,
});

const ContentsPage: React.FC = () => {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [pages, setPages] = useState<ContentData[]>([]);
  const [draft, setDraft] = useState<ContentData>(() => ({
    ...emptyDraft(),
    type: "about",
    title: "About Us",
  }));
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  // Fetch every stored page once.
  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/content`);
      setPages(res.data?.data ?? []);
    } catch {
      toast.error("Failed to load content pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Merge built-in definitions with whatever is stored so all six always show.
  const systemPages: ContentData[] = useMemo(
    () =>
      BUILT_IN_SECTIONS.map((s) => {
        const stored = pages.find((p) => p.type === s.type);
        return (
          stored ?? {
            type: s.type,
            title: s.label,
            description: "",
            isSystem: true,
            published: true,
            showInFooter: false,
          }
        );
      }),
    [pages]
  );

  const customPages: ContentData[] = useMemo(
    () =>
      pages.filter(
        (p) =>
          !p.isSystem &&
          !BUILT_IN_SECTIONS.some((s) => s.type === p.type)
      ),
    [pages]
  );

  const selectPage = (page: ContentData) => {
    setIsNew(false);
    setDraft({ ...page });
  };

  const startNewPage = () => {
    setIsNew(true);
    setDraft(emptyDraft());
  };

  const isSelected = (page: ContentData) =>
    !isNew && draft.type === page.type && (draft._id ?? "") === (page._id ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authHeader) {
      toast.error("You must be signed in as an admin to save.");
      return;
    }
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!draft.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        // Brand-new dynamic page.
        await axios.post(
          `${BASE_URL}/content/pages`,
          {
            title: draft.title,
            description: draft.description,
            slug: draft.type || undefined,
            published: draft.published,
            showInFooter: draft.showInFooter,
          },
          { headers: authHeader }
        );
      } else if (draft._id) {
        // Existing page (system or custom) — update by id.
        await axios.patch(
          `${BASE_URL}/content/pages/${draft._id}`,
          {
            title: draft.title,
            description: draft.description,
            slug: draft.isSystem ? undefined : draft.type,
            published: draft.published,
            showInFooter: draft.showInFooter,
          },
          { headers: authHeader }
        );
      } else {
        // System page that does not exist in the DB yet — upsert by type.
        await axios.post(
          `${BASE_URL}/content`,
          {
            type: draft.type,
            title: draft.title,
            description: draft.description,
            published: draft.published,
            showInFooter: draft.showInFooter,
          },
          { headers: authHeader }
        );
      }

      toast.success("Content saved successfully");
      setIsNew(false);
      await fetchPages();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to save content";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: ContentData) => {
    if (!page._id || !authHeader) return;
    if (
      !window.confirm(
        `Delete the page "${page.title}"? This cannot be undone.`
      )
    )
      return;

    try {
      await axios.delete(`${BASE_URL}/content/pages/${page._id}`, {
        headers: authHeader,
      });
      toast.success("Page deleted");
      if (draft._id === page._id) startNewPage();
      await fetchPages();
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to delete page";
      toast.error(message);
    }
  };

  const renderPageButton = (page: ContentData, label?: string) => (
    <div
      key={page._id ?? page.type}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
        isSelected(page)
          ? "bg-[#42A3B2] text-white"
          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
      }`}
      onClick={() => selectPage(page)}
    >
      <span className="flex items-center gap-2 truncate">
        {page.isSystem ? (
          <Lock className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="truncate">{label ?? page.title}</span>
        {page.published === false && (
          <span
            className={`ml-1 rounded px-1.5 py-0.5 text-[10px] ${
              isSelected(page) ? "bg-white/20" : "bg-gray-300 text-gray-700"
            }`}
          >
            Draft
          </span>
        )}
      </span>
      {!page.isSystem && page._id && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(page);
          }}
          className={`shrink-0 rounded p-1 hover:bg-red-500 hover:text-white ${
            isSelected(page) ? "text-white" : "text-red-500"
          }`}
          aria-label="Delete page"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-center text-2xl font-bold">Manage Content</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        {/* Page list */}
        <aside className="space-y-4">
          <button
            onClick={startNewPage}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              isNew
                ? "bg-[#42A3B2] text-white"
                : "border border-[#42A3B2] text-[#42A3B2] hover:bg-[#42A3B2]/10"
            }`}
          >
            <Plus className="h-4 w-4" /> New Page
          </button>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
              System Pages
            </p>
            <div className="space-y-1.5">
              {BUILT_IN_SECTIONS.map((s, i) =>
                renderPageButton(systemPages[i], s.label)
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
              Custom Pages
            </p>
            {loading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : customPages.length === 0 ? (
              <p className="text-sm text-gray-400">
                No custom pages yet. Click “New Page”.
              </p>
            ) : (
              <div className="space-y-1.5">
                {customPages.map((p) => renderPageButton(p))}
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {isNew
                ? "Create New Page"
                : draft.isSystem
                ? `Edit: ${draft.title}`
                : `Edit Page`}
            </h2>
            {!isNew && !draft.isSystem && draft.type && SITE_URL && (
              <a
                href={`${SITE_URL}/pages/${draft.type}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-[#42A3B2] hover:underline"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div>
            <label className="mb-1 block font-medium">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring focus:ring-[#42A3B2]/30"
              placeholder="Enter page title"
            />
          </div>

          {/* Slug — locked for system pages */}
          <div>
            <label className="mb-1 block font-medium">
              Slug (URL){" "}
              {draft.isSystem && (
                <span className="text-xs text-gray-400">(locked)</span>
              )}
            </label>
            <input
              type="text"
              value={draft.type}
              disabled={draft.isSystem}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  type: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-\s]/g, "")
                    .replace(/\s+/g, "-"),
                })
              }
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring focus:ring-[#42A3B2]/30 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g. csae-standards-policy"
            />
            {!draft.isSystem && (
              <p className="mt-1 text-xs text-gray-400">
                Leave blank to auto-generate from the title. Public URL:{" "}
                <code>/pages/{draft.type || "your-slug"}</code>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block font-medium">Description</label>
            <QuillEditor
              value={draft.description}
              onChange={(value: string) =>
                setDraft({ ...draft, description: value })
              }
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.published ?? true}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
              />
              Published (visible on site)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.showInFooter ?? false}
                onChange={(e) =>
                  setDraft({ ...draft, showInFooter: e.target.checked })
                }
              />
              Show link in footer
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[#42A3B2] py-2 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isNew ? "Create Page" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContentsPage;
