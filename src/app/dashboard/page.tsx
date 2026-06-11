"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import LecturerDashboard from "@/components/dashboard/LecturerDashboard";
import BusinessDashboard from "@/components/dashboard/BusinessDashboard";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  useEffect(() => {
    if (status === "authenticated" && role === "admin") {
      router.replace("/admin");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-muted/10">
        {role === "business" && <BusinessDashboard />}
        {role === "lecturer" && <LecturerDashboard />}
        {(role === "student" || !role) && status === "authenticated" && (
          <StudentDashboard />
        )}
        {status === "unauthenticated" && (
          <div className="p-8 text-center bg-destructive/10 text-destructive">
            Access denied. Please sign in.
          </div>
        )}
      </main>
    </div>
  );
}
