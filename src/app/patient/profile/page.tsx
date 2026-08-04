"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { showSuccess, showError } from "@/lib/toast";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

export default function PatientProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (cancelled) return;
        if (json.user) {
          setUser(json.user);
          setFullName(json.user.fullName || "");
          setPhone(json.user.phone || "");
        } else {
          setError("You must be signed in.");
        }
      } catch {
        if (!cancelled) setError("Failed to load profile.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError("Full name is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        showError("Save failed", json.error?.message || json.error);
        return;
      }
      showSuccess("Profile updated successfully");
      setUser((prev) =>
        prev ? { ...prev, fullName: json.user.fullName, phone: json.user.phone } : prev
      );
    } catch {
      showError("Save failed", "Please try again");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div>
      <Header title="My Profile" subtitle="Manage your personal information" userName="Patient" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6 max-w-2xl">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-secondary-100" />
            <div className="h-40 animate-pulse rounded-xl bg-secondary-100" />
          </div>
        ) : user ? (
          <>
            {/* Profile Info */}
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-secondary-100 pb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xl font-bold text-white">
                      {initials(user.fullName || user.email)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-secondary-900">{user.fullName}</h2>
                      <p className="text-sm capitalize text-secondary-500">{user.role.toLowerCase()}</p>
                      <p className="text-xs text-secondary-400">
                        Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary-700">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary-700">Email</label>
                    <input type="email" value={user.email} disabled className="input-field opacity-60" />
                    <p className="mt-1 text-xs text-secondary-400">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary-700">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="input-field"
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" isLoading={isSaving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account summary */}
            <Card>
              <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-secondary-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">User ID</p>
                    <p className="text-xs text-secondary-500">Your unique account identifier</p>
                  </div>
                  <span className="font-mono text-xs text-secondary-500">{user.id}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-secondary-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Account Status</p>
                    <p className="text-xs text-secondary-500">Your account is active</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">
                    Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
