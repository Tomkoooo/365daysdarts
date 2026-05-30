"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { getAllUsers, updateUserRole, updateSubscriptionStatus } from "@/actions/admin-actions";
import { getAllCourses } from "@/actions/course-actions";
import { getBusinessStats } from "@/actions/business-actions";
import { Check, X, Search } from "lucide-react";
import type { UserRole } from "@/models/User";

const PAGE_SIZE = 10;
const ROLE_OPTIONS: UserRole[] = ["student", "lecturer", "business", "admin"];

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "lecturer":
      return "Lecturer";
    case "business":
      return "Business";
    default:
      return "Student";
  }
}

export function AdminOverviewPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [userData, courseData, statsData] = await Promise.all([
        getAllUsers(),
        getAllCourses(false),
        getBusinessStats().catch(() => null),
      ]);
      setUsers(userData);
      setCourses(courseData);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{courses.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {stats?.revenue?.toFixed(0) || "0"} HUF
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/users">Manage users</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/courses">Manage courses</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/content">Edit content</Link>
        </Button>
        <Button asChild>
          <Link href="/lecturer/courses/new">New course</Link>
        </Button>
      </div>
    </div>
  );
}

export function AdminUsersPanel() {
  const { update: updateSession } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setUsers(await getAllUsers());
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRoleSelect(userId: string, nextRole: string) {
    const result = await updateUserRole(userId, nextRole);
    if (result.updatedSelf) {
      await updateSession();
    }
    loadUsers();
  }

  async function handleToggleAccess(userId: string, currentStatus: string) {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    await updateSubscriptionStatus(userId, nextStatus);
    loadUsers();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {pageUsers.map((u) => (
          <Card key={u._id}>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>
                  {roleLabel(u.role)}
                </Badge>
                <Badge variant={u.subscriptionStatus === "active" ? "default" : "outline"}>
                  {u.subscriptionStatus === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                <Select value={u.role} onValueChange={(val) => handleRoleSelect(u._id, val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {roleLabel(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant={u.subscriptionStatus === "active" ? "destructive" : "default"}
                  onClick={() => handleToggleAccess(u._id, u.subscriptionStatus)}
                >
                  {u.subscriptionStatus === "active" ? (
                    <>
                      <X className="h-4 w-4 mr-1" /> Revoke access
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Activate access
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageUsers.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "destructive" : "secondary"}>
                      {roleLabel(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.subscriptionStatus === "active" ? (
                      <Badge className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Select value={u.role} onValueChange={(val) => handleRoleSelect(u._id, val)}>
                        <SelectTrigger className="w-[140px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {roleLabel(r)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant={u.subscriptionStatus === "active" ? "destructive" : "default"}
                        onClick={() => handleToggleAccess(u._id, u.subscriptionStatus)}
                      >
                        {u.subscriptionStatus === "active" ? "Revoke" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="self-center">
            Page {page + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminCoursesPanel() {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setCourses(await getAllCourses(false));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/lecturer/courses/new">New course</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:hidden">
        {courses.map((c) => (
          <Card key={c._id}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.price || 0} HUF</p>
              </div>
              <Badge variant={c.isPublished ? "default" : "outline"}>
                {c.isPublished ? "Published" : "Draft"}
              </Badge>
              <Button size="sm" asChild>
                <Link href={`/lecturer/courses/${c._id}/edit`}>Edit</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-8">
                    No courses found.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.price || 0} HUF</TableCell>
                    <TableCell>
                      {c.isPublished ? (
                        <Badge className="bg-green-600">Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
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
    </div>
  );
}

export function AdminOverviewPage() {
  return (
    <AdminShell title="Overview">
      <AdminOverviewPanel />
    </AdminShell>
  );
}

export function AdminUsersPage() {
  return (
    <AdminShell title="Users">
      <AdminUsersPanel />
    </AdminShell>
  );
}

export function AdminCoursesPage() {
  return (
    <AdminShell
      title="Courses"
      actions={
        <Button asChild size="sm">
          <Link href="/lecturer/courses/new">New course</Link>
        </Button>
      }
    >
      <AdminCoursesPanel />
    </AdminShell>
  );
}
