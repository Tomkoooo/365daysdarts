"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  getAllUsers,
  updateUserRole,
  updateSubscriptionStatus,
  getAdminDashboardStats,
  sendBulkEmailAction,
} from "@/actions/admin-actions";
import { getAllCourses } from "@/actions/course-actions";
import { Check, X, Search, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { UserRole } from "@/models/User";

const PAGE_SIZE = 10;
const ROLE_OPTIONS: UserRole[] = ["student", "lecturer", "business", "admin"];

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "lecturer":
      return "Oktató";
    case "business":
      return "Üzleti";
    default:
      return "Tanuló";
  }
}

type DashboardStats = Awaited<ReturnType<typeof getAdminDashboardStats>>;

export function AdminOverviewPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailCourseId, setEmailCourseId] = useState<string>("all");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [statsData, courseData] = await Promise.all([
        getAdminDashboardStats(),
        getAllCourses(false),
      ]);
      setStats(statsData);
      setCourses(courseData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendBulkEmail() {
    setSending(true);
    try {
      const result = await sendBulkEmailAction(
        emailSubject,
        emailBody,
        emailCourseId === "all" ? undefined : emailCourseId
      );
      if (result.success) {
        toast.success(`${result.sent} e-mail elküldve`);
        setEmailSubject("");
        setEmailBody("");
      } else {
        toast.error(result.error || "Küldés sikertelen");
      }
    } catch {
      toast.error("Hiba történt a küldés során");
    } finally {
      setSending(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes felhasználó</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kurzusok</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.totalCourses}</CardContent>
        </Card>
        {stats.enableBilling && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Havi bevétel</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {stats.revenue?.toFixed(0) || "0"} HUF
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Aktív előfizetések</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {stats.activeSubscriptions ?? 0}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Utolsó 24 óra</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Új regisztrációk</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.recentActivity.newRegistrations}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Beküldött dolgozatok</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.recentActivity.submittedDolgozats}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opcióválasztások</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.recentActivity.selectedOptions}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Befejezett kurzusok</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {stats.recentActivity.completedCourses}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/admin/users">Felhasználók kezelése</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/courses">Kurzusok kezelése</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/content">Tartalom szerkesztése</Link>
        </Button>
        <Button asChild>
          <Link href="/lecturer/courses/new">Új kurzus</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Hírlevél küldése
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            E-mailek küldése tanulóknak. Ha nincs SMTP beállítva, a küldés kihagyásra
            kerül.
          </p>
          <div className="space-y-2">
            <Label>Címzettek</Label>
            <Select value={emailCourseId} onValueChange={setEmailCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Címzettek kiválasztása" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Összes tanuló</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.title} (beiratkozott tanulók)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tárgy</Label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="E-mail tárgya"
            />
          </div>
          <div className="space-y-2">
            <Label>Üzenet</Label>
            <div className="rounded-md border overflow-hidden">
              <RichTextEditor
                value={emailBody}
                onChange={setEmailBody}
                placeholder="Írd ide az üzenetet..."
                variant="light"
                minHeight={200}
              />
            </div>
          </div>
          <Button onClick={handleSendBulkEmail} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Küldés...
              </>
            ) : (
              "E-mailek küldése"
            )}
          </Button>
        </CardContent>
      </Card>
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
            placeholder="Keresés név vagy e-mail szerint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Szerepkör szűrő" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Minden szerepkör</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {roleLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                  {u.subscriptionStatus === "active" ? "Aktív" : "Inaktív"}
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
                      <X className="h-4 w-4 mr-1" /> Hozzáférés visszavonása
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Hozzáférés aktiválása
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Szerepkör</TableHead>
                <TableHead>Hozzáférés</TableHead>
                <TableHead>Műveletek</TableHead>
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
                      <Badge className="bg-green-600">Aktív</Badge>
                    ) : (
                      <Badge variant="outline">Inaktív</Badge>
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
                        {u.subscriptionStatus === "active" ? "Visszavonás" : "Aktiválás"}
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
          {filtered.length} felhasználó
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Előző
          </Button>
          <span className="self-center">
            {page + 1}. oldal / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Következő
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminCoursesPanel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enableBilling, setEnableBilling] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const [courseData, stats] = await Promise.all([
        getAllCourses(false),
        getAdminDashboardStats(),
      ]);
      setCourses(courseData);
      setEnableBilling(stats.enableBilling);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/lecturer/courses/new">Új kurzus</Link>
        </Button>
      </div>

      <div className="grid gap-3 md:hidden">
        {courses.map((c) => (
          <Card key={c._id}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                {enableBilling && (
                  <p className="text-sm text-muted-foreground">{c.price || 0} HUF</p>
                )}
              </div>
              <Badge variant={c.isPublished ? "default" : "outline"}>
                {c.isPublished ? "Közzétéve" : "Piszkozat"}
              </Badge>
              <Button size="sm" asChild>
                <Link href={`/lecturer/courses/${c._id}/edit`}>Szerkesztés</Link>
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
                <TableHead>Cím</TableHead>
                {enableBilling && <TableHead>Ár</TableHead>}
                <TableHead>Státusz</TableHead>
                <TableHead>Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={enableBilling ? 4 : 3} className="text-center p-8">
                    Nincs kurzus.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    {enableBilling && <TableCell>{c.price || 0} HUF</TableCell>}
                    <TableCell>
                      {c.isPublished ? (
                        <Badge className="bg-green-600">Közzétéve</Badge>
                      ) : (
                        <Badge variant="outline">Piszkozat</Badge>
                      )}
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
    </div>
  );
}

export function AdminOverviewPage() {
  return (
    <AdminShell title="Áttekintés">
      <AdminOverviewPanel />
    </AdminShell>
  );
}

export function AdminUsersPage() {
  return (
    <AdminShell title="Felhasználók">
      <AdminUsersPanel />
    </AdminShell>
  );
}

export function AdminCoursesPage() {
  return (
    <AdminShell
      title="Kurzusok"
      actions={
        <Button asChild size="sm">
          <Link href="/lecturer/courses/new">Új kurzus</Link>
        </Button>
      }
    >
      <AdminCoursesPanel />
    </AdminShell>
  );
}
