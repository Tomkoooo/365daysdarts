"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getAllUsers, updateUserRole, updateSubscriptionStatus } from "@/actions/admin-actions"
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
import { Check, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    loadAll()
  }

  async function handleRoleSelect(userId: string, nextRole: string) {
    await updateUserRole(userId, nextRole)
    loadAll()
  }

  async function handleToggleAccess(userId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await updateSubscriptionStatus(userId, nextStatus)
    loadAll()
  }

  if (viewMode === 'student') {
      return (
          <div className="space-y-4">
              <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                  <span>Megtekintés Tanulóként</span>
                  <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Vissza az Adminhoz</Button>
              </div>
              <StudentDashboard />
          </div>
      )
  }

  if (viewMode === 'lecturer') {
    return (
        <div className="space-y-4">
            <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                <span>Megtekintés Oktatóként</span>
                <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Vissza az Adminhoz</Button>
            </div>
            <LecturerDashboard />
        </div>
    )
  }

  if (viewMode === 'business') {
    return (
        <div className="space-y-4">
            <div className="bg-yellow-100 p-2 text-center text-sm font-bold text-yellow-800 flex justify-between items-center px-8">
                <span>Megtekintés Üzleti Nézetben</span>
                <Button size="sm" variant="outline" onClick={() => setViewMode('admin')}>Vissza az Adminhoz</Button>
            </div>
            <BusinessDashboard />
        </div>
    )
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Irányítópult</h1>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setViewMode('student')}>Tanuló Nézet</Button>
             <Button variant="outline" onClick={() => setViewMode('lecturer')}>Oktató Nézet</Button>
             <Button variant="outline" onClick={() => setViewMode('business')}>Üzleti Nézet</Button>
             <Button asChild>
                <Link href="/lecturer/courses/new">Új Kurzus Létrehozása</Link>
             </Button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes Felhasználó</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktív Kurzusok</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{courses.length}</CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Havi Bevétel</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats?.revenue?.toFixed(0) || "0"} HUF</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
            <TabsTrigger value="users">Felhasználók Kezelése</TabsTrigger>
            <TabsTrigger value="courses">Kurzusok</TabsTrigger>
            <TabsTrigger value="finances">Pénzügyek</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
            <Card>
                <CardContent className="p-0">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Név</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Szerepkör</TableHead>
                        <TableHead>Hozzáférés</TableHead>
                        <TableHead>Műveletek</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                        <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>
                                {u.role === 'admin' ? 'Admin' : u.role === 'lecturer' ? 'Oktató' : u.role === 'business' ? 'Üzleti' : 'Tanuló'}
                            </Badge>
                            </TableCell>
                            <TableCell>
                                {u.subscriptionStatus === 'active' ? (
                                    <Badge className="bg-green-600">Aktív</Badge>
                                ) : (
                                    <Badge variant="outline">Inaktív</Badge>
                                )}
                            </TableCell>
                            <TableCell className="flex gap-2">
                            <Select value={u.role} onValueChange={(val) => handleRoleSelect(u._id, val)}>
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Szerepkör" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Tanuló</SelectItem>
                                    <SelectItem value="lecturer">Oktató</SelectItem>
                                    <SelectItem value="business">Üzleti</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                size="sm" 
                                variant={u.subscriptionStatus === 'active' ? 'destructive' : 'default'}
                                onClick={() => handleToggleAccess(u._id, u.subscriptionStatus)}
                                className="h-8 text-xs"
                            >
                                {u.subscriptionStatus === 'active' ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                                {u.subscriptionStatus === 'active' ? 'Megvonás' : 'Aktiválás'}
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
                        <TableHead>Cím</TableHead>
                        <TableHead>Ár</TableHead>
                        <TableHead>Közzétéve</TableHead>
                        <TableHead>Műveletek</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {courses.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center p-8">Nem található kurzus.</TableCell></TableRow>
                        ) : (
                            courses.map((c) => (
                            <TableRow key={c._id}>
                                <TableCell className="font-medium">{c.title}</TableCell>
                                <TableCell>{c.price} HUF</TableCell>
                                <TableCell>
                                    {c.isPublished ? <Badge className="bg-green-600">Közzétéve</Badge> : <Badge variant="outline">Piszkozat</Badge>}
                                </TableCell>
                                <TableCell>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/lecturer/courses/${c._id}/edit`}>Szerkesztés</Link>
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
                <h3 className="text-lg font-semibold">Aktív Hozzáférések</h3>
                 <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Felhasználó</TableHead>
                                    <TableHead>Állapot</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats?.students?.filter((s: any) => s.subscriptionStatus === 'active').map((s: any) => (
                                    <TableRow key={s._id}>
                                        <TableCell>{s.name} ({s.email})</TableCell>
                                        <TableCell><Badge>Aktív</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {(!stats?.students || stats.students.every((s: any) => s.subscriptionStatus !== 'active')) && (
                                     <TableRow><TableCell colSpan={2} className="text-center p-4">Nincs aktív hozzáférés.</TableCell></TableRow>
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
