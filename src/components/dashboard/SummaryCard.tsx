import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "info" | "destructive";
}

const accentMap: Record<NonNullable<SummaryCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export function SummaryCard({ label, value, icon: Icon, trend, hint, accent = "primary" }: SummaryCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="card-elevated card-elevated-hover flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
        {(trend !== undefined || hint) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                  positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
