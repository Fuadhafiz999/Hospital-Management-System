"use client";

import React, { useState, useEffect, useRef } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  actions?: React.ReactNode;
  userName?: string;
  userRole?: string;
  onMobileMenuToggle?: () => void;
}

export default function Header({
  title,
  subtitle,
  showSearch = true,
  actions,
  userName,
  userRole,
  onMobileMenuToggle,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 1,
      title: "New appointment booked",
      description: "Sarah Johnson booked an appointment",
      time: "2 min ago",
      type: "appointment",
    },
    {
      id: 2,
      title: "Payment received",
      description: "$250.00 payment from Michael Chen",
      time: "1 hour ago",
      type: "payment",
    },
    {
      id: 3,
      title: "Lab results ready",
      description: "Results for Patient #304 are ready",
      time: "3 hours ago",
      type: "lab",
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-secondary-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile menu toggle + Title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary-500 transition-all duration-200 hover:bg-secondary-100 hover:text-secondary-700 lg:hidden"
              aria-label="Toggle navigation menu"
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
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          )}

          {/* Breadcrumb-style title */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-primary-500" />
              <h1 className="text-lg font-bold text-secondary-900 sm:text-xl">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="text-xs text-secondary-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search, Notifications, User, Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          {showSearch && (
            <div className="relative hidden md:block">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400 transition-colors duration-200 peer-focus:text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, doctors..."
                className="w-56 rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:w-72 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 lg:w-64"
              />
              {/* Keyboard shortcut hint */}
              <div className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-secondary-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-secondary-400 sm:flex">
                <span className="text-xs">⌘</span>K
              </div>
            </div>
          )}

          {/* Mobile Search Icon */}
          {showSearch && (
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary-500 transition-all duration-200 hover:bg-secondary-100 hover:text-secondary-700 md:hidden">
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          )}

          {/* Time (desktop) */}
          <div className="hidden items-center gap-1.5 text-xs text-secondary-400 lg:flex">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span>{currentTime}</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative rounded-lg p-2 text-secondary-500 transition-all duration-200 hover:bg-secondary-100 hover:text-secondary-700"
              aria-label="Toggle notifications"
              aria-expanded={showNotifications}
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
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              {/* Notification badge */}
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold leading-none text-white">
                3
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 origin-top-right rounded-xl border border-secondary-200 bg-white shadow-lg ring-1 ring-black/5 transition-all duration-200">
                <div className="flex items-center justify-between border-b border-secondary-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-secondary-900">
                    Notifications
                  </h3>
                  <button className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif, index) => (
                    <button
                      key={notif.id}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-secondary-50 ${
                        index < notifications.length - 1
                          ? "border-b border-secondary-100"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          notif.type === "appointment"
                            ? "bg-primary-100 text-primary-600"
                            : notif.type === "payment"
                              ? "bg-success-50 text-success-500"
                              : "bg-warning-50 text-warning-500"
                        }`}
                      >
                        {notif.type === "appointment" ? (
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
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                        ) : notif.type === "payment" ? (
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
                              d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                        ) : (
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
                              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-secondary-900">
                          {notif.title}
                        </p>
                        <p className="truncate text-xs text-secondary-500">
                          {notif.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-secondary-400">
                          {notif.time}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-secondary-100 px-4 py-2.5 text-center">
                  <button className="text-xs font-medium text-secondary-500 transition-colors hover:text-secondary-700">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar / Menu */}
          {(userName || userRole) && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 rounded-lg p-1.5 transition-all duration-200 hover:bg-secondary-100"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-semibold text-white shadow-sm">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-medium leading-tight text-secondary-900">
                    {userName || "User"}
                  </p>
                  <p className="text-[11px] capitalize leading-tight text-secondary-500">
                    {userRole || "user"}
                  </p>
                </div>
                <svg
                  className={`hidden h-4 w-4 text-secondary-400 transition-transform duration-200 lg:block ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-secondary-200 bg-white shadow-lg ring-1 ring-black/5 transition-all duration-200">
                  <div className="border-b border-secondary-100 px-4 py-3">
                    <p className="text-sm font-medium text-secondary-900">
                      {userName || "User"}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {userRole || "role"} · Online
                    </p>
                  </div>
                  <div className="p-1.5">
                    {[
                      { label: "Profile", icon: "profile" },
                      { label: "Settings", icon: "settings" },
                      { label: "Help Center", icon: "help" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-secondary-600 transition-colors duration-150 hover:bg-secondary-100 hover:text-secondary-900"
                      >
                        {item.icon === "profile" ? (
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
                              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                            />
                          </svg>
                        ) : item.icon === "settings" ? (
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
                              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        ) : (
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
                              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                            />
                          </svg>
                        )}
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-secondary-100 p-1.5">
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-600 transition-colors duration-150 hover:bg-danger-50">
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
                          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Actions */}
          {actions}
        </div>
      </div>
    </header>
  );
}
