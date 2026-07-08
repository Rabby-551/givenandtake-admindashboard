"use client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video-player";
import { toast } from "sonner";

type PitchType = "candidate" | "recruiter" | "company";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ElevatorPitch {
  _id: string;
  userId: User;
  createdAt: string;
  updatedAt: string;
  video: {
    localPaths: {
      original: string | null;
      hls: string;
      key: string;
    };
    url: string | null;
    hlsUrl: string;
    encryptionKeyUrl: string;
  };
  __v: number;
}

interface ApiResponse {
  success: boolean;
  total: number;
  data: ElevatorPitch[];
}

interface SessionUser {
  accessToken: string;
}

interface CustomSession {
  user?: SessionUser;
}

// ✅ Fetch all elevator pitches at once
const fetchElevatorPitches = async (
  type: PitchType,
  token: string
): Promise<ApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/elevator-pitch/all/elevator-pitches?type=${type}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch elevator pitches");
  }
  return response.json();
};

// ✅ Delete elevator pitch
const deleteElevatorPitchVideo = async (userId: string, token: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/elevator-pitch/video?userId=${userId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to delete elevator pitch");
  }
  return response.json();
};

export default function ElevatorPitchPage() {
  const [activeType, setActiveType] = useState<PitchType>("candidate");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pitchToDelete, setPitchToDelete] = useState<string | null>(null);

  // ✅ Custom pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of rows per page

  const { data: session, status } = useSession() as {
    data: CustomSession | null;
    status: string;
  };

  const router = useRouter();
  const queryClient = useQueryClient();
  const token = session?.user?.accessToken || "";

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // ✅ Fetch all data (no server pagination)
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["elevatorPitches", activeType],
    queryFn: () => fetchElevatorPitches(activeType, token),
    enabled: !!token && status === "authenticated",
  });

  const allPitches = useMemo(() => data?.data ?? [], [data]);

  // ✅ Pagination logic
  const totalPages = Math.ceil(allPitches.length / itemsPerPage);
  const paginatedPitches = allPitches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const deleteElevatorPitchMutation = useMutation({
    mutationFn: (userId: string) => deleteElevatorPitchVideo(userId, token),
    onSuccess: () => {
      toast.success("Elevator pitch deleted successfully!");
      setIsDeleteModalOpen(false);
      setPitchToDelete(null);
      queryClient.invalidateQueries({
        queryKey: ["elevatorPitches", activeType],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete elevator pitch.");
    },
  });

  const handleDeleteElevatorPitch = async () => {
    if (pitchToDelete) {
      await deleteElevatorPitchMutation.mutateAsync(pitchToDelete);
    }
  };

  const openDeleteConfirm = (userId: string) => {
    setPitchToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const openVideo = (pitchId: string) => {
    setSelectedPitchId(pitchId);
    setIsDialogOpen(true);
  };

  const closeVideo = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedPitchId(null), 150);
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const SkeletonRow = () => (
    <tr className="bg-white">
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <td key={index} className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </td>
        ))}
    </tr>
  );

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="bg-[#DFFAFF] rounded-[8px]">
          <CardTitle className="flex items-center gap-2 text-[40px] font-bold text-[#44B6CA] py-[25px]">
            <FileText className="h-[32px] w-[32px]" />
            Elevator Pitch List
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Filter buttons */}
          <div className="flex pb-3 gap-[20px]">
            {(["candidate", "recruiter", "company"] as PitchType[]).map(
              (type) => (
                <Button
                  key={type}
                  className={`px-6 h-[51px] text-base font-medium rounded-[8px] ${
                    activeType === type
                      ? "text-white"
                      : "bg-transparent text-[#8DB1C3] border border-[#8DB1C3]"
                  }`}
                  onClick={() => {
                    setActiveType(type);
                    setCurrentPage(1);
                  }}
                >
                  {type === "candidate"
                    ? "Users Elevator Pitch"
                    : type === "recruiter"
                    ? "Recruiter Elevator Pitch"
                    : "Companies Elevator Pitch"}
                </Button>
              )
            )}
          </div>

          {/* Table */}
          <div>
            {isLoading ? (
              <table className="w-full">
                <thead>
                  <tr>
                    {["Name", "Mail", "Added date", "Plan", "Details"].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-6 py-3 text-left text-base font-medium text-[#595959] uppercase"
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BFBFBF]">
                  {[...Array(5)].map((_, index) => (
                    <SkeletonRow key={index} />
                  ))}
                </tbody>
              </table>
            ) : error ? (
              <div className="text-red-500 text-center py-4">
                Error: {(error as Error).message}
              </div>
            ) : paginatedPitches.length === 0 ? (
              <div className="text-center py-4">
                No elevator pitches found for {activeType}.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {["Name", "Mail", "Added date", "Plan", "Details"].map(
                      (head) => (
                        <th
                          key={head}
                          className="px-6 py-3 text-left text-base font-medium text-[#595959] uppercase"
                        >
                          {head}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#BFBFBF]">
                  {paginatedPitches.map((pitch, index) => (
                    <tr
                      key={pitch._id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-base text-[#595959]">
                        {pitch.userId.name}
                      </td>
                      <td className="px-6 py-4 text-base text-[#595959]">
                        {pitch.userId.email}
                      </td>
                      <td className="px-6 py-4 text-base text-[#595959]">
                        {formatDate(pitch.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-base text-[#595959]">
                        {pitch.userId.role}
                      </td>
                      <td className="px-6 py-4 text-base text-[#595959] space-x-2">
                        <Button
                          size="sm"
                          className="text-white w-[100px]"
                          onClick={() => openVideo(pitch._id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="w-[40px]"
                          onClick={() => openDeleteConfirm(pitch.userId._id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ✅ Custom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeVideo())}
      >
        <DialogContent className="max-w-7xl p-0 sm:p-0 bg-white">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Elevator Pitch</DialogTitle>
            <DialogDescription>
              Secure HLS playback inside the app.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedPitchId ? (
              <VideoPlayer pitchId={selectedPitchId} className="w-full mx-auto" />
            ) : (
              <div className="w-full aspect-video bg-neutral-100 rounded-xl" />
            )}
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="secondary" onClick={closeVideo}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this elevator pitch?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteElevatorPitch}
              disabled={deleteElevatorPitchMutation.isPending}
              className="text-black"
            >
              {deleteElevatorPitchMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
