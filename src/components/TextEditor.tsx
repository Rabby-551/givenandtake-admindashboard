"use client";

import dynamic from "next/dynamic";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

import { useMemo } from "react";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

// const ReactQuill = dynamic(() => import("react-quill"), {
//   ssr: false,
//   loading: () => (
//     <div className="min-h-[200px] bg-gray-100 animate-pulse rounded-md" />
//   ),
// });

import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const QuillEditor = ({ value, onChange, id }: QuillEditorProps) => {
  const formats = useMemo(
    () => [
      "header",
      "bold",
      "align",
      "italic",
      "underline",
      "strike",
      "list",
      "bullet",
      "color",
      "background",
      "link",
      "image",
    ],
    []
  );

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        id={id}
        value={value}
        onChange={(content) => {
          const cleaned = content === "<p><br></p>" ? "" : content;
          onChange(cleaned);
        }}
        modules={modules}
        formats={formats}
        theme="snow"
      />

      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar {
          border-color: #e2e8f0;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          background: #f8fafc;
        }

        /* Cap overall editor area and allow inner content to scroll */
        .quill-editor-wrapper .ql-container {
          border-color: #e2e8f0;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          min-height: 200px;
          max-height: 50vh; /* ⬅️ cap the height */
          font-size: 1rem;

          display: flex; /* make editor area flex so child can scroll */
          flex-direction: column;
        }

        .quill-editor-wrapper .ql-editor {
          min-height: 200px;
          flex: 1 1 auto; /* fill remaining space */
          overflow-y: auto; /* scroll when content is long */
          padding-bottom: 2.5rem; /* cushion so caret isn’t hidden at bottom */
        }
      `}</style>
    </div>
  );
};

export default QuillEditor;