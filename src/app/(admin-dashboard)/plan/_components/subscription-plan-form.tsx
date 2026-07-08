"use client";

import type React from "react";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Plus, X, Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plan } from "@/lib/plans";

interface PlanFormData {
  title: string;
  titleColor: string;
  description: string;
  price: string;
  features: string[];
  for: "" | "candidate" | "company" | "recruiter";
  valid: "PayAsYouGo" | "monthly" | "yearly";
  maxJobPostsPerYear: string;
  maxJobPostsPerMonth: string;
}

interface SubscriptionPlanFormProps {
  formData: PlanFormData;
  editPlan: Plan | null;
  isLoading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number
  ) => void;
  onSelectChange: (field: "for" | "valid", value: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const SubscriptionPlanForm: React.FC<SubscriptionPlanFormProps> = ({
  formData,
  editPlan,
  isLoading,
  onInputChange,
  onSelectChange,
  onAddFeature,
  onRemoveFeature,
  onSubmit,
  onCancel,
}) => {
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const handleColorIconClick = () => {
    colorInputRef.current?.click();
  };

  const displayedColor = formData.titleColor || "#44B6CA";

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-[#DFFAFF] rounded-[8px]">
        <CardTitle
          className="flex items-center gap-2 text-[40px] font-bold py-[25px]"
          style={{ color: displayedColor }} // 👈 use titleColor here
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-0 h-auto hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft
              className="h-[32px] w-[32px]"
              style={{ color: displayedColor }} // 👈 match icon color too (optional)
            />
          </Button>
          {editPlan ? "Edit Subscription Plan" : "Add Subscription Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 bg-[#DFFAFF] rounded-b-[8px]">
        <div className="space-y-6">
          {/* Title + Color Picker */}
          <div className="flex items-end gap-6">
            {/* Title */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Plan Title
              </label>
              <Input
                placeholder="Input title..."
                name="title"
                value={formData.title}
                onChange={onInputChange}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              />
            </div>

            {/* Title Color Picker */}
            <div className="flex flex-col items-center gap-2 w-[150px]">
              <span className="block text-sm font-medium text-[#595959]">
                Title Color
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleColorIconClick}
                className="cursor-pointer hover:bg-[#44B6CA]/10 border border-[#44B6CA]/30 rounded-full"
              >
                <Palette className="h-5 w-5 text-[#44B6CA]" />
                <span className="sr-only">Pick title color</span>
              </Button>

              {/* Circle + Code in one row */}
              <div className="flex items-center gap-2 mt-1">
                {/* Color preview circle */}
                <div
                  className="h-6 w-6 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: displayedColor }}
                />

                {/* Color code display */}
                <span className="text-xs font-mono text-[#595959] bg-white px-2 py-[2px] rounded border border-gray-200">
                  {displayedColor.toUpperCase()}
                </span>
              </div>

              {/* Native color input – small and neat */}
              <Input
                ref={colorInputRef}
                type="color"
                name="titleColor"
                value={displayedColor}
                onChange={onInputChange}
                className="mt-1 h-8 w-12 p-0 border border-gray-300 rounded cursor-pointer bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {/* Price */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Price
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Input price..."
                name="price"
                value={formData.price}
                onChange={onInputChange}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="col-span-4">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Description
              </label>
              <Textarea
                placeholder="Input description..."
                name="description"
                value={formData.description}
                onChange={onInputChange}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Duration */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Duration
              </label>
              <Select
                value={formData.valid}
                onValueChange={(value) => onSelectChange("valid", value)}
              >
                <SelectTrigger className="w-full border-none !cursor-pointer bg-white">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="bg-white border-none !cursor-pointer">
                  <SelectItem value="PayAsYouGo">PayAsYouGo</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max job posts per year */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Max Jobs / Year (company/recruiter)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 24"
                name="maxJobPostsPerYear"
                value={formData.maxJobPostsPerYear}
                onChange={onInputChange}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              />
            </div>

            {/* Max job posts per month */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-[#595959] mb-2">
                Max Jobs / Month (optional)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="auto if blank"
                name="maxJobPostsPerMonth"
                value={formData.maxJobPostsPerMonth}
                onChange={onInputChange}
                className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#595959]">
                Features
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAddFeature}
                className="text-[#44B6CA] hover:bg-[#44B6CA] hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder={`Feature ${index + 1}`}
                  name="features"
                  value={feature}
                  onChange={(e) => onInputChange(e, index)}
                  className="w-full bg-white border-gray-300 outline-none focus:ring-2 focus:ring-[#44B6CA] focus:border-transparent"
                />
                {formData.features.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFeature(index)}
                    className="text-[#737373] hover:bg-[#44B6CA] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Valid For */}
          <div>
            <label className="block text-sm font-medium text-[#595959] mb-2">
              Valid For
            </label>
            <Select
              value={formData.for}
              onValueChange={(value) => onSelectChange("for", value)}
            >
              <SelectTrigger className="w-full border-none !cursor-pointer bg-white">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-none !cursor-pointer">
                <SelectItem value="candidate">Candidate</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onSubmit}
            className="text-white px-8 py-2 rounded-[8px] cursor-pointer"
            disabled={isLoading}
          >
            {isLoading
              ? editPlan
                ? "Updating..."
                : "Adding..."
              : editPlan
              ? "Update Plan"
              : "Add Plan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlanForm;
export type { PlanFormData };
