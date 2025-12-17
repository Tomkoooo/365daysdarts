"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getAllUsers, updateUserRole } from "@/actions/admin-actions"
import { getAllCourses } from "@/actions/course-actions"
import { getBusinessStats } from "@/actions/business-actions"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import LecturerDashboard from "./LecturerDashboard"
import StudentDashboard from "./StudentDashboard"
import BusinessDashboard from "./BusinessDashboard"

type ViewMode = 'admin' | 'student' | 'lecturer' | 'business';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('admin')
  
  useEffect(() => {
    if (viewMode === 'admin') {
        loadAll()
    }
  }, [viewMode])

  async function loadAll() {
    try {
      const [userData, courseData, statsData] = await Promise.all([
          getAllUsers(),
          getAllCourses(),
          getBusinessStats().catch(() => null) // Allow failing if Business logic throws
      ])
      setUsers(userData)
      setCourses(courseData)
      setStats(statsData)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleRoleChange(userId: string, currentRole: string) {
    const roles = ['student', 'lecturer', 'business', 'admin']
    const nextIndex = (roles.indexOf(currentRole) + 1) % roles.length
    const nextRole = roles[nextIndex]
    
    await updateUserRole(userId, nextRole)
    // Reload users only
    const updatedUsers = await getAllUsers()
    setUsers(updatedUsers)
  }

  if (viewMode === 'student') {
      return (
          <div className="space-y-4">
              <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                  <span>Viewing as Student</span>
                  <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Back to Admin</Button>
              </div>
              <StudentDashboard />
          </div>
      )
  }

  if (viewMode === 'lecturer') {
    return (
        <div className="space-y-4">
            <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                <span>Viewing as Lecturer</span>
                <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Back to Admin</Button>
            </div>
            <LecturerDashboard />
        </div>
    )
  }

  if (viewMode === 'business') {
    return (
        <div className="space-y-4">
            <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                <span>Viewing as Business</span>
                <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Back to Admin</Button>
            </div>
            <BusinessDashboard />
        </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setViewMode('student')}>View Student</Button>
             <Button variant="outline" onClick={() => setViewMode('lecturer')}>View Lecturer</Button>
             <Button variant="outline" onClick={() => setViewMode('business')}>View Business</Button>
             <Button asChild>
                <Link href="/lecturer/courses/new">Create New Course</Link>
             </Button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{courses.length}</CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${stats?.revenue?.toFixed(2) || "0.00"}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="finances">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
            <Card>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                        <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>
                                {u.role}
                            </Badge>
                            </TableCell>
                            <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleRoleChange(u._id, u.role)}>
                                Change Role
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="courses">
             <Card>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Published</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center p-8">No courses found.</TableCell></TableRow>
                        ) : (
                            courses.map((c) => (
                            <TableRow key={c._id}>
                                <TableCell className="font-medium">{c.title}</TableCell>
                                <TableCell>{c.price} HUF</TableCell>
                                <TableCell>
                                    {c.isPublished ? <Badge className="bg-green-600">Published</Badge> : <Badge variant="outline">Draft</Badge>}
                                </TableCell>
                                <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/lecturer/courses/${c._id}/edit`}>Edit</Link>
                                </Button>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="finances">
             <div className="space-y-4">
                <h3 className="text-lg font-semibold">Active Subscriptions</h3>
                 <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats?.students?.filter((s: any) => s.subscriptionStatus === 'active').map((s: any) => (
                                    <TableRow key={s._id}>
                                        <TableCell>{s.name} ({s.email})</TableCell>
                                        <TableCell><Badge>Active</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {(!stats?.students || stats.students.every((s: any) => s.subscriptionStatus !== 'active')) && (
                                     <TableRow><TableCell colSpan={2} className="text-center p-4">No active subscriptions.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
             </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
