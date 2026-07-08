"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import QuillEditor from "@/components/TextEditor";

type ContentType =
  | "about"
  | "privacy"
  | "candidate"
  | "recruiter"
  | "company"
  | "terms"; // ✅ Added "terms"

interface ContentData {
  type: ContentType;
  title: string;
  description: string;
}

const sections: { label: string; value: ContentType }[] = [
  { label: "About Us", value: "about" },
  { label: "Privacy Policy", value: "privacy" },
  { label: "Candidate Card", value: "candidate" },
  { label: "Recruiter Card", value: "recruiter" },
  { label: "Company Card", value: "company" },
  { label: "Terms & Conditions", value: "terms" }, // ✅ New Section
];

const ContentsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ContentType>("about");
  const [content, setContent] = useState<ContentData>({
    type: "about",
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ Fetch content by selected type
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/content/${selectedType}`
        );
        if (res.data) {
          setContent(res.data.data);
        } else {
          setContent({ type: selectedType, title: "", description: "" });
        }
      } catch {
        setContent({ type: selectedType, title: "", description: "" });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedType]);

  // ✅ Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/content`, content);
      setMessage("✅ Content saved successfully!");
    } catch {
      setMessage("❌ Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-4 text-center">Manage Content</h1>

      {/* ✅ Section Selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {sections.map((s) => (
          <button
            key={s.value}
            onClick={() => setSelectedType(s.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              selectedType === s.value
                ? "bg-[#42A3B2] text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ✅ Form */}
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="Enter title"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Description</label>
            <QuillEditor
              value={content.description}
              onChange={(value: string) =>
                setContent({ ...content, description: value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#42A3B2] text-white font-semibold py-2 rounded-lg hover:bg-[#42A3B2] transition"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-center text-sm">{message}</p>}
    </div>
  );
};

export default ContentsPage;
