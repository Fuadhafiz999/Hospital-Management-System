import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Auth Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md lg:max-w-lg">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-secondary-900">
              HospiTrack
            </span>
          </Link>
          {children}
        </div>
      </div>

      {/* Right: Decorative Side */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-900">
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="mb-6 text-6xl">🏥</div>
            <h2 className="mb-4 text-3xl font-bold text-white">
              Welcome to HospiTrack
            </h2>
            <p className="max-w-md text-lg text-white/70">
              Your complete hospital management solution. Secure, efficient, and
              easy to use.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { number: "10K+", label: "Patients" },
                { number: "500+", label: "Doctors" },
                { number: "50K+", label: "Appointments" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stat.number}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
