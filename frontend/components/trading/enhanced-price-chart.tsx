
"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import type { IndicatorData } from "@/lib/indicatorTypes";

interface PricePoint {
  date: string;
  price: number;
}

interface IndicatorData {
  id: string;
  data: { [key: string]: number }[];
  type: "line" | "area" | "histogram";
  yAxisId?: number;
  stroke?: string;
  fill?: string;
}

interface EnhancedPriceChartProps {
  data: PricePoint[];
  indicators: IndicatorData[];
  showPriceArea?: boolean;
}

export function EnhancedPriceChart({ 
  data, 
  indicators = [], 
  showPriceArea = true 
}: EnhancedPriceChartProps) {
  if (data.length < 2) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700">
          Accumulate more data points for chart analysis
        </p>
      </div>
    );
  }

  // Prepare chart data - ensure all data points align
  const chartData = data.map(point => ({
    date: point.date,
    price: point.price,
    ...indicators.reduce((acc, ind) => {
      const indPoint = ind.data.find(d => d.date === point.date);
      if (indPoint) {
        Object.keys(indPoint).forEach(key => {
          if (key !== 'date') {
            acc[key] = indPoint[key];
          }
        });
      }
      return acc;
    }, {} as Record<string, number>),
  }));

  // Determine if we need a secondary Y axis (for indicators like RSI, MACD)
  const usesSecondaryAxis = indicators.some(ind => 
    ["rsi", "macd"].includes(ind.id)
  );

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          
          {/* X Axis for dates */}
          <XAxis
            dataKey="date"
            stroke="#334155"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            padding={{ left: 0, right: 0 }}
            minTickGap={32}
          />
          
          {/* Primary Y Axis for price */}
          <YAxis 
            orientation="left"
            stroke="#334155"
            fontSize={9}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(val: number) => `$${val.toLocaleString(undefined, {maximumFractionDigits: 2})}`}
            domain={["dataMin", "dataMax"]}
          />
          
          {usesSecondaryAxis && (
            <YAxis 
              orientation="right"
              stroke="#334155"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(val: number) => val.toFixed(2)}
              domain={[0, 100]} // For RSI (0-100) and MACD (can be adjusted)
              tick={{ fill: "#64748b" }}
            />
          )}
          
          {/* Tooltip */}
          <Tooltip
            contentStyle={{ 
              backgroundColor: "rgba(8, 15, 28, 0.96)", 
              border: "1px solid rgba(255,255,255,0.08)", 
              borderRadius: "16px", 
              padding: "12px" 
            }}
            labelStyle={{ 
              color: "#64748b", 
              fontSize: "10px", 
              textTransform: "uppercase", 
              letterSpacing: "0.1em" 
            }}
            itemStyle={{ 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}
            formatter={(value: number, name: string) => {
              if (name === "price") {
                return `$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
              }
              // Format indicator values appropriately
              if (["rsi"].includes(name)) {
                return value.toFixed(2);
              }
              if (["macd", "signal", "histogram"].includes(name)) {
                return value.toFixed(4);
              }
              return value.toFixed(2);
            }}
          />
          
          {/* Price Area (optional) */}
          {showPriceArea && (
            <Area 
              type="monotone"
              dataKey="price"
              stroke="#6ee7b7"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          )}
          
          {/* Price Line */}
          <Line 
            type="monotone"
            dataKey="price"
            stroke="#6ee7b7"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
          />
          
          {/* Technical Indicators */}
          {indicators.map((indicator) => {
            const colorMap: Record<string, string> = {
              sma: "#fbbf24",
              ema: "#f97316",
              rsi: "#8b5cf6",
              macd: "#ec4899",
              signal: "#06b6d4",
              histogram: "#84cc16",
              upper: "#64748b",
              middle: "#64748b",
              lower: "#64748b",
            };
            
            const typeMap: Record<string, string> = {
              upper: "line",
              middle: "line",
              lower: "line",
            };
            
            // Determine which Y axis to use
            const yAxisId = ["rsi", "macd", "signal", "histogram"].includes(indicator.id) 
              && usesSecondaryAxis ? 1 : 0;
            
            // Handle Bollinger Bands (multiple lines)
            if (indicator.id === "bollinger") {
              return [
                <Line 
                  key={`bb-upper-${indicator.data[0]?.date}`} 
                  type="monotone"
                  dataKey="upper"
                  stroke={colorMap.upper}
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  yAxisId={yAxisId}
                />,
                <Line 
                  key=`bb-middle-${indicator.data[0]?.date}` 
                  type="monotone"
                  dataKey="middle"
                  stroke={colorMap.middle}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  yAxisId={yAxisId}
                />,
                <Line 
                  key=`bb-lower-${indicator.data[0]?.date}` 
                  type="monotone"
                  dataKey="lower"
                  stroke={colorMap.lower}
                  strokeWidth={1}
                  strokeDasharray="4 2"
                  yAxisId={yAxisId}
                />
              ];
            }
            
            // Handle MACD (multiple lines)
            if (indicator.id === "macd") {
              return [
                <Line 
                  key={`macd-${indicator.data[0]?.date}`} 
                  type="monotone"
                  dataKey="macd"
                  stroke={colorMap.macd}
                  strokeWidth={2}
                  yAxisId={yAxisId}
                />,
                <Line 
                  key={`signal-${indicator.data[0]?.date}`} 
                  type="monotone"
                  dataKey="signal"
                  stroke={colorMap.signal}
                  strokeWidth={2}
                  yAxisId={yAxisId}
                />,
                {indicator.data.some(d => d.histogram !== undefined) && (
                  <>
                    {indicator.data.map((d, idx) => 
                      d.histogram !== undefined ? (
                        <Bar 
                          key={`histogram-${idx}`} 
                          dataKey="histogram"
                          fill={d.histogram >= 0 ? "#10b981" : "#ef4444"}
                          data={[{ date: d.date, histogram: d.histogram }]}
                          yAxisId={yAxisId}
                        />
                      ) : null
                    )}
                  </>
                )}
              ];
            }
            
            // Single line indicators
            return (
              <Line 
                key={`${indicator.id}-${indicator.data[0]?.date}`} 
                type="monotone"
                dataKey={indicator.id}
                stroke={colorMap[indicator.id] || "#fff"}
                strokeWidth={indicator.id === "rsi" ? 1 : 2}
                yAxisId={yAxisId}
              />
            );
          })}
          
          {/* Gradient definition for price area */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar component for MACD histogram
interface BarProps {
  dataKey: string;
  fill: string;
  data: { date: string; [key: string]: number }[];
  yAxisId?: number;
}

function Bar({ dataKey, fill, data, yAxisId }: BarProps) {
  // This is a simplified approach - in practice, you might want to use Recharts Bar component
  // For now, we'll skip the histogram visualization in this example
  return null;
}
