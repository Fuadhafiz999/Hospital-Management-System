import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
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
          <span className="text-xl font-bold text-white">HospiTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-all hover:bg-primary-50"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
          🏥 Modern Healthcare Management Platform
        </div>
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
          Streamline Your
          <br />
          <span className="text-primary-200">Hospital Operations</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-white/70">
          A comprehensive solution for managing patient records, appointments,
          billing, and medical staff — all in one secure, intuitive platform.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/register"
            className="rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary-700 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: "👨‍⚕️",
              title: "Doctor Management",
              desc: "Efficiently manage doctor schedules, specializations, and patient assignments.",
            },
            {
              icon: "📋",
              title: "Patient Records",
              desc: "Secure digital records with easy access to medical history and treatment plans.",
            },
            {
              icon: "📅",
              title: "Appointment System",
              desc: "Smart scheduling with automated reminders and real-time availability tracking.",
            },
            {
              icon: "💳",
              title: "Billing & Invoicing",
              desc: "Streamlined payment processing with detailed invoice management.",
            },
            {
              icon: "📊",
              title: "Analytics Dashboard",
              desc: "Comprehensive insights with real-time data visualization and reporting.",
            },
            {
              icon: "🔒",
              title: "Secure & Compliant",
              desc: "HIPAA-compliant security with role-based access control and audit logs.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-white/10 pt-8 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} HospiTrack. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
