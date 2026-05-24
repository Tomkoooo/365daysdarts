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
import { Badge } from "@/components/ui/badge";
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
  uploadedOnBehalf?: boolean;
};

export function SubmissionsTable({
  rows,
  gradeBasePath,
  onUploadOnBehalf,
}: {
  rows: SubmissionRow[];
  gradeBasePath: string;
  onUploadOnBehalf: (row: SubmissionRow) => void;
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
              <TableHead>Forrás</TableHead>
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
                <TableCell>
                  {row.uploadedOnBehalf ? (
                    <Badge variant="outline" className="text-xs">
                      E-mail / feltöltve
                    </Badge>
                  ) : row.submittedAt ? (
                    <span className="text-xs text-muted-foreground">Rendszer</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    size="sm"
                    variant={row.status === "not_submitted" ? "default" : "outline"}
                    onClick={() => onUploadOnBehalf(row)}
                  >
                    Beadás feltöltése
                  </Button>
                  {row.submissionId && row.photoCount > 0 && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${gradeBasePath}/${row.submissionId}`}>
                        {row.status === "graded" ? "Megtekintés" : "Értékelés"}
                      </Link>
                    </Button>
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
