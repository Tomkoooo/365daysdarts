import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type SubmissionStatus } from "@/lib/dolgozat-utils";
import { cn } from "@/lib/utils";

const variantMap: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  not_submitted: "outline",
  draft: "secondary",
  submitted: "default",
  submitted_late: "destructive",
  graded: "secondary",
};

export function SubmissionStatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  return (
    <Badge variant={variantMap[status]} className={cn(className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
