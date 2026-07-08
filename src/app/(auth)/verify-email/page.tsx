"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

// Wrap the component that uses useSearchParams in Suspense
function VerifyEmailContent() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    router.push(
      `/reset-password?email=${encodeURIComponent(email || "")}&otp=${otpCode}`
    );
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md rounded-xl border-2 border-[#44B6CA40] shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <h2 className="text-2xl text-[#000000] font-bold">Verify Email</h2>
          <p className="text-base text-[#999999] font-normal">
            We&apos;ve sent a verification code to {email}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-center gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className={`w-12 h-12 text-center text-lg border rounded-[8px] outline-none transition-colors ${
                  digit
                    ? "  font-bold border-[#9EC7DC] text-white"
                    : "border-[#9E9E9E] font-normal"
                }`}
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex justify-between text-sm">
            <span className="text-[#737373]">Don&apos;t receive OTP?</span>
            <Link href="#" className="text-[#44B6CA] hover:underline">
              Resend code
            </Link>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={handleVerify}
              disabled={isSubmitting}
              className="w-[240px] h-[50px] text-base font-semibold   text-white hover: /90 disabled:opacity-50"
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
