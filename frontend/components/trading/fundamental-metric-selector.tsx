'use client';

import { useMemo, useState, useEffect } from "react";
import { Activity, Check, Info, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { FUNDAMENTAL_METRIC_CATALOG, FundamentalCategory } from "@/lib/fundamental-metric-catalog";

interface FundamentalMetricSelectorProps {
  selectedMetrics: string[];
  onChange: (metrics: string[]) => void;
  assetCategory?: string; // e.g., "STOCKS", "CRYPTO", "COMMODITIES"
}

export function FundamentalMetricSelector({ selectedMetrics, onChange, assetCategory }: FundamentalMetricSelectorProps) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMetricId, setDetailMetricId] = useState<string | null>(null);
  
  // Filter metrics by asset category if provided
  const filteredMetrics = useMemo(() => {
    if (!assetCategory) return FUNDAMENTAL_METRIC_CATALOG;
    return FUNDAMENTAL_METRIC_CATALOG.filter(metric => 
      metric.categories.includes(assetCategory as FundamentalCategory)
    );
  }, [assetCategory]);
  
  const selectedDefinitions = useMemo(
    () => filteredMetrics.filter((metric) => selectedMetrics.includes(metric.id)),
    [selectedMetrics, filteredMetrics]
  );

  // Auto-open dialog when component mounts
  useEffect(() => {
    setOpen(true);
  }, []);

  const toggleMetric = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      onChange(selectedMetrics.filter((id) => id !== metricId));
      return;
    }

    // NO LIMIT: No maximum metrics restriction
    onChange([...selectedMetrics, metricId]);
  };

  const openDetail = (metricId: string) => {
    setDetailMetricId(metricId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailMetricId(null);
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Análisis Fundamental</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Selecciona las métricas fundamentales que deseas ver. Cada métrica incluye una explicación corta para entender su significado.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto rounded-[2rem] border-white/10 bg-slate-950 p-0 text-white">
            <DialogHeader className="border-b border-white/10 px-6 py-5">
              <DialogTitle className="text-2xl">Métricas Fundamentales</DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecciona las métricas que deseas aplicar. La descripción te dice que mide cada una y en qué caso
                sirve más.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 px-6 py-6">
              {/* Group metrics by section */}
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
                  <div className="grid gap-3 md:grid-cols-2">
                    {metrics.map((metric) => {
                      const active = selectedMetrics.includes(metric.id);

                      return (
                        <div key={metric.id} className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-base font-semibold text-white">{metric.label}</p>
                                {active && (
                                  <Badge className="bg-emerald-300 text-slate-950">
                                    <Check className="h-3 w-3" />
                                    Activo
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-slate-300">{metric.shortDescription}</p>
                            </div>
                            <div className="flex items-end space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDetail(metric.id)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                Detalles
                              </Button>
                              <Button
                                variant={active ? "outline" : "secondary"}
                                onClick={() => toggleMetric(metric.id)}
                                className="text-xs px-2 py-1"
                              >
                                {active ? "Quitar" : "Seleccionar"}
                              </Button>
                            </div>
                          </div>
                          {active && (
                            <p className="mt-2 text-xs leading-5 text-slate-400">{metric.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-white/10 bg-slate-950 p-6 text-white">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold">
              {detailMetricId ? filteredMetrics.find(m => m.id === detailMetricId)?.label ?? '' : 'Detalles'}
            </DialogTitle>
          </DialogHeader>
          {detailMetricId && (
            <>
              <DialogDescription className="mb-4 text-slate-400">
                {filteredMetrics.find(m => m.id === detailMetricId)?.shortDescription}
              </DialogDescription>
              <p className="mb-2 text-sm font-semibold text-slate-300">Uso:</p>
              <p className="mb-4 text-slate-400">
                {filteredMetrics.find(m => m.id === detailMetricId)?.description}
              </p>
            </>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* ALWAYS show selected metrics outside the dialog */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedDefinitions.length > 0 ? (
          selectedDefinitions.map((metric) => (
            <Badge
              key={metric.id}
              variant="outline"
              className="gap-2 rounded-full border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-100"
            >
              {metric.label}
              <button
                type="button"
                onClick={() => toggleMetric(metric.id)}
                className="rounded-full text-slate-400 transition hover:text-white"
                aria-label={`Quitar ${metric.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <div className="rounded-full border border-dashed border-white/10 px-3 py-1.5 text-xs text-slate-500">
            No hay métricas activas
          </div>
        )}
      </div>
    </div>
  );
}