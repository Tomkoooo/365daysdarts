"use client";

import { RolePreviewBanner } from "@/components/admin/RolePreviewBanner";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import LecturerDashboard from "@/components/dashboard/LecturerDashboard";
import BusinessDashboard from "@/components/dashboard/BusinessDashboard";

const VALID_ROLES = ["student", "lecturer", "business"] as const;

export function RolePreviewClient({ role }: { role: string }) {
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <RolePreviewBanner role={role} />
      <main className="flex-1">
        {role === "student" && <StudentDashboard />}
        {role === "lecturer" && <LecturerDashboard />}
        {role === "business" && <BusinessDashboard />}
      </main>
    </div>
  );
}
