import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-elevated flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-[240px]">{children}</div>
    </div>
  );
}
