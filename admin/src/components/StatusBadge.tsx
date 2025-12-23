import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "booked" | "canceled" | "paid" | "unpaid" | "expired";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    pending: "bg-warning/10 text-warning border-warning/20",
    booked: "bg-success/10 text-success border-success/20",
    canceled: "bg-destructive/10 text-destructive border-destructive/20",
    paid: "bg-success/10 text-success border-success/20",
    unpaid: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[status],
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
