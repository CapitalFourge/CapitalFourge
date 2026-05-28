'use client';

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { INDICATOR_CATALOG, INDICATOR_CATEGORIES } from "@/lib/indicator-catalog";

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onChange: (indicators: string[]) => void;
  maxIndicators?: number;
}

export function IndicatorSelector({ selectedIndicators, onChange, maxIndicators = 6 }: IndicatorSelectorProps) {
  const [showExamplesFor, setShowExamplesFor] = useState<string | null>(null);

  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      onChange(selectedIndicators.filter((id) => id !== indicatorId));
      return;
    }
    if (selectedIndicators.length >= maxIndicators) {
      onChange([...selectedIndicators.slice(1), indicatorId]);
      return;
    }
    onChange([...selectedIndicators, indicatorId]);
  };

  const indicator = showExamplesFor ? INDICATOR_CATALOG.find(i => i.id === showExamplesFor) : null;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Selecciona hasta {maxIndicators} indicadores. Aparecerán en el gráfico de TradingView.
        </p>
      </div>

      {INDICATOR_CATEGORIES.map((category) => {
        const items = INDICATOR_CATALOG.filter((indicator) => indicator.category === category);

        return (
          <section key={category} className="mb-6 last:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{category}</h3>
              <span className="text-xs text-slate-500">{items.length} disponibles</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((indicator) => {
                const active = selectedIndicators.includes(indicator.id);

                return (
                  <div key={indicator.id} className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
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
                        <p className="mt-1 text-sm text-slate-300">{indicator.shortDescription}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={active ? "outline" : "secondary"}
                          onClick={() => toggleIndicator(indicator.id)}
                          className="text-xs px-2 py-1"
                        >
                          {active ? "Quitar" : "Seleccionar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExamplesFor(indicator.id)}
                          className="text-xs px-2 py-1 text-slate-400 hover:text-white"
                        >
                          Ejemplos
                        </Button>
                      </div>
                    </div>
                    {active && (
                      <p className="mt-2 text-xs leading-5 text-emerald-400/70">{indicator.usage}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <Dialog open={!!showExamplesFor} onOpenChange={() => setShowExamplesFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {indicator?.label} - Ejemplos
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {indicator?.examples}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}