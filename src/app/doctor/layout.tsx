import React from "react";
import DoctorSidebar from "./DoctorSidebar";
import { requireRole } from "@/lib/auth-guard";

export const metadata = {
  title: "Doctor Dashboard",
};

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["DOCTOR"]);

  return (
    <div className="flex min-h-screen">
      <DoctorSidebar />
      <main className="flex-1 overflow-auto bg-secondary-50">{children}</main>
    </div>
  );
}
