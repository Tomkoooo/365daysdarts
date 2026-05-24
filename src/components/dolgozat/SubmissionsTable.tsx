"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";
import type { SubmissionStatus } from "@/lib/dolgozat-utils";
import Link from "next/link";

export type SubmissionRow = {
  studentId: string;
  name: string;
  email: string;
  status: SubmissionStatus;
  statusLabel: string;
  submissionId?: string;
  submittedAt: string | null;
  isLate: boolean;
  points: number | null;
  photoCount: number;
};

export function SubmissionsTable({
  rows,
  gradeBasePath,
}: {
  rows: SubmissionRow[];
  gradeBasePath: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Keresés név vagy email szerint..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanuló</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Státusz</TableHead>
              <TableHead>Beadva</TableHead>
              <TableHead>Pont</TableHead>
              <TableHead className="text-right">Művelet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.studentId}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-muted-foreground">{row.email}</TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  {row.submittedAt
                    ? new Date(row.submittedAt).toLocaleString("hu-HU")
                    : "—"}
                  {row.isLate && (
                    <span className="block text-xs text-destructive">Későn</span>
                  )}
                </TableCell>
                <TableCell>{row.points != null ? row.points : "—"}</TableCell>
                <TableCell className="text-right">
                  {row.submissionId && row.photoCount > 0 ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${gradeBasePath}/${row.submissionId}`}>
                        {row.status === "graded" ? "Megtekintés" : "Értékelés"}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
