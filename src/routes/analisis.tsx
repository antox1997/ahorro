import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Sparkles, TrendingUp, Trophy, UtensilsCrossed, Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { getInsights } from "@/services/api";
import { cn } from "@/lib/utils";

const iconMap = { AlertTriangle, Sparkles, TrendingUp, Trophy, UtensilsCrossed } as const;

const severityStyle: Record<string, string> = {
  info: "border-info/30 bg-info/5",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/40 bg-warning/10",
  danger: "border-destructive/30 bg-destructive/5",
};

const severityBadge: Record<string, string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/25 text-warning-foreground",
  danger: "bg-destructive/15 text-destructive",
};

export const Route = createFileRoute("/analisis")({
  component: InsightsPage,
});

function InsightsPage() {
  const { data: insights = [], isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
  });

  return (
    <AppShell>
      <PageHeader
        title="Análisis financiero"
        description="Recomendaciones inteligentes basadas en tus finanzas actuales."
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generando análisis financieros...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {insights.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-muted/10 border rounded-3xl">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">No hay recomendaciones disponibles todavía. Agrega transacciones para activar los análisis.</p>
            </div>
          ) : (
            insights.map((i) => {
              const Icon = (iconMap as Record<string, typeof Sparkles>)[i.icon] ?? Sparkles;
              return (
                <div key={i.id} className={cn("card-elevated flex gap-4 border-l-4 p-5", severityStyle[i.severity])}>
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", severityBadge[i.severity])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold">{i.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{i.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </AppShell>
  );
}
