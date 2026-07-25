"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  FileText,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Info,
  LayoutTemplate,
} from "lucide-react";
import QuillEditor from "@/components/TextEditor";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

/** Public website origin, used to show admins the real, clickable page address. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://evpitch.com"
).replace(/\/+$/, "");

interface ContentData {
  _id?: string;
  type: string;
  title: string;
  description: string;
  isSystem?: boolean;
  published?: boolean;
}

type BuiltIn = {
  label: string;
  type: string;
  /** Fixed public route, or null when the content is not a standalone page. */
  publicPath: string | null;
  /** Plain-English explanation of where this content shows up. */
  location: string;
  /** What the Title field controls for this particular piece of content. */
  titleHint: string;
  /** Fallback title if this page has never been saved in this environment. */
  defaultTitle: string;
};

/**
 * Built-in content. "page" entries live at their own fixed routes; the three
 * "card" entries are blocks inside the homepage How It Works section, so they
 * have no URL of their own.
 *
 * Order and `type` values must stay in step with BUILT_IN_CONTENT_TYPES on the
 * server.
 */
const BUILT_IN_SECTIONS: BuiltIn[] = [
  {
    label: "About Us",
    type: "about",
    publicPath: "/about-us",
    location: "Shown on the About Us page.",
    titleHint: "Shown as the heading at the top of the page.",
    defaultTitle: "About Us",
  },
  {
    label: "Privacy Policy",
    type: "privacy",
    publicPath: "/privacy-policy",
    location: "Shown on the Privacy Policy page.",
    titleHint: "Shown as the heading at the top of the page.",
    defaultTitle: "Privacy Policy",
  },
  {
    label: "Terms & Conditions",
    type: "terms",
    publicPath: "/terms-condition",
    location: "Shown on the Terms & Conditions page.",
    titleHint: "Shown as the heading at the top of the page.",
    defaultTitle: "Terms & Conditions",
  },
  {
    label: "Candidate Card",
    type: "candidate",
    publicPath: null,
    location:
      "Shown as the Candidate card in the “How It Works” section of the homepage. This is not a separate page, so it has no web address.",
    titleHint: "Shown as the heading on the card itself.",
    defaultTitle: "Candidates",
  },
  {
    label: "Recruiter Card",
    type: "recruiter",
    publicPath: null,
    location:
      "Shown as the Recruiter card in the “How It Works” section of the homepage. This is not a separate page, so it has no web address.",
    titleHint: "Shown as the heading on the card itself.",
    defaultTitle: "Recruiters",
  },
  {
    label: "Company Card",
    type: "company",
    publicPath: null,
    location:
      "Shown as the Company card in the “How It Works” section of the homepage. This is not a separate page, so it has no web address.",
    titleHint: "Shown as the heading on the card itself.",
    defaultTitle: "Companies",
  },
];

const builtInByType = new Map(BUILT_IN_SECTIONS.map((s) => [s.type, s]));
const isBuiltInType = (type?: string) => builtInByType.has((type || "").trim());

/** Mirrors the server-side slugify so the preview matches what actually saves. */
const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const emptyDraft = (): ContentData => ({
  type: "",
  title: "",
  description: "",
  isSystem: false,
  published: true,
});

/**
 * Identity of whatever is open in the editor. Built-in pages are keyed by their
 * fixed slug (they may not have a document yet in a given database), custom
 * pages by their id (their slug can change). `null` means "creating a new page".
 */
const NEW_PAGE_KEY = "__new__";
const keyOf = (page: ContentData) =>
  isBuiltInType(page.type) ? `builtin:${page.type}` : `id:${page._id ?? ""}`;

/** Whether two versions of a page carry the same editable content. */
const isSameContent = (a: ContentData, b: ContentData) =>
  a.title === b.title &&
  a.description === b.description &&
  a.type === b.type &&
  (a.published ?? true) === (b.published ?? true) &&
  (a._id ?? "") === (b._id ?? "");

const ContentsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

  const [pages, setPages] = useState<ContentData[]>([]);
  const [draft, setDraft] = useState<ContentData>(emptyDraft);
  /** Single source of truth for what is selected — sidebar and editor read it. */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  /** The last-loaded server state, used to detect unsaved edits. */
  const [baseline, setBaseline] = useState<ContentData>(emptyDraft);

  const isNew = selectedKey === NEW_PAGE_KEY;

  const authHeader = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const fetchPages = useCallback(async (): Promise<ContentData[]> => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/content`);
      const data: ContentData[] = res.data?.data ?? [];
      setPages(data);
      return data;
    } catch {
      toast.error("Failed to load content pages");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Merge built-in definitions with stored data so all six always appear, even
  // against a database where they have never been written.
  const systemPages: ContentData[] = useMemo(
    () =>
      BUILT_IN_SECTIONS.map((s) => {
        const stored = pages.find((p) => p.type === s.type);
        return {
          _id: stored?._id,
          type: s.type,
          title: stored?.title?.trim() || s.defaultTitle,
          description: stored?.description ?? "",
          isSystem: true,
          published: stored?.published ?? true,
        };
      }),
    [pages]
  );

  const customPages: ContentData[] = useMemo(
    () => pages.filter((p) => p._id && !isBuiltInType(p.type)),
    [pages]
  );

  const allPages = useMemo(
    () => [...systemPages, ...customPages],
    [systemPages, customPages]
  );

  /** True while the editor holds edits that have not been saved yet. */
  const isDirty =
    draft.title !== baseline.title ||
    draft.description !== baseline.description ||
    draft.type !== baseline.type ||
    (draft.published ?? true) !== (baseline.published ?? true);

  /** Opens a page in the editor. The only place `selectedKey` and `draft` move together. */
  const openPage = useCallback((page: ContentData) => {
    const snapshot = { ...page };
    setSelectedKey(keyOf(page));
    setDraft(snapshot);
    setBaseline(snapshot);
    setCopied(false);
  }, []);

  // Select the first built-in page immediately, so the editor is never blank.
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (selectedKey !== null) return;
    if (!systemPages.length) return;
    hasAutoSelected.current = true;
    openPage(systemPages[0]);
  }, [systemPages, selectedKey, openPage]);

  /**
   * The six built-in pages are listed from a local definition so the sidebar
   * renders instantly — which means the editor first opens on a placeholder
   * whose body is still empty. Fill the fields in as soon as the stored content
   * arrives, instead of leaving them blank until someone reloads.
   *
   * Unsaved edits always win: a refresh landing mid-typing must never discard
   * what the admin has written.
   */
  useEffect(() => {
    if (isNew || !selectedKey || isDirty) return;
    const stored = allPages.find((p) => keyOf(p) === selectedKey);
    if (!stored || isSameContent(stored, baseline)) return;
    openPage(stored);
  }, [allPages, selectedKey, isNew, isDirty, baseline, openPage]);

  const builtInInfo = isNew ? undefined : builtInByType.get(draft.type);
  const isBuiltIn = Boolean(builtInInfo);
  const isCard = Boolean(builtInInfo && builtInInfo.publicPath === null);

  // The slug that will actually be used (live preview for new pages).
  const effectiveSlug = isNew
    ? toSlug(draft.type || draft.title) || "your-page"
    : draft.type;

  const publicPath = isBuiltIn
    ? builtInInfo?.publicPath
    : `/pages/${effectiveSlug}`;
  const publicUrl = publicPath ? `${SITE_URL}${publicPath}` : null;

  /** Confirms before throwing away edits when moving to another page. */
  const confirmDiscard = () =>
    !isDirty ||
    window.confirm(
      "You have unsaved changes. Leave this page and discard them?"
    );

  const selectPage = (page: ContentData) => {
    if (keyOf(page) === selectedKey && !isNew) {
      // Already open. Re-load it from stored data so clicking a page always
      // shows what is actually saved — but never at the cost of live edits.
      if (!isDirty) openPage(page);
      return;
    }
    if (!confirmDiscard()) return;
    openPage(page);
  };

  const startNewPage = () => {
    if (isNew) return;
    if (!confirmDiscard()) return;
    const blank = emptyDraft();
    setSelectedKey(NEW_PAGE_KEY);
    setDraft(blank);
    setBaseline(blank);
    setCopied(false);
  };

  const isSelected = (page: ContentData) =>
    !isNew && selectedKey === keyOf(page);

  const copyUrl = async () => {
    if (!publicPath) return;
    try {
      await navigator.clipboard.writeText(publicUrl || publicPath);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  /** Turns an API failure into something an admin can actually act on. */
  const reportRequestError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      const code = err.response?.status;
      if (code === 401 || code === 403) {
        toast.error(
          "Your session has expired. Please sign in again to save changes."
        );
        setTimeout(() => signOut({ callbackUrl: "/login" }), 1500);
        return;
      }
      if (!err.response) {
        toast.error(
          "Could not reach the server. Check your connection and try again."
        );
        return;
      }
      const message = err.response.data?.message;
      toast.error(typeof message === "string" && message ? message : fallback);
      return;
    }
    toast.error(fallback);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!authHeader) {
      toast.error(
        status === "loading"
          ? "Still signing you in — please try again in a moment."
          : "Your session has expired. Please sign in again to save changes."
      );
      return;
    }
    if (!draft.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!draft.description.trim()) {
      toast.error("Please add some content");
      return;
    }

    setSaving(true);
    try {
      let saved: ContentData | undefined;

      if (isNew) {
        const res = await axios.post(
          `${BASE_URL}/content/pages`,
          {
            title: draft.title,
            description: draft.description,
            slug: draft.type || undefined,
            published: draft.published,
          },
          { headers: authHeader }
        );
        saved = res.data?.data as ContentData | undefined;
        toast.success("Page created — it is now live on the website");
      } else if (isBuiltInType(draft.type)) {
        /**
         * Built-in pages are saved by their fixed slug, not by id. The slug is
         * the same in every environment, so this works against a production
         * database whether or not the page has ever been written there.
         */
        const res = await axios.post(
          `${BASE_URL}/content`,
          {
            type: draft.type,
            title: draft.title,
            description: draft.description,
            published: isCard ? true : draft.published,
          },
          { headers: authHeader }
        );
        saved = res.data?.data as ContentData | undefined;
        toast.success("Changes saved");
      } else if (draft._id) {
        const res = await axios.patch(
          `${BASE_URL}/content/pages/${draft._id}`,
          {
            title: draft.title,
            description: draft.description,
            slug: draft.type || undefined,
            published: draft.published,
            // Lets the server refuse the write if this id no longer holds the
            // page we think we are editing.
            expectedType: baseline.type,
          },
          { headers: authHeader }
        );
        saved = res.data?.data as ContentData | undefined;
        toast.success("Changes saved");
      } else {
        toast.error("This page could not be identified. Please refresh.");
        return;
      }

      const fresh = await fetchPages();

      // Re-open whatever was just saved so the editor, the sidebar highlight
      // and the unsaved-changes baseline all agree with the server.
      const target =
        (saved &&
          (fresh.find((p) => p._id && p._id === saved._id) ??
            fresh.find((p) => p.type === saved.type))) ||
        saved;
      if (target) openPage(target);
    } catch (err: unknown) {
      reportRequestError(err, "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page: ContentData) => {
    if (!page._id) return;
    if (!authHeader) {
      toast.error("Your session has expired. Please sign in again.");
      return;
    }
    if (
      !window.confirm(
        `Delete "${page.title}"?\n\nThe page will be removed from the website immediately. This cannot be undone.`
      )
    )
      return;

    try {
      await axios.delete(`${BASE_URL}/content/pages/${page._id}`, {
        headers: authHeader,
      });
      toast.success("Page deleted");
      const fresh = await fetchPages();
      if (selectedKey === keyOf(page)) {
        const fallback =
          fresh.find((p) => p.type === BUILT_IN_SECTIONS[0].type) ??
          systemPages[0];
        if (fallback) openPage(fallback);
      }
    } catch (err: unknown) {
      reportRequestError(err, "Failed to delete page");
    }
  };

  const renderPageButton = (page: ContentData, label?: string) => {
    const builtIn = isBuiltInType(page.type);
    return (
      <div
        key={keyOf(page)}
        role="button"
        tabIndex={0}
        onClick={() => selectPage(page)}
        onKeyDown={(e) => e.key === "Enter" && selectPage(page)}
        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
          isSelected(page)
            ? "bg-[#42A3B2] text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-800"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {builtIn ? (
            <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
          )}
          <span className="truncate">{label ?? page.title}</span>
          {page.published === false && (
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                isSelected(page)
                  ? "bg-white/25 text-white"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              Draft
            </span>
          )}
        </span>
        {!builtIn && page._id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(page);
            }}
            title="Delete this page"
            className={`shrink-0 rounded p-1 transition hover:bg-red-500 hover:text-white ${
              isSelected(page) ? "text-white" : "text-red-500"
            }`}
            aria-label={`Delete ${page.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manage Content</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit your built-in pages, or create your own pages (policies, notices,
          anything you need) — they go live on the website as soon as you save.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ---------------- Page list ---------------- */}
        <aside className="space-y-5">
          <button
            onClick={startNewPage}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isNew
                ? "bg-[#42A3B2] text-white"
                : "border border-[#42A3B2] text-[#42A3B2] hover:bg-[#42A3B2]/10"
            }`}
          >
            <Plus className="h-4 w-4" /> Create New Page
          </button>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Lock className="h-3 w-3" /> Built-in
            </p>
            <div className="space-y-1.5">
              {BUILT_IN_SECTIONS.map((s, i) =>
                renderPageButton(systemPages[i], s.label)
              )}
            </div>
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-gray-400">
              These always exist and can be edited but not deleted.
            </p>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <FileText className="h-3 w-3" /> Your Pages
            </p>
            {loading ? (
              <p className="px-1 text-sm text-gray-400">Loading…</p>
            ) : customPages.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs leading-relaxed text-gray-400">
                No pages yet.
                <br />
                Click <span className="font-medium">Create New Page</span> to add
                one.
              </p>
            ) : (
              <div className="space-y-1.5">
                {customPages.map((p) => renderPageButton(p))}
              </div>
            )}
          </div>
        </aside>

        {/* ---------------- Editor ---------------- */}
        <form
          onSubmit={handleSave}
          className="min-w-0 space-y-5 rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
            <h2 className="text-lg font-semibold">
              {/* Always the fixed label for built-ins, so renaming the visitor-
                  facing title can never make it unclear what is being edited. */}
              {isNew
                ? "Create New Page"
                : builtInInfo?.label || draft.title || "Edit Page"}
            </h2>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Unsaved changes
                </span>
              )}
              {isBuiltIn && (
                <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  <Lock className="h-3 w-3" /> Built-in
                </span>
              )}
            </div>
          </div>

          {/* Where this content appears — the key orientation cue. */}
          <div className="flex gap-2.5 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            {isCard ? (
              <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 space-y-2">
              <p>
                {isBuiltIn
                  ? builtInInfo?.location
                  : isNew
                  ? "This will be published as its own page on the website, and linked in the “More” menu in the top navigation."
                  : "This page is live on the website and linked in the “More” menu in the top navigation."}
              </p>

              {/* Public address — with copy + open, so nobody guesses the URL. */}
              {publicPath && (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="max-w-full break-all rounded bg-white px-2 py-1 text-xs text-blue-800 ring-1 ring-blue-200">
                    {publicUrl || publicPath}
                  </code>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  {!isNew && (
                    <a
                      href={publicUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring focus:ring-[#42A3B2]/30"
              placeholder="e.g. CSAE Standards Policy"
            />
            <p className="mt-1 text-xs text-gray-400">
              {builtInInfo?.titleHint ??
                "Shown as the heading at the top of the page."}
            </p>
          </div>

          {/* Slug — hidden entirely for built-ins, since it can't change. */}
          {!isBuiltIn && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Web address
              </label>
              <div className="flex items-center rounded-lg border focus-within:ring focus-within:ring-[#42A3B2]/30">
                <span className="select-none border-r bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  /pages/
                </span>
                <input
                  type="text"
                  value={draft.type}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      type: toSlug(e.target.value),
                    }))
                  }
                  className="w-full rounded-r-lg px-3 py-2 focus:outline-none"
                  placeholder={isNew ? toSlug(draft.title) || "csae-standards" : ""}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {isNew
                  ? "Leave blank and we'll create it from the title automatically."
                  : "Changing this changes the page's link — any existing links to the old address will stop working."}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Content</label>
            <QuillEditor
              /**
               * Remounting per document is what guarantees the editor body can
               * never show one page's text under another page's title.
               */
              key={selectedKey ?? "none"}
              value={draft.description}
              onChange={(value: string) =>
                setDraft((prev) => ({ ...prev, description: value }))
              }
            />
          </div>

          {/* Visibility options — only meaningful for real pages. */}
          {!isCard && (
            <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.published ?? true}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      published: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="font-medium">Published</span>
                  <span className="block text-xs text-gray-500">
                    When unchecked, the page is saved as a draft and visitors
                    can&apos;t see it.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center gap-3 border-t pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#42A3B2] py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : isNew
                ? "Create & Publish Page"
                : "Save Changes"}
            </button>
            {!isNew && !isBuiltIn && draft._id && (
              <button
                type="button"
                onClick={() => handleDelete(draft)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentsPage;
