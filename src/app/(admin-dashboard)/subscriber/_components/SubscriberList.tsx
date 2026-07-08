"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

interface SubscriberListProps {
  onBack?: () => void;
}

async function fetchSubscribers(token: string): Promise<Subscriber[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/newsletter/subscribers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  console.log("API Response:", data); // Debug log to inspect response
  if (!data.success) throw new Error(data.message);
  return Array.isArray(data.data) ? data.data : []; // Ensure array is returned
}

async function deleteSubscriber(email: string, token: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/newsletter/unsubscribe/${email}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
}

export default function SubscriberList({ onBack }: SubscriberListProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const { status, data: sessionData } = useSession();
  const token = sessionData?.user?.accessToken || "";
  const queryClient = useQueryClient();

  const {
    data: subscribers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscribers"],
    queryFn: () => fetchSubscribers(token),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (email: string) => deleteSubscriber(email, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      setIsDeleteModalOpen(false);
      setEmailToDelete(null);
    },
    onError: (error) => {
      console.error("Failed to delete subscriber:", error);
    },
  });

  const handleDeleteClick = (email: string) => {
    setEmailToDelete(email);
    setIsDeleteModalOpen(true);
  };

  // Render loading state in JSX instead of early return
  if (status === "loading") {
    return (
      <div className="text-center text-[#595959]">Loading session...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-auto w-auto p-0"
        >
          <ArrowLeft className="h-6 w-6 text-[#000000]" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-[36px] font-bold text-[#000000]">
          All Subscribers
        </h1>
      </div>

      {error && (
        <div className="text-red-500">Error: {(error as Error).message}</div>
      )}

      <Card className="border-none shadow-none bg-[#EFFDFF]">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto rounded-lg">
            <table className="w-full table-auto">
              <thead className="sticky bg-white top-0 z-30">
                <tr>
                  <th className="px-6 py-3 text-center text-base font-medium text-[#595959] uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-base font-medium text-[#595959] uppercase">
                    Subscriber Email
                  </th>
                  <th className="px-6 py-3 text-center text-base font-medium text-[#595959] uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B9B9B9]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="bg-[#EFFDFF]">
                      <td className="px-6 py-4 text-center">
                        <Skeleton className="h-5 w-10 mx-auto bg-[#D3E6E9] rounded" />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <Skeleton className="h-5 w-64 bg-[#D3E6E9] rounded" />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Skeleton className="h-5 w-5 mx-auto bg-[#D3E6E9] rounded-full" />
                      </td>
                    </tr>
                  ))
                ) : subscribers && subscribers.length > 0 ? (
                  subscribers.map((subscriber, index) => (
                    <tr key={subscriber._id} className="bg-[#EFFDFF]">
                      <td className="px-6 py-4 text-center text-base text-[#595959]">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-left text-base text-[#595959]">
                        {subscriber.email}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(subscriber.email)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5 text-[#737373]" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-[#595959]"
                    >
                      No subscribers available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#DFFAFF] rounded-[8px] border-none">
          <DialogHeader>
            <DialogTitle className="text-[24px] font-bold text-[#44B6CA]">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-[#595959]">
              Are you sure you want to delete this subscriber? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="border-[#44B6CA] text-[#44B6CA]"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setEmailToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="text-white"
              onClick={() =>
                emailToDelete && deleteMutation.mutate(emailToDelete)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
