"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /doctor → /doctor/dashboard so there's only one canonical
 * doctor dashboard page (sidebar links to /doctor/dashboard).
 */
export default function DoctorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/doctor/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-secondary-500">
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
        Redirecting to dashboard...
      </div>
    </div>
  );
}
