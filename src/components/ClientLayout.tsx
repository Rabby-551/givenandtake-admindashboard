"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  List,
  Settings,
  CreditCard,
  LogOut,
  X,
  Eye,
  EyeOff,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import image from "@/../public/assets/logo1.jpg";

const menuItems = [
  { title: "Dashboard", icon: BarChart3, href: "/" },
  { title: "Elevator Pitch List", icon: FileText, href: "/elevator-pitch" },
  { title: "Set Job Category", icon: Settings, href: "/job-categories" },
  { title: "Add Skills", icon: Settings, href: "/skills" },
  { title: "Job Post List", icon: List, href: "/job-posts" },
  { title: "Payment Details", icon: CreditCard, href: "/payment-details" },
  { title: "Blogs", icon: CreditCard, href: "/blog" },
  { title: "Plan", icon: CreditCard, href: "/plan" },
  { title: "Users", icon: User, href: "/users" },
  { title: "Contents", icon: User, href: "/contents" },
  { title: "FAQ", icon: User, href: "/faq" },
  { title: "ChatbotQA", icon: User, href: "/chatbot" },
];

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "gnt_last_activity";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const session = useSession();
  const token = session.data?.user?.accessToken;
  const admin = session.data?.user?.role === "admin";

  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStorageWriteRef = useRef(0);

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    const logoutForInactivity = async () => {
      try {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        await signOut({ redirect: false });
      } finally {
        router.replace("/login");
      }
    };

    const clearTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };

    const scheduleLogout = (timestamp: number) => {
      clearTimer();
      const elapsed = Date.now() - timestamp;
      const remaining = INACTIVITY_LIMIT_MS - elapsed;
      if (remaining <= 0) {
        void logoutForInactivity();
        return;
      }
      inactivityTimeoutRef.current = setTimeout(logoutForInactivity, remaining);
    };

    const recordActivity = (timestamp: number) => {
      if (timestamp - lastStorageWriteRef.current > 15000) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
        lastStorageWriteRef.current = timestamp;
      }
      scheduleLogout(timestamp);
    };

    const handleActivity = () => {
      recordActivity(Date.now());
    };

    const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed > 0) {
        if (Date.now() - parsed >= INACTIVITY_LIMIT_MS) {
          void logoutForInactivity();
          return;
        }
        scheduleLogout(parsed);
      } else {
        recordActivity(Date.now());
      }
    } else {
      recordActivity(Date.now());
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "pointerdown",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) {
        return;
      }
      const parsed = Number(event.newValue);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return;
      }
      scheduleLogout(parsed);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      clearTimer();
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener("storage", handleStorage);
    };
  }, [router, session.status]);

  // Fetch user data using TanStack Query
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/single`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    },
    enabled: !!session.data?.user?.accessToken,
  });

  const handleLogout = async () => {
    try {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/user/change-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPassword: currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowChangePasswordModal(false), 1500);
    } catch{
      setError("An error occurred while changing the password");
    }
  };

  // Get first letter of name for fallback avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Filter menu items based on user role
  const filteredMenuItems = admin
    ? menuItems.filter(
        (item) => !["Payment Details", "Plan", "Contents"].includes(item.title)
      )
    : menuItems;

  return (
    <SidebarProvider>
      <div className="flex w-full bg-gray-50 relative">
        <Sidebar className="bg-[#44B6CA] text-white border-r-0">
          <SidebarHeader className="p-4">
            <Image
              src={image}
              alt="Logo"
              width={100}
              height={100}
              className="w-[114px] h-[39px] cursor-pointer"
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-2">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={`w-full justify-start text-white hover:bg-[#42A3B2] h-[50px] ${
                      pathname === item.href ? "bg-[#42A3B2]" : ""
                    }`}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-base font-medium">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem className="mt-[300px]">
                <SidebarMenuButton
                  className="w-full justify-start text-white hover:bg-[#42A3B2] h-[50px] cursor-pointer"
                  onClick={() => setShowLogoutModal(true)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-base font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <div className="bg-[#44B6CA] text-white py-[30px] flex justify-end items-center px-6 sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {isLoading ? "Loading..." : userData?.data?.name || "User"}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                    aria-label="Open user menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={userData?.data?.avatar?.url}
                        alt={userData?.data?.name || "User avatar"}
                      />
                      <AvatarFallback className="bg-white text-cyan-500">
                        {getInitials(userData?.data?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-56 bg-white border-0 shadow-lg"
                >
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => setShowChangePasswordModal(true)}
                  >
                    Change Password
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-700"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>

        {/* Custom Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Confirm Logout</h3>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mb-6 text-gray-600">
                Are you sure you want to logout? You&apos;ll need to sign in
                again to access your account.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#44B6CA] text-white rounded-md hover:bg-[#3aa5b8]"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setError("");
                    setSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#44B6CA] focus:border-[#44B6CA] pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center h-full mt-3"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#44B6CA] focus:border-[#44B6CA] pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center h-full mt-3"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#44B6CA] focus:border-[#44B6CA] pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center h-full mt-3"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setError("");
                    setSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-[#44B6CA] text-white rounded-md hover:bg-[#3aa5b8]"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
