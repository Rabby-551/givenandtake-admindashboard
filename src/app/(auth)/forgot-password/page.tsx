"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ForgotPasswordForm {
  email: string;
}

async function sendResetEmail(data: ForgotPasswordForm) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/user/forget`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send reset email");
  }

  return response.json();
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: sendResetEmail,
    onSuccess: () => {
      setSuccess("OTP sent successfully! Check your email.");
      setError(null);
      setEmailError(null);
      // Redirect to OTP page with email as query parameter
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }, 2000); // 2-second delay to show success message
    },
    onError: (error: Error) => {
      setError(error.message);
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setEmailError("Invalid email address");
      return;
    }

    mutation.mutate({ email });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-[618px] rounded-xl border-2 border-[#44B6CA40] shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <h2 className="text-2xl text-[#000000] font-bold">
            Forgot Password?
          </h2>
          <p className="text-base text-[#999999] font-normal">
            Forgot your password? Please enter your email and we&apos;ll send
            you a 4-digit code.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold text-[#444444]">
                Enter your personal information
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
                  placeholder="Enter your email"
                  className={`h-[52px] rounded-[8px] pl-2 border ${
                    emailError ? "border-red-500" : "border-[#9E9E9E]"
                  } outline-none`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={mutation.isPending}
                />
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                {success && <p className="text-green-500 text-sm">{success}</p>}
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-[240px] h-[50px] rounded-[8px] mx-auto text-base font-semibold   text-white hover: /90 disabled:opacity-50 flex items-center justify-center"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">Sending...</span>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
