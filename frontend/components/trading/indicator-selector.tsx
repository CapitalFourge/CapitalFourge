'use client';

import { useMemo, useState } from "react";
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
} from "@/components/ui/dialog";
import { INDICATOR_CATALOG, INDICATOR_CATEGORIES } from "@/lib/indicator-catalog";

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onChange: (indicators: string[]) => void;
}

const MAX_INDICATORS = 3;

export function IndicatorSelector({ selectedIndicators, onChange }: IndicatorSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedDefinitions = useMemo(
    () => INDICATOR_CATALOG.filter((indicator) => selectedIndicators.includes(indicator.id)),
    [selectedIndicators]
  );

  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      onChange(selectedIndicators.filter((id) => id !== indicatorId));
      return;
    }

    if (selectedIndicators.length >= MAX_INDICATORS) {
      window.alert("Limite alcanzado: maximo 3 indicadores simultaneos en esta vista.");
      return;
    }

    onChange([...selectedIndicators, indicatorId]);
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Indicadores</p>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Activa solo los estudios que necesites. Cada indicador incluye una explicacion corta para evitar
            llenar la grafica con senales redundantes.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-emerald-400/30 bg-emerald-400/10 px-5 text-emerald-200 hover:bg-emerald-400/15"
            >
              <Activity className="h-4 w-4" />
              Indicadores
              <Badge variant="outline" className="border-emerald-300/25 bg-transparent text-emerald-100">
                {selectedIndicators.length}/{MAX_INDICATORS}
              </Badge>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto rounded-[2rem] border-white/10 bg-slate-950 p-0 text-white">
            <DialogHeader className="border-b border-white/10 px-6 py-5">
              <DialogTitle className="text-2xl">Indicadores tecnicos</DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecciona hasta {MAX_INDICATORS} indicadores. La descripcion te dice que mide cada uno y en que caso
                sirve mas.
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
                          <button
                            key={indicator.id}
                            type="button"
                            onClick={() => toggleIndicator(indicator.id)}
                            className={`rounded-3xl border px-4 py-4 text-left transition ${
                              active
                                ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(74,222,128,0.15)]"
                                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                            }`}
                          >
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
                              <Info className="mt-0.5 h-4 w-4 text-slate-500" />
                            </div>
                            <p className="mt-4 text-xs leading-5 text-slate-400">{indicator.usage}</p>
                          </button>
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
