import React from "react";
import AdminSidebar from "./AdminSidebar";
import { requireRole } from "@/lib/auth-guard";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN"]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-secondary-50">{children}</main>
    </div>
  );
}
