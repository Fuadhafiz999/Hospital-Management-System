import React from "react";
import PatientSidebar from "./PatientSidebar";

export const metadata = {
  title: "Patient Dashboard",
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <main className="flex-1 overflow-auto bg-secondary-50">{children}</main>
    </div>
  );
}
