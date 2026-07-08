"use client";

import { Suspense, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        handleLoginError(result.error);
      } else if (result?.ok) {
        toast.success("Login successful! Redirecting...");
        router.push(callbackUrl);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (error: string) => {
    switch (error) {
      case "CredentialsSignin":
        toast.error("Invalid email or password. Please try again.");
        break;
      case "UserNotFound":
        toast.error("User not found. Please check your email.");
        break;
      case "IncorrectPassword":
        toast.error("Incorrect password. Please try again.");
        break;
      case "AccessDenied":
        toast.error(
          "Access denied. You don't have permission to access this resource."
        );
        break;
      default:
        toast.error("Login failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-[618px] rounded-xl border-2 border-[#44B6CA40] shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <h2 className="text-2xl text-[#000000] font-bold">Log In</h2>
          <p className="text-base text-[#999999] font-normal">
            Log in as an Admin by providing your information.
          </p>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold text-[#444444]">
                Please sign in to continue
              </h3>

              <div className="grid gap-2 mt-[30px]">
                <Label
                  className="text-base text-[#737373] font-medium"
                  htmlFor="email"
                >
                  Email address
                </Label>
                <input
                  id="email"
                  type="email"
                  placeholder="Write your email"
                  className="h-[52px] rounded-[8px] pl-2 border border-[#9E9E9E] outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  className="text-base text-[#737373] font-medium"
                  htmlFor="password"
                >
                  Password
                </Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pr-10 border w-full h-[52px] border-[#9E9E9E] outline-none rounded-[8px] pl-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm text-right text-v0-button-bg hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-[240px] h-[50px] mx-auto text-base font-semibold   text-white hover: /90 relative"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin absolute left-4" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
