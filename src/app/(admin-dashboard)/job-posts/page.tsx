"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import JobDetails from "./_components/JobDetails";
import PacificPagination from "@/components/PacificPagination";

// Interface definitions
interface Recruiter {
  _id: string;
  firstName: string;
  sureName: string;
  emailAddress: string;
}

interface Company {
  _id: string;
  cname?: string;
  cemail?: string;
}

interface Job {
  _id: string;
  title: string;
  jobApprove?: string;
  recruiterId?: Recruiter;
  companyId?: Company;
  createdAt: string;
  publishDate: string;
  updatedAt: string;
  status: string;
  adminApprove?: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    jobs: Job[] | null;
  };
}

// Fetch function with page parameter
const fetchJobPosts = async (page: number): Promise<ApiResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/admin/job/approve?page=${page}`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch job posts: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data?.data?.jobs) {
      throw new Error("Invalid API response structure");
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export default function JobPostsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["job-posts", currentPage],
    queryFn: () => fetchJobPosts(currentPage),
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const formatDate = useMemo(
    () => (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    []
  );

  const handleBack = () => {
    setSelectedJobId(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="bg-cyan-100 rounded-lg">
          <CardTitle className="flex items-center gap-2 text-4xl font-bold text-cyan-600 py-6">
            <FileText className="h-8 w-8" />
            Job Post List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="animate-pulse p-6">
            <table className="w-full">
              <thead>
                <tr>
                  {[
                    "Job Title",
                    "Posted By Name",
                    "Posted By Email",
                    "Posted Date",
                    "Details",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase"
                    >
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...Array(3)].map((_, i) => (
                  <tr key={i} className="bg-white">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="bg-cyan-100 rounded-lg">
          <CardTitle className="flex items-center gap-2 text-4xl font-bold text-cyan-600 py-6">
            <FileText className="h-8 w-8" />
            Job Post List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-red-500">
          Error loading job posts: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  if (selectedJobId) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="bg-cyan-100 rounded-lg">
          <CardTitle className="flex items-center gap-2 text-4xl font-bold text-cyan-600 py-6">
            <ChevronLeft
              onClick={handleBack}
              className="h-8 w-8 cursor-pointer"
            />
            Job Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JobDetails onBack={handleBack} jobId={selectedJobId} />
        </CardContent>
      </Card>
    );
  }

  const jobs = data?.data?.jobs || [];
  const {
    currentPage: page,
    totalPages,
    totalItems = jobs.length,
  } = data?.data?.meta || {
    currentPage: 1,
    totalPages: 1,
    totalItems: jobs.length,
  };

  const approvedCount = jobs.filter((j) => j.adminApprove).length;
  const pendingCount = jobs.length - approvedCount;

  if (jobs.length === 0) {
    return (
      <Card className="border-none shadow-none">
        <CardHeader className="bg-cyan-100 rounded-lg">
          <CardTitle className="flex items-center gap-2 text-4xl font-bold text-cyan-600 py-6">
            <FileText className="h-8 w-8" />
            Job Post List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-gray-500">
          No job posts available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="bg-cyan-100 rounded-lg">
        <CardTitle className="flex items-center gap-2 text-4xl font-bold text-cyan-600 py-6">
          <FileText className="h-8 w-8" />
          Job Post List
        </CardTitle>
        <div className="flex flex-wrap gap-3 text-sm text-gray-700">
          <span className="bg-white rounded-lg px-3 py-1 border border-cyan-200">
            Total Jobs: <strong>{totalItems}</strong>
          </span>
          <span className="bg-white rounded-lg px-3 py-1 border border-green-200 text-green-700">
            Approved: <strong>{approvedCount}</strong>
          </span>
          <span className="bg-white rounded-lg px-3 py-1 border border-amber-200 text-amber-700">
            Pending: <strong>{pendingCount}</strong>
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto mb-4">
          <table
            className="w-full table-auto"
            aria-labelledby="job-posts-table"
          >
            <thead>
              <tr>
                {[
                  "Job Title",
                  "Posted By Name",
                  "Posted By Email",
                  "Posted Date",
                  "Updated Date",
                  "Approval Status",
                  "Details",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-base font-medium text-gray-600 uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {jobs.map((job, index) => {
                let postedByName = "Unknown";
                let postedByEmail = "N/A";
                let postedByData = null;
                let approvalStatus = false;

                if (job.recruiterId) {
                  postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
                  postedByEmail = job.recruiterId.emailAddress;
                  postedByData = { recruiterId: job.recruiterId };
                  approvalStatus = job?.adminApprove as boolean;
                } else if (job.companyId) {
                  postedByName = job.companyId.cname || "Unknown Company";
                  postedByEmail = job.companyId.cemail || "N/A";
                  postedByData = { companyId: job.companyId };
                  approvalStatus = job?.adminApprove as boolean;
                }

                return (
                  <tr
                    key={job._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 text-base font-normal text-gray-600">
                      {job.title || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-base font-normal text-gray-600">
                      {postedByName}
                    </td>
                    <td className="px-6 py-4 text-base font-normal text-gray-600">
                      {postedByEmail}
                    </td>
                    <td className="px-6 py-4 text-base font-normal text-gray-600">
                      {formatDate(job.publishDate)}
                    </td>
                    <td className="px-6 py-4 text-base font-normal text-gray-600">
                      {formatDate(job.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-base font-normal">
                      {job.adminApprove ? (
                        <span className="text-green-600 font-semibold">
                          Approved
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        className="text-white w-[102px] cursor-pointer"
                        onClick={() => {
                          console.log(postedByData); // Log recruiterId or companyId data
                          setSelectedJobId(job._id);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PacificPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </CardContent>
    </Card>
  );
}
