"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface Recruiter {
  _id: string;
  userId: string;
  bio?: string;
  banner?: string;
  photo?: string;
  title?: string;
  firstName: string;
  lastName: string;
  sureName?: string;
  country?: string;
  city?: string;
  zipCode?: string;
  emailAddress: string;
  phoneNumber?: string;
}

interface Company {
  _id: string;
  userId: string;
  clogo?: string;
  aboutUs?: string;
  cname?: string;
  country?: string;
  city?: string;
  zipcode?: string;
  cemail?: string;
  cPhoneNumber?: string;
  links?: string[];
  industry?: string;
  service?: string[];
  employeesId?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  banner?: string;
}

interface JobDetail {
  _id: string;
  userId: string;
  companyId?: Company;
  recruiterId?: Recruiter;
  title: string;
  description: string;
  location_Type: string;
  salaryRange: string;
  location: string;
  shift: string;
  responsibilities: string[];
  educationExperience: string[];
  benefits: string[];
  vacancy: number;
  experience: string;
  deadline: string;
  status: string;
  jobCategoryId: string;
  name: string;
  role: string;
  compensation: string;
  arcrivedJob: boolean;
  applicationRequirement: { requirement: string; _id: string }[];
  customQuestion: { question: string; _id: string }[];
  jobApprove: string;
  adminApprove: boolean;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface JobDetailResponse {
  success: boolean;
  message: string;
  data: JobDetail;
}

interface JobDetailsProps {
  jobId: string;
  onBack: () => void;
}

const fetchJobDetail = async (id: string): Promise<JobDetailResponse> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch job details: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Fetched Job Data:", data);
    return data;
  } catch (err) {
    console.error("Error fetching job details:", err);
    throw err;
  }
};

const updateJobStatus = async ({
  id,
  adminApprove,
}: {
  id: string;
  adminApprove: boolean;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminApprove }),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update job status");
  }
  return response.json();
};

const deleteJob = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/jobs/${id}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to delete job");
  }
  return response.json();
};

