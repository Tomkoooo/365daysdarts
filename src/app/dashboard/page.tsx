"use client"

import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/Navbar"
import StudentDashboard from "@/components/dashboard/StudentDashboard"
import LecturerDashboard from "@/components/dashboard/LecturerDashboard"
import AdminDashboard from "@/components/dashboard/AdminDashboard"
import BusinessDashboard from "@/components/dashboard/BusinessDashboard"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const role = session?.user?.role

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
       <Navbar />
       <main className="flex-1 bg-muted/10">
         {role === 'admin' && <AdminDashboard />}
         {role === 'business' && <BusinessDashboard />}
         {role === 'lecturer' && <LecturerDashboard />}
         {role === 'student' && <StudentDashboard />}
         {!role && status === "authenticated" && <StudentDashboard />} {/* Default fallback */}
         {status === "unauthenticated" && (
            <div className="p-8 text-center bg-destructive/10 text-destructive">
              Access Denied. Please sign in.
            </div>
         )}
       </main>
    </div>
  )
}
