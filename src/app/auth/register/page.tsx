"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { showSuccess, showError } from "@/lib/toast";

// ─── Validation Schema ────────────────────────────────────────────
const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[\d\s\-\(\)\+\.]+$/.test(val),
        "Please enter a valid phone number"
      ),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.enum(["PATIENT", "DOCTOR"], {
      required_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout>>();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "PATIENT",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone || null,
          role: data.role,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const message = json.error || "Registration failed. Please try again.";

        if (message.includes("already exists")) {
          showError("Registration failed", "An account with this email already exists. Please sign in instead.");
          setAuthError("An account with this email already exists. Please sign in instead.");
        } else if (res.status === 429) {
          showError("Too many attempts", "Please wait a moment and try again.");
          setAuthError("Too many attempts. Please wait a moment and try again.");
        } else {
          showError("Registration failed", message);
          setAuthError(message);
        }
        return;
      }

      // Show success toast + message
      showSuccess(
        "Account created successfully!",
        "You can now sign in with your credentials."
      );
      setSuccessMessage(
        "Account created successfully! Redirecting to sign in..."
      );

      // Redirect to login after a brief delay
      redirectTimer.current = setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch {
      showError("Unexpected error", "An unexpected error occurred. Please try again.");
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "PATIENT" as const,
      label: "Patient",
      icon: "🧑‍🤝‍🧑",
      description: "Book appointments and view your medical records",
      gradient: "from-primary-400 to-primary-600",
    },
    {
      value: "DOCTOR" as const,
      label: "Doctor",
      icon: "👨‍⚕️",
      description: "Manage patient records and appointments",
      gradient: "from-primary-500 to-primary-700",
    },
  ];

  return (
    <div className="w-full">
      <h2 className="text-center text-2xl font-bold text-secondary-900">
        Create your account
      </h2>
      <p className="mt-2 text-center text-sm text-secondary-500">
        Join HospiTrack and get started today
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-success-500/20 bg-success-50 p-4">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-success-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-success-700">
              {successMessage}
            </p>
            <p className="mt-1 text-xs text-success-600">
              Redirecting to sign in...
            </p>
          </div>
        </div>
      )}

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

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-5"
        noValidate
      >
        {/* Role Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-secondary-700">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value)}
                className={`relative overflow-hidden rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  selectedRole === role.value
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50"
                }`}
              >
                {/* Active gradient bar */}
                {selectedRole === role.value && (
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${role.gradient}`}
                  />
                )}
                <div className="text-3xl">{role.icon}</div>
                <div
                  className={`mt-2 text-sm font-semibold ${
                    selectedRole === role.value
                      ? "text-primary-700"
                      : "text-secondary-700"
                  }`}
                >
                  {role.label}
                </div>
                <div className="mt-0.5 text-xs text-secondary-500">
                  {role.description}
                </div>

                {/* Selected checkmark */}
                {selectedRole === role.value && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="mt-1.5 text-sm text-danger-500">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            {...register("fullName")}
            className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.fullName
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-sm text-danger-500">
              {errors.fullName.message}
            </p>
          )}
        </div>

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
              placeholder="you@example.com"
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

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-secondary-700"
          >
            Phone number{" "}
            <span className="font-normal text-secondary-400">
              (optional)
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 000-0000"
            {...register("phone")}
            className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              errors.phone
                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
          {errors.phone && (
            <p className="mt-1.5 text-sm text-danger-500">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password Fields */}
        <div className="grid gap-5 md:grid-cols-2">
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
                autoComplete="new-password"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-secondary-700"
            >
              Confirm password
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
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={`block w-full rounded-lg border bg-white px-3 py-2.5 pl-10 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.confirmPassword
                    ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                    : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-danger-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Password strength hint */}
        <div className="rounded-lg bg-secondary-50 p-3">
          <p className="text-xs font-medium text-secondary-600">
            Password requirements:
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-secondary-500">
            <li className="flex items-center gap-1.5">
              <span>•</span> At least 8 characters
            </li>
            <li className="flex items-center gap-1.5">
              <span>•</span> One uppercase letter
            </li>
            <li className="flex items-center gap-1.5">
              <span>•</span> One lowercase letter
            </li>
            <li className="flex items-center gap-1.5">
              <span>•</span> One number
            </li>
          </ul>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !!successMessage}
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
              Creating account...
            </>
          ) : successMessage ? (
            "Redirecting..."
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