export default function JobDetails({ jobId, onBack }: JobDetailsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => fetchJobDetail(jobId),
    enabled: !!jobId,
  });

  const updateMutation = useMutation({
    mutationFn: updateJobStatus,
    onSuccess: () => {
      toast.success("Job status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      router.push("/job-posts");
    },
    onError: () => {
      toast.error("Failed to update job status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      toast.success("Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["job-detail", jobId] });
      setIsDeleteModalOpen(false);
      window.location.reload();
    },
    onError: () => {
      toast.error("Failed to delete job");
      setIsDeleteModalOpen(false);
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(jobId);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  if (typeof window === "undefined") return null;

  if (isLoading) {
    return <div className="p-6 bg-white rounded-lg shadow-md">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading job details: {(error as Error).message}
        <Button onClick={onBack} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  const job = data?.data;
  if (!job) {
    return (
      <div className="p-6 text-gray-600">
        No job details found.
        <Button onClick={onBack} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  // Determine whether to show recruiterId or companyId
  let postedByName = "Unknown";
  let postedByEmail = "N/A";
  let postedByData = null;
  let postedByLogo = "/default-logo.png";
  let postedByIndustry = "N/A";
  let postedByServices = "N/A";
  let postedByLocation = "N/A";

  if (job.recruiterId) {
    postedByName = `${job.recruiterId.firstName} ${job.recruiterId.sureName}`;
    postedByEmail = job.recruiterId.emailAddress;
    postedByLogo = job.recruiterId.photo || "/default-logo.png";
    postedByLocation = `${job.recruiterId.city || "N/A"}, ${
      job.recruiterId.country || "N/A"
    } (${job.recruiterId.zipCode || "N/A"})`;
    postedByData = { recruiterId: job.recruiterId };
  } else if (job.companyId) {
    postedByName = job.companyId.cname || "Unknown Company";
    postedByEmail = job.companyId.cemail || "N/A";
    postedByLogo = job.companyId.clogo || "/default-logo.png";
    postedByIndustry = job.companyId.industry || "N/A";
    postedByServices = job.companyId.service?.join(", ") || "N/A";
    postedByLocation = `${job.companyId.city || "N/A"}, ${
      job.companyId.country || "N/A"
    } (${job.companyId.zipcode || "N/A"})`;
    postedByData = { companyId: job.companyId };
  }

  // Log the appropriate data
  console.log(postedByData);

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        {/* Posted By Info */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="col-span-6 md:col-span-2 text-center">
            <Image
              src={postedByLogo}
              alt={job.recruiterId ? "Recruiter Photo" : "Company Logo"}
              width={150}
              height={150}
              className="mx-auto mb-4 rounded-md"
            />
            <h2 className="text-xl font-bold">{postedByName}</h2>
            {job.recruiterId ? (
              <>
                <p className="text-sm text-gray-500">
                  {job.recruiterId.title || "N/A"}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">{postedByIndustry}</p>
                <p className="text-sm">{postedByServices}</p>
              </>
            )}
            <p className="text-sm text-gray-600 mt-2">{postedByLocation}</p>
            <p className="text-sm flex items-center justify-center mt-1">
              {postedByEmail}
            </p>
          </div>

          {/* Job Info */}
          <div className="col-span-6 md:col-span-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <h2 className="text-2xl font-bold col-span-2 border-b pb-2">
                Job Details
              </h2>
              <p className="text-base font-bold text-black">Job Position:</p>
              <p className="text-sm font-bold text-black">{job.title}</p>
              <p className="text-base font-bold text-black">Role:</p>
              <p className="text-sm">{job.role}</p>
              <p className="text-base font-bold text-black">Category:</p>
              <p className="text-sm">{job.name}</p>
              {Number(job.salaryRange) > 0 && (
                <>
                  <p className="text-base font-bold text-black">Salary:</p>
                  <p className="text-sm">{job.salaryRange}</p>
                </>
              )}
              <p className="text-base font-bold text-black">Location Type:</p>
              <p className="text-sm">
                {job.location_Type
                  ? job.location_Type.charAt(0).toUpperCase() +
                    job.location_Type.slice(1)
                  : ""}
              </p>

              <p className="text-base font-bold text-black">Vacancy:</p>
              <p className="text-sm">{job.vacancy}</p>
              <p className="text-base font-bold text-black">Experience:</p>
              <p className="text-sm">
                {job.experience.charAt(0).toUpperCase() +
                  job.experience.slice(1)}{" "}
                level
              </p>
              <p className="text-base font-bold text-black">Status:</p>
              <p className="text-sm">
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </p>
              <p className="text-base font-bold text-black">Ordered:</p>
              <p className="text-sm">{formatDate(job.createdAt)}</p>
              <p className="text-base font-bold text-black">Published:</p>
              <p className="text-sm">{formatDate(job.publishDate)}</p>
              <p className="text-base font-bold text-black">Expires:</p>
              <p className="text-sm">{formatDate(job.deadline)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-bold">Description</h3>
          <div
            className="text-gray-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        </div>

        {/* Approve / Deny */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            className="px-6 py-2 text-red-600 border-gray-300 hover:bg-gray-100"
            onClick={handleDeleteClick}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button
            variant="outline"
            className={`px-6 py-2 border-gray-300 hover:bg-gray-100
    ${
      job.adminApprove === false
        ? "bg-red-100 text-red-600 border-red-300"
        : "text-gray-600"
    }
  `}
            onClick={() =>
              updateMutation.mutate({ id: jobId, adminApprove: false })
            }
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Deny"}
          </Button>

          <Button
            size="sm"
            className="text-white w-[102px] cursor-pointer"
            onClick={() =>
              updateMutation.mutate({ id: jobId, adminApprove: true })
            }
            disabled={updateMutation.isPending || job.adminApprove === true}
          >
            {updateMutation.isPending ? "Updating..." : "Approve"}
          </Button>
          <Button onClick={onBack} className="px-6 py-2 text-white">
            Back to List
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the job &quot;
              <strong>{job.title}</strong>&quot;? This action cannot be undone
              and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteMutation.isPending}
              className="sm:mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="text-red-500 hover:bg-red-600 hover:text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
