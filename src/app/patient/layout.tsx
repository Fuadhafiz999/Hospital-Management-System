import React from "react";
import PatientSidebar from "./PatientSidebar";
import { requireRole } from "@/lib/auth-guard";

export const metadata = {
  title: "Patient Dashboard",
};

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["PATIENT"]);

  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <main className="flex-1 overflow-auto bg-secondary-50">{children}</main>
    </div>
  );
}
