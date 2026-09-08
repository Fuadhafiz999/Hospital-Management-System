"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showSuccess, showError } from "@/lib/toast";

// ─── Validation Schema ────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        const message = json.error?.message || "An unexpected error occurred. Please try again.";

        if (message.includes("Invalid login credentials")) {
          showError("Sign in failed", "Invalid email or password. Please try again.");
          setAuthError("Invalid email or password. Please try again.");
        } else if (message.includes("already exists")) {
          showError("Sign in failed", message);
          setAuthError(message);
        } else {
          showError("Sign in failed", message);
          setAuthError(message);
        }
        return;
      }

      // Successful sign in
      const { user } = json;

      if (!user) {
        showError("Session error", "Could not retrieve your session. Please try again.");
        setAuthError("Could not retrieve your session. Please try again.");
        return;
      }

      const roleLabel =
        user.role === "ADMIN"
          ? "Admin"
          : user.role === "DOCTOR"
            ? "Doctor"
            : "Patient";

      showSuccess(`Welcome back!`, `Signed in as ${roleLabel}`);

      setTimeout(() => {
        switch (user.role) {
          case "ADMIN":
            router.push("/admin");
            break;
          case "DOCTOR":
            router.push("/doctor");
            break;
          default:
            router.push("/patient");
            break;
        }
      }, 500);
    } catch {
      showError("Unexpected error", "An unexpected error occurred. Please try again.");
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-bold text-secondary-900">
        Welcome back
      </h2>
      <p className="mt-2 text-center text-sm text-secondary-500">
        Please sign in to your account
      </p>

      {/* Auth Error Banner */}
      {authError && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-sm text-danger-700">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="doctor@hospital.com"
              {...register("email")}
              className={`block w-full rounded-lg border bg-white px-3 py-2.5 pl-10 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.email
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                  : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-sm text-danger-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={`block w-full rounded-lg border bg-white px-3 py-2.5 pl-10 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.password
                  ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                  : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-danger-500">
              {errors.password.message}
            </p>
          )}
        </div>



        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-primary-700 hover:to-primary-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Create one
        </Link>
      </p>

      {/* Demo Credentials */}
      <div className="mt-6 rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-4">
        <p className="mb-2 text-center text-xs font-medium uppercase text-secondary-500">
          Demo Credentials
        </p>
        <div className="space-y-1 text-xs text-secondary-500">
          <p>
            <span className="font-medium text-secondary-700">Admin:</span>{" "}
            admin@hospital.com / admin123
          </p>
          <p>
            <span className="font-medium text-secondary-700">Doctor:</span>{" "}
            doctor@hospital.com / doctor123
          </p>
          <p>
            <span className="font-medium text-secondary-700">Patient:</span>{" "}
            patient@hospital.com / patient123
          </p>
        </div>
      </div>
    </div>
  );
}
