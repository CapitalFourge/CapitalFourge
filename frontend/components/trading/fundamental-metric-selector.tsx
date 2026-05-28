'use client';

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { FUNDAMENTAL_METRIC_CATALOG, FundamentalCategory } from "@/lib/fundamental-metric-catalog";

interface FundamentalMetricSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
  assetCategory?: string;
  onMetricSelect?: (metricId: string) => void;
}

export function FundamentalMetricSelector({ selectedMetrics, onChange, assetCategory, onMetricSelect }: FundamentalMetricSelectorProps) {
  const [showExamplesFor, setShowExamplesFor] = useState<string | null>(null);

  const filteredMetrics = !assetCategory
    ? FUNDAMENTAL_METRIC_CATALOG
    : FUNDAMENTAL_METRIC_CATALOG.filter(metric =>
        metric.categories.includes(assetCategory as FundamentalCategory)
      );

  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onChange(selectedMetrics.filter((id) => id !== metricId));
      return;
    }
    onChange([...selectedMetrics, metricId]);
    onMetricSelect?.(metricId);
  };

  const metric = showExamplesFor ? FUNDAMENTAL_METRIC_CATALOG.find(m => m.id === showExamplesFor) : null;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Selecciona las métricas fundamentales que deseas ver. Incluyen valor actual y contexto.
        </p>
      </div>

      <div className="space-y-6">
        {Array.from(
          filteredMetrics.reduce((acc, metric) => {
            const section = metric.section;
            if (!acc.has(section)) acc.set(section, []);
            acc.get(section)!.push(metric);
            return acc;
          }, new Map<string, typeof filteredMetrics>())
        ).map(([section, metrics]) => (
          <section key={section}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{section}</h3>
              <span className="text-xs text-slate-500">{metrics.length} disponibles</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {metrics.map((metric) => {
                const active = selectedMetrics.includes(metric.id);

                return (
                  <Card key={metric.id} className="border-white/10 bg-white/[0.02]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        {metric.label}
                        {active && (
                          <Badge className="bg-emerald-300 text-slate-950">
                            <Check className="h-3 w-3" />
                            Activo
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300">{metric.description}</p>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant={active ? "outline" : "secondary"}
                          onClick={() => toggleMetric(metric.id)}
                          className="text-xs"
                        >
                          {active ? "Quitar" : "Seleccionar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExamplesFor(metric.id)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Ejemplos
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!showExamplesFor} onOpenChange={() => setShowExamplesFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {metric?.label} - Ejemplos
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {metric?.examples}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}