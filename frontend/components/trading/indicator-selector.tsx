'use client';

import { useState } from "react";
import { Check, Info } from "lucide-react";

import { Button } from "@/components/ui/button";

const INDICATORS = [
  { id: "sma", label: "SMA", description: "Media movil simple" },
  { id: "ema", label: "EMA", description: "Media movil exponencial" },
  { id: "wma", label: "WMA", description: "Media movil ponderada" },
  { id: "rsi", label: "RSI", description: "Indice de fuerza relativa" },
  { id: "macd", label: "MACD", description: "Convergencia y divergencia de medias moviles" },
  { id: "bollinger", label: "Bollinger", description: "Bandas de Bollinger" },
  { id: "stochastic", label: "Estocastico", description: "Oscilador estocastico" },
  { id: "roc", label: "ROC", description: "Rate of change para medir momentum" },
  { id: "obv", label: "OBV", description: "On-balance volume para confirmar flujos" },
];

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onChange: (indicators: string[]) => void;
}

export function IndicatorSelector({ selectedIndicators, onChange }: IndicatorSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);

  const toggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      onChange(selectedIndicators.filter((id) => id !== indicatorId));
      return;
    }

    if (selectedIndicators.length >= 3) {
      alert("Limite alcanzado: maximo 3 indicadores para cuenta gratuita. Actualiza para mas indicadores.");
      return;
    }

    onChange([...selectedIndicators, indicatorId]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Indicadores tecnicos</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowInfo(!showInfo)}
          className="hover:bg-white/[0.06]"
        >
          {showInfo ? <Info className="h-4 w-4" /> : <Check className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        {INDICATORS.map((indicator) => {
          const isActive = selectedIndicators.includes(indicator.id);

          return (
            <label
              key={indicator.id}
              className={`flex items-center gap-2 rounded p-2 transition-colors hover:bg-white/[0.03] ${
                isActive ? "bg-emerald-300/10" : ""
              }`}
            >
              <Button
                type="button"
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator(indicator.id)}
                className={isActive ? "bg-emerald-300 text-slate-950" : "h-8 w-8 flex-shrink-0 p-0"}
              >
                {isActive ? indicator.label : ""}
              </Button>
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{indicator.label}</p>
                <p className="text-[9px] text-slate-400">{indicator.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      {showInfo && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[9px] text-slate-400">
            <strong>Nota:</strong> Los indicadores tecnicos ayudan a identificar tendencias y puntos de entrada o salida.
            La version gratuita permite hasta 3 indicadores simultaneos.
          </p>
        </div>
      )}
    </div>
  );
}
