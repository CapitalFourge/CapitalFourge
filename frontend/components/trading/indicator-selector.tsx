'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";

const INDICATORS = [
  { id: "sma", label: "SMA", description: "Media Móvil Simple" },
  { id: "ema", label: "EMA", description: "Media Móvil Exponencial" },
  { id: "rsi", label: "RSI", description: "Índice de Fuerza Relativa" },
  { id: "macd", label: "MACD", description: "Convergencia/Divergencia de Medias Móviles" },
  { id: "bollinger", label: "Bollinger", description: "Bandas de Bollinger" },
  { id: "stochastic", label: "Estocástico", description: "Oscilador Estocástico" },
  { id: "volume", label: "Volumen", description: "Volumen de Trading" },
];

export function IndicatorSelector({
  selectedIndicators,
  onChange,
}: {
  selectedIndicators: string[];
  onChange: (indicators: string[]) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  const toggleIndicator = (indicatorId: string) => {
    onChange((prev) => {
      if (prev.includes(indicatorId)) {
        return prev.filter((id) => id !== indicatorId);
      } else {
        // Limit to 3 indicators for free tier (can be expanded based on subscription)
        if (prev.length >= 3 && !prev.includes(indicatorId)) {
          alert("Límite alcanzado: máximo 3 indicadores para cuenta gratuita. Actualiza para más indicadores.");
          return prev;
        }
        return [...prev, indicatorId];
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Indicadores Técnicos</h3>
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
              className={`flex items-center gap-2 p-2 rounded hover:bg-white/[0.03] transition-colors ${
                isActive ? "bg-emerald-300/10" : ""
              }`}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleIndicator(indicator.id)}
                className={`${isActive ? "bg-emerald-300 text-slate-950" : "w-8 h-8 flex-shrink-0"}`}
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
        <div className="border-t border-white/10 pt-4 mt-4">
          <p className="text-[9px] text-slate-400">
            <strong>Nota:</strong> Los indicadores técnicos ayudan a identificar tendencias y puntos de entrada/salida.
            La versión gratuita permite hasta 3 indicadores simultáneos. Actualiza tu plan para acceso ilimitado.
          </p>
        </div>
      )}
    </div>
  );
}
