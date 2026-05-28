import { Button } from "@/components/ui/button";

const TIMEFRAMES = [
  { label: "15M", hours: 0.25 }, // 15 minutes
  { label: "1H", hours: 1 },     // 1 hour
  { label: "4H", hours: 4 },     // 4 hours
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
  selectedHours,
  selectedDays,
  onChange,
}: {
  selectedHours: number | null;
  selectedDays: number | null;
  onChange: (hours: number | null, days: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((tf) => {
        const isActive = 
          (tf.hours !== undefined && tf.hours === selectedHours) ||
          (tf.days !== undefined && tf.days === selectedDays);
        return (
          <Button
            key={tf.label}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => 
              onChange(
                tf.hours !== undefined ? tf.hours : null,
                tf.days !== undefined ? tf.days : null
              )
            }
            className={isActive ? "bg-emerald-300 text-slate-950" : "hover:bg-white/[0.06]"}
          >
            {tf.label}
          </Button>
        );
      })}
    </div>
  );
}
