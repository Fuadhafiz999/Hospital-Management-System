"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  role: "admin" | "doctor" | "patient";
  userName?: string;
  userAvatar?: string;
}

const roleGradients: Record<string, string> = {
  admin: "from-primary-700 to-primary-600",
  doctor: "from-primary-600 to-primary-500",
  patient: "from-primary-500 to-primary-400",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-primary-800/40 text-primary-100",
  doctor: "bg-white/20 text-white",
  patient: "bg-primary-900/30 text-primary-100",
};

export default function Sidebar({
  navItems,
  role,
  userName,
  userAvatar,
}: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div
        className={`flex h-16 items-center gap-3 bg-gradient-to-r px-6 ${roleGradients[role]}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
          <svg
            className="h-5 w-5 text-white"
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
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-tight text-white">
            Hospi<span className="font-light">Track</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
            {role === "admin"
              ? "Administration"
              : role === "doctor"
                ? "Medical Staff"
                : "Patient Portal"}
          </span>
        </div>
      </div>

      {/* User Info */}
      {userName && (
        <div className="border-b border-secondary-100 bg-secondary-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white shadow-sm">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-secondary-900">
                {userName}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${roleBadgeColors[role]}`}
                >
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-secondary-200 scrollbar-track-transparent">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-secondary-400">
          Main Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            // Fix: prevent root-level routes (e.g., /admin) from matching all sub-routes
            const segments = item.href.split("/").filter(Boolean);
            const isActive =
              pathname === item.href ||
              (segments.length > 1 && pathname.startsWith(item.href + "/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm"
                      : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary-500" />
                  )}

                  {/* Icon */}
                  <span
                    className={`flex h-5 w-5 items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? "text-primary-600"
                        : "text-secondary-400 group-hover:text-secondary-600"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span className="flex-1">{item.label}</span>

                  {/* Active pill indicator */}
                  {isActive && (
                    <span className="flex h-2 w-2 items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-primary-500" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-secondary-200 bg-secondary-50/30 p-3">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-500 transition-all duration-200 hover:bg-danger-50 hover:text-danger-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
            />
          </svg>
          Sign Out
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 border-r border-secondary-200 bg-white shadow-sm lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-secondary-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-secondary-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95 lg:hidden"
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>
    </>
  );
}
