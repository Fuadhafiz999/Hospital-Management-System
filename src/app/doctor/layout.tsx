import React from "react";
import DoctorSidebar from "./DoctorSidebar";

export const metadata = {
  title: "Doctor Dashboard",
};

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DoctorSidebar />
      <main className="flex-1 overflow-auto bg-secondary-50">{children}</main>
    </div>
  );
}
