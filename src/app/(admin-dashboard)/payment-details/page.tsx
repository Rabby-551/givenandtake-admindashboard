"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

// ----- Interfaces -----
interface User {
  _id: string
  name: string
  email: string
}

interface Plan {
  _id: string
  title: string
  price?: number
}

interface Payment {
  _id: string
  transactionId: string
  userId: User
  amount: number
  createdAt: string
  paymentStatus: "pending" | "completed" | "failed" | "refunded" | "complete"
  paymentMethod: string
  planId?: Plan
}

interface Meta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

interface ApiResponse {
  success: boolean
  message: string
  data: Payment[]
  meta: Meta
}

// ----- Fetcher -----
const fetchPayments = async (page: number): Promise<ApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/payments/all-payments?page=${page}`
  )
  if (!response.ok) {
    throw new Error("Failed to fetch payments")
  }
  return response.json()
}

// ----- Receipt Download -----
const downloadReceipt = (payment: Payment): void => {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text("Payment Receipt", 20, 20)
  doc.setFontSize(12)
  doc.text(`Transaction ID: ${payment.transactionId}`, 20, 40)
  doc.text(`Customer Name: ${payment.userId.name}`, 20, 50)
  doc.text(`Email: ${payment.userId.email}`, 20, 60)
  doc.text(`Amount: $${payment.amount}`, 20, 70)
  doc.text(`Date: ${format(new Date(payment.createdAt), "yyyy-MM-dd")}`, 20, 80)
  doc.text(`Status: ${payment.paymentStatus}`, 20, 90)
  doc.text(`Method: ${payment.paymentMethod}`, 20, 100)
  doc.text(`Plan: ${payment.planId?.title || "N/A"}`, 20, 110)
  doc.save(`receipt_${payment.transactionId}.pdf`)
}

// ----- Skeleton Loader -----
function SkeletonTable() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
          <div className="h-9 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {Array(8)
                  .fill(0)
                  .map((_, index) => (
                    <th key={index} className="px-6 py-3">
                      <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B9B9]">
              {Array(5)
                .fill(0)
                .map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {Array(8)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4">
                          <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// ----- Main Component -----
export default function PaymentDetailsPage() {
  const [page, setPage] = useState(1)

  const {
    data,
    isPending,
    error,
    isFetching,
  } = useQuery<ApiResponse, Error>({
    queryKey: ["payments", page],
    queryFn: () => fetchPayments(page),
    placeholderData: (prev) => prev, // ✅ replaces keepPreviousData
  })

  const payments = data?.data ?? []
  const meta = data?.meta

  if (isPending) return <SkeletonTable />
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-[36px] font-bold text-[#000000] flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Payment Details
        </h1>
      </div>

      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Transaction ID",
                  "Customer Name",
                  "Email",
                  "Amount",
                  "Date",
                  "Status",
                  "Method",
                  "Action",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-sm font-medium text-[#000000] uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9B9B9]">
              {payments.map((payment: Payment, index: number) => (
                <tr
                  key={payment._id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    {payment.transactionId}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    {payment.userId?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    {payment.userId?.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    {format(new Date(payment.createdAt), "yyyy-MM-dd")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.paymentStatus === "completed" ||
                        payment.paymentStatus === "complete"
                          ? "bg-green-100 text-green-800"
                          : payment.paymentStatus === "failed"
                          ? "bg-red-100 text-red-800"
                          : payment.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#000000]">
                    {payment.paymentMethod}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => downloadReceipt(payment)}
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      title="Download Receipt"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-600">
            Page {meta.currentPage} of {meta.totalPages} — Total{" "}
            {meta.totalItems} payments
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(meta.totalPages || 1, p + 1))
              }
              disabled={page === meta.totalPages || isFetching}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
