interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "default";
}

const variantClasses = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  default: "bg-gray-100 text-gray-800"
};

const statusToVariant: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  ACTIVE: "success",
  COMPLETED: "success",
  APPROVED: "success",
  PAID: "success",
  PLACED: "success",
  ACCEPTED: "success",
  IN_PROGRESS: "info",
  PENDING: "warning",
  DRAFT: "default",
  SCHEDULED: "info",
  PLANNING: "default",
  NEW: "info",
  SCREENING: "info",
  INTERVIEWING: "info",
  CONTACTED: "info",
  QUALIFIED: "success",
  PAUSED: "warning",
  ON_HOLD: "warning",
  INACTIVE: "default",
  CHURNED: "danger",
  CANCELLED: "danger",
  REJECTED: "danger",
  EXPIRED: "danger",
  TERMINATED: "danger",
  OVERDUE: "danger",
  LOST: "danger",
  UNQUALIFIED: "danger",
  WITHDRAWN: "danger"
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusToVariant[status] || "default";
  const displayStatus = status.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[resolvedVariant]}`}>
      {displayStatus}
    </span>
  );
}
