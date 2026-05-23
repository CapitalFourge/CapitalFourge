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
import { INDICATOR_CATALOG, INDICATOR_CATEGORIES } from "@/lib/indicator-catalog";

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onChange: (indicators: string[]) => void;
}

export function IndicatorSelector({ selectedIndicators, onChange }: IndicatorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIndicatorId, setDetailIndicatorId] = useState<string | null>(null);
  const selectedDefinitions = useMemo(
    () => INDICATOR_CATALOG.filter((indicator) => selectedIndicators.includes(indicator.id)),
    [selectedIndicators]
  );

  // Auto-open dialog when component mounts
  useEffect(() => {
    setOpen(true);
  }, []);

  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      onChange(selectedIndicators.filter((id) => id !== indicatorId));
      return;
    }

    // REMOVED LIMIT: No more maximum indicators restriction
    onChange([...selectedIndicators, indicatorId]);
  };

  const openDetail = (indicatorId: string) => {
    setDetailIndicatorId(indicatorId);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailIndicatorId(null);
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Indicadores</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Activa solo los estudios que necesites. Cada indicador incluye una explicación corta para evitar
            llenar la gráfica con señales redundantes.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto rounded-[2rem] border-white/10 bg-slate-950 p-0 text-white">
            <DialogHeader className="border-b border-white/10 px-6 py-5">
              <DialogTitle className="text-2xl">Indicadores técnicos</DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecciona los indicadores que deseas aplicar. La descripción te dice que mide cada uno y en qué caso
                sirve más.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 px-6 py-6">
              {INDICATOR_CATEGORIES.map((category) => {
                const items = INDICATOR_CATALOG.filter((indicator) => indicator.category === category);

                return (
                  <section key={category}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{category}</h3>
                      <span className="text-xs text-slate-500">{items.length} disponibles</span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((indicator) => {
                        const active = selectedIndicators.includes(indicator.id);

                        return (
                          <div key={indicator.id} className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-semibold text-white">{indicator.label}</p>
                                  {active && (
                                    <Badge className="bg-emerald-300 text-slate-950">
                                      <Check className="h-3 w-3" />
                                      Activo
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-slate-300">{indicator.shortDescription}</p>
                              </div>
                              <div className="flex items-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openDetail(indicator.id)}
                                  className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                  Detalles
                                </Button>
                                <Button
                                  variant={active ? "outline" : "secondary"}
                                  onClick={() => toggleIndicator(indicator.id)}
                                  className="text-xs px-2 py-1"
                                >
                                  {active ? "Quitar" : "Seleccionar"}
                                </Button>
                              </div>
                            </div>
                            {active && (
                              <p className="mt-2 text-xs leading-5 text-slate-400">{indicator.usage}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-white/10 bg-slate-950 p-6 text-white">
          <DialogHeader className="border-b border-white/10 pb-4">
            <DialogTitle className="text-xl font-semibold">
              {detailIndicatorId ? INDICATOR_CATALOG.find(i => i.id === detailIndicatorId)?.label ?? '' : 'Detalles'}
            </DialogTitle>
          </DialogHeader>
          {detailIndicatorId && (
            <>
              <DialogDescription className="mb-4 text-slate-400">
                {INDICATOR_CATALOG.find(i => i.id === detailIndicatorId)?.shortDescription}
              </DialogDescription>
              <p className="mb-2 text-sm font-semibold text-slate-300">Uso:</p>
              <p className="mb-4 text-slate-400">
                {INDICATOR_CATALOG.find(i => i.id === detailIndicatorId)?.usage}
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

      {/* ALWAYS show selected indicators outside the dialog */}
      <div className="mt-4 flex flex-wrap gap-2">
        {selectedDefinitions.length > 0 ? (
          selectedDefinitions.map((indicator) => (
            <Badge
              key={indicator.id}
              variant="outline"
              className="gap-2 rounded-full border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-100"
            >
              {indicator.label}
              <button
                type="button"
                onClick={() => toggleIndicator(indicator.id)}
                className="rounded-full text-slate-400 transition hover:text-white"
                aria-label={`Quitar ${indicator.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <div className="rounded-full border border-dashed border-white/10 px-3 py-1.5 text-xs text-slate-500">
            No hay indicadores activos
          </div>
        )}
      </div>
    </div>
  );
}