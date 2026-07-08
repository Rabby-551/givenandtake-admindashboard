"use client";

import { useState, useRef } from "react";
import { ChevronLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import QuillEditor from "@/components/TextEditor";

interface BlogPost {
  _id: string;
  title: string;
  description: string;
  image: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  tags?: string[];
  authorName?: string; // 🔹 NEW
}

interface AddBlogFormProps {
  onBack: () => void;
  editBlog?: BlogPost | null;
  onUpdate?: (blog: BlogPost) => void;
}

export default function AddBlogForm({
  onBack,
  editBlog,
  onUpdate,
}: AddBlogFormProps) {
  const session = useSession();
  const userId = session.data?.user?._id;
  const token = session.data?.user?.accessToken;
  const defaultAuthorName = editBlog?.authorName ?? "";

  const [title, setTitle] = useState(editBlog?.title || "");
  const [authorName, setAuthorName] = useState<string>(defaultAuthorName); // 🔹 NEW
  const [content, setContent] = useState(editBlog?.description || "");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editBlog?.image || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const url = editBlog
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/blogs/${editBlog._id}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/blogs`;
      const method = editBlog ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to ${editBlog ? "update" : "post"} blog`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Blog ${editBlog ? "updated" : "added"} successfully!`);
      if (data.data && onUpdate) {
        onUpdate(data.data);
      } else {
        setTitle("");
        setAuthorName(""); // 🔹 reset
        setContent("");
        handleRemoveImage();
        onBack();
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message || `Failed to ${editBlog ? "update" : "post"} blog`
      );
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds the 10 MB limit");
        return;
      }
      if (imagePreview && !editBlog?.image) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && !editBlog?.image) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }

    if (!authorName.trim()) {
      toast.error("Please enter author name"); // 🔹 NEW validation
      return;
    }

    if (!content || content === "<p><br></p>") {
      toast.error("Please enter blog content");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", content);
    formData.append("authorName", authorName); // 🔹 NEW in payload
    if (selectedImage) {
      formData.append("image", selectedImage);
    }
    if (userId) {
      formData.append("userId", userId);
    }

    mutation.mutate(formData);
  };

  return (
    <div>
      <header className="bg-[#DFFAFF] rounded-[8px] py-4 px-6 md:px-8 lg:px-12 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-[#44B6CA] hover:bg-transparent hover:text-[#44B6CA]/90"
          onClick={onBack}
        >
          <ChevronLeft className="!w-[32px] !h-[32px]" />
          <span className="sr-only">Back</span>
        </Button>
        <CardTitle className="text-[40px] font-bold text-[#44B6CA] py-[25px] ml-2">
          {editBlog ? "Edit Blog" : "Add Blog"}
        </CardTitle>
      </header>

      <main className="container mx-auto mt-8">
        <div className="grid gap-6">
          {/* Title */}
          <div className="grid gap-2 bg-[#DFFAFF] p-3">
            <Label
              htmlFor="blog-title"
              className="text-base font-semibold text-[#595959]"
            >
              Blog Title
            </Label>
            <Input
              id="blog-title"
              placeholder="Enter blog title"
              className="border-[#DFFAFF] bg-white text-[#595959] placeholder:text-[#595959] focus:ring-[#44B6CA] focus:border-[#44B6CA]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Author Name – NEW */}
          <div className="grid gap-2 bg-[#DFFAFF] p-3">
            <Label
              htmlFor="author-name"
              className="text-base font-semibold text-[#595959]"
            >
              Author Name
            </Label>
            <Input
              id="author-name"
              placeholder="Enter author name"
              className="border-[#DFFAFF] bg-white text-[#595959] placeholder:text-[#595959] focus:ring-[#44B6CA] focus:border-[#44B6CA]"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          </div>

          <div className="grid gap-2 py-10">
            <Label
              htmlFor="blog-description"
              className="text-base font-semibold text-[#595959]"
            >
              Blog Content
            </Label>
            <QuillEditor value={content} onChange={setContent} />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="upload-photo"
              className="text-base font-semibold text-[#595959]"
            >
              Upload Image
            </Label>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#DFFAFF] rounded-lg bg-[#DFFAFF] min-h-[180px] relative">
              {imagePreview ? (
                <div className="flex items-center justify-between w-full">
                  <Image
                    src={imagePreview}
                    width={1000}
                    height={1000}
                    alt="Selected preview"
                    className="max-w-[70%] max-h-[200px] object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-gray-800 text-white rounded-full mr-4"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#595959] mb-4">
                    Maximum file size: 10 MB
                  </p>
                  <Button
                    variant="outline"
                    className="bg-transparent border-[#44B6CA] text-[#44B6CA] hover:bg-[#44B6CA]/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedImage || editBlog?.image
                      ? "Change Image"
                      : "Upload Image"}
                  </Button>
                </>
              )}
              <input
                type="file"
                id="upload-photo"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
          </div>

          <Button
            className="text-white hover:bg-[#44B6CA]/90 w-fit px-8 py-2 mt-4 cursor-pointer bg-[#44B6CA]"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? editBlog
                ? "Updating..."
                : "Submitting..."
              : editBlog
              ? "Update"
              : "Submit"}
          </Button>
        </div>
      </main>
    </div>
  );
}
