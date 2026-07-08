"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Edit, Trash2, Plus, Eye, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Plan } from "@/lib/plans";
import PacificPagination from "@/components/PacificPagination";

interface SubscriptionPlansListProps {
  plans: Plan[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onAddPlan: () => void;
  onEditPlan: (plan: Plan) => void;
  onDeletePlan: (plan: Plan) => void;
  onViewDetails: (planId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const SkeletonRow = () => (
  <TableRow className="bg-white">
    {Array(9)
      .fill(0)
      .map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </TableCell>
      ))}
  </TableRow>
);

const SubscriptionPlansList: React.FC<SubscriptionPlansListProps> = ({
  plans,
  isLoading,
  isError,
  onAddPlan,
  onEditPlan,
  onDeletePlan,
  onViewDetails,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    const lower = searchTerm.toLowerCase().trim();
    if (!lower) return plans;

    return plans.filter(
      (plan) =>
        plan.title.toLowerCase().includes(lower) ||
        plan.description.toLowerCase().includes(lower) ||
        plan.for.toLowerCase().includes(lower)
    );
  }, [plans, searchTerm]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-[#DFFAFF] rounded-[8px]">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-[25px] gap-4">
          <div className="flex items-center gap-2 text-[40px] font-bold text-[#44B6CA]">
            <Settings className="h-[32px] w-[32px]" />
            Subscription Plans List
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder='Search plans (e.g. "Premium", "company")...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button
              onClick={onAddPlan}
              className="bg-[#44B6CA] hover:bg-[#3A9FB0] text-white cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Plan Title",
                "Description",
                "Price",
                "Duration",
                "Max / Year",
                "Max / Month",
                "Features",
                "Valid For",
                "Action",
              ].map((heading) => (
                <TableHead
                  key={heading}
                  className="px-6 py-3 text-left text-base font-medium text-[#595959] uppercase"
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-[#BFBFBF]">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <SkeletonRow key={i} />)
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-red-500">
                  Error loading plans
                </TableCell>
              </TableRow>
            ) : filteredPlans.length > 0 ? (
              filteredPlans.map((plan) => (
                <TableRow key={plan._id} className="bg-white hover:bg-gray-50">
                  <TableCell className="truncate max-w-[200px]">{plan.title}</TableCell>
                  <TableCell className="truncate max-w-[200px]">{plan.description}</TableCell>
                  <TableCell>${plan.price.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{plan.valid}</TableCell>
                  <TableCell className="text-center">
                    {plan.for === "candidate" ? "N/A" : plan.maxJobPostsPerYear ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {plan.for === "candidate"
                      ? "N/A"
                      : plan.maxJobPostsPerMonth ?? "auto"}
                  </TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.features.slice(0, 2).map((feature, index) => {
                        const words = feature.split(" ");
                        const truncated =
                          words.length > 12
                            ? words.slice(0, 12).join(" ") + "..."
                            : feature;
                        return (
                          <li key={index} title={words.length > 12 ? feature : undefined}>
                            {truncated}
                          </li>
                        );
                      })}
                    </ul>
                  </TableCell>
                  <TableCell className="capitalize">{plan.for}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails(plan._id)}
                        className="hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 text-[#737373]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditPlan(plan)}
                        className="hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 text-[#737373]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeletePlan(plan)}
                        className="hover:bg-gray-100"
                      >
                        <Trash2 className="h-4 w-4 text-[#737373]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No plans found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="p-4">
          <PacificPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlansList;
