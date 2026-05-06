import { useState } from "react";
import { Button } from "@/components/ui/button";

const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "YTD", days: null }, // Special case for year-to-date
  { label: "ALL", days: null }, // All available data
];

export function TimeframeSelector({
  selectedDays,
  onChange,
}: {
  selectedDays: number | null;
  onChange: (days: number | null) => void;
}) {
  return (
    <div className="flex gap-2">
      {TIMEFRAMES.map((tf) => {
        const isActive = tf.days === selectedDays;
        return (
          <Button
            key={tf.label}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(tf.days)}
            className={`${isActive ? "bg-emerald-300 text-slate-950" : "hover:bg-white/[0.06]"}`}
          >
            {tf.label}
          </Button>
        );
      })}
    </div>
  );
}