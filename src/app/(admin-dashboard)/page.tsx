"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, DollarSign } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useSession } from "next-auth/react"

interface ApiResponse {
  success: boolean
  message: string
  data: {
    totalCandidates: number
    totalRecruiters: number
    totalCompany: number
    totalAmount: number
    charts: {
      monthly: Array<{
        year: number
        month: string
        totalAmount: number
      }>
      yearly: Array<{
        year: number
        totalAmount: number
      }>
    }
  }
}

const fetchDashboardStats = async (): Promise<ApiResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/stats`)
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats")
  }
  return response.json()
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = session?.user?.role

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) {
    // Keep your skeleton loader code unchanged
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 p-6 rounded-lg">
          <h1 className="text-xl font-bold text-red-600">Error loading dashboard</h1>
          <p className="text-red-500">Failed to fetch dashboard statistics</p>
        </div>
      </div>
    )
  }

  const stats = data?.data

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const chartData = monthNames.map((month) => {
    const monthData = stats?.charts.monthly.find(
      (m) => m.month.toLowerCase() === month.toLowerCase() ||
        m.month.toLowerCase().startsWith(month.toLowerCase())
    );
    return {
      name: month,
      value: monthData?.totalAmount || 0,
    }
  })

  const maxValue = Math.max(...chartData.map((d) => d.value), 500)

  return (
    <div className="space-y-6">
      <div className="bg-[#DFFAFF] p-6 rounded-lg shadow-md">
        <h1 className="text-[36px] font-bold text-[#000000]">Overview</h1>
        <div className={`grid grid-cols-1 ${role === "super-admin" ? "md:grid-cols-4" : "md:grid-cols-3"} gap-6 mt-4`}>
          
          {/* Total Candidates */}
          <Card className="bg-[#44B6CA] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-x-[20px]">
                <Users className="h-[70px] w-[70px] text-white" />
                <div>
                  <p className="text-xl text-white font-medium">Total Candidates</p>
                  <p className="text-[40px] text-white font-bold">{stats?.totalCandidates || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Recruiters */}
          <Card className="bg-[#44B6CA] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-x-[20px]">
                <UserCheck className="h-[70px] w-[70px] text-white" />
                <div>
                  <p className="text-xl text-white font-medium">Total Recruiters</p>
                  <p className="text-[40px] text-white font-bold">{stats?.totalRecruiters || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Companies */}
          <Card className="bg-[#44B6CA] text-white border-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-x-[20px]">
                <UserCheck className="h-[70px] w-[70px] text-white" />
                <div>
                  <p className="text-xl text-white font-medium">Total Companies</p>
                  <p className="text-[40px] text-white font-bold">{stats?.totalCompany || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue (Only for super-admin) */}
          {role === "super-admin" && (
            <Card className="bg-[#44B6CA] text-white border-none">
              <CardContent className="p-6">
                <div className="flex items-center gap-x-[20px]">
                  <DollarSign className="h-[70px] w-[70px] text-white" />
                  <div>
                    <p className="text-xl text-white font-medium">Revenue</p>
                    <p className="text-[40px] text-white font-bold">
                      ${stats?.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chart Card - Only for super-admin */}
      {role === "super-admin" && (
        <Card className="border-none bg-[#DFFAFF]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#000000]">Monthly Purchase Amount</CardTitle>
              <select className="rounded px-3 py-1 text-sm bg-[#DFFAFF] text-gray-800">
                <option value="thisYear" className="bg-[#DFFAFF] hover:bg-[#B0E0E6]">
                  This year
                </option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-[#E6F9FC] p-6 rounded-lg h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    horizontal={true}
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#D1D5DB"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, maxValue]}
                    axisLine={false}
                    tickLine={false}
                    tickCount={6}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Bar
                    dataKey="value"
                    fill="#44B6CA"
                    radius={[4, 4, 0, 0]}
                    barSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
