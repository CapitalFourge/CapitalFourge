"use client";

import { type MouseEvent as ReactMouseEvent, useMemo, useRef, useState, useEffect } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PencilLine, RectangleHorizontal, Slash, Trash2 } from "lucide-react";

import type { IndicatorData } from "@/lib/indicatorTypes";
import { Button } from "@/components/ui/button";

// Función para generar UUID versión 4 (compatível con navegadores y entornos de prueba)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface EnhancedPriceChartProps {
  data: PricePoint[];
  indicators: IndicatorData[];
  showPriceArea?: boolean;
}

type DrawingTool = "none" | "horizontal" | "trend" | "zone";

interface DraftPoint {
  x: number;
  y: number;
}

interface ChartAnnotation {
  id: string;
  type: Exclude<DrawingTool, "none">;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
}

const PRICE_AXIS_INDICATORS = new Set(["sma", "ema", "wma", "bollinger"]);
const OSCILLATOR_INDICATORS = new Set(["rsi", "stochastic"]);
const SECONDARY_AXIS_INDICATORS = new Set(["rsi", "macd", "stochastic", "roc", "obv"]);

const colorMap: Record<string, string> = {
  sma: "#fbbf24",
  ema: "#f97316",
  wma: "#fb7185",
  rsi: "#8b5cf6",
  macd: "#ec4899",
  signal: "#06b6d4",
  histogram: "#84cc16",
  upper: "#94a3b8",
  middle: "#64748b",
  lower: "#94a3b8",
  stochastick: "#a855f7",
  stochastics: "#22d3ee",
  roc: "#38bdf8",
  obv: "#f59e0b",
};

export function EnhancedPriceChart({
  data,
  indicators = [],
  showPriceArea = true,
}: EnhancedPriceChartProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [draftPoint, setDraftPoint] = useState<DraftPoint | null>(null);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [annotationEditMode, setAnnotationEditMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [editPoint, setEditPoint] = useState<{ x: number; y: number } | null>(null);

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: point.date,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        ...indicators.reduce((acc, indicator) => {
          const indicatorPoint = indicator.data.find((entry) => entry.date === point.date);
          if (!indicatorPoint) {
            return acc;
          }

          Object.entries(indicatorPoint).forEach(([key, value]) => {
            if (key !== "date" && typeof value === "number") {
              acc[key] = value;
            }
          });

          return acc;
        }, {} as Record<string, number>),
      })),
    [data, indicators]
  );

  const usesSecondaryAxis = indicators.some((indicator) => SECONDARY_AXIS_INDICATORS.has(indicator.id));
  const hasOscillator = indicators.some((indicator) => OSCILLATOR_INDICATORS.has(indicator.id));

  const secondaryAxisValues = chartData.flatMap((point) =>
    Object.entries(point)
      .filter(([key, value]) => key !== "date" && key !== "price" && typeof value === "number")
      .filter(([key]) => !PRICE_AXIS_INDICATORS.has(key))
      .map(([, value]) => Number(value))
  );

  const secondaryDomain: [number | "auto", number | "auto"] = hasOscillator && secondaryAxisValues.length === 0
    ? [0, 100]
    : ["auto", "auto"];

  const projectX = (value: number) => `${value * 100}%`;
  const projectY = (value: number) => `${value * 100}%`;

  const resetDrawingState = () => {
    setDraftPoint(null);
    setActiveTool("none");
  };

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (activeTool === "none" || !overlayRef.current) return;

    const bounds = overlayRef.current.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);

    if (activeTool === "horizontal") {
      setAnnotations(prev => [
        ...prev,
        {
          id: generateUUID(),
          type: "horizontal",
          x1: 0,
          y1: y,
          x2: 1,
          y2: y,
        },
      ]);
      resetDrawingState();
      return;
    }

    if (!draftPoint) {
      setDraftPoint({ x, y });
      return;
    }

    setAnnotations(prev => [
      ...prev,
      {
        id: generateUUID(),
        type: activeTool,
        x1: draftPoint.x,
        y1: draftPoint.y,
        x2: x,
        y2: y,
      },
    ]);
    resetDrawingState();
  };

  const handleAnnotationClick = (annotation: ChartAnnotation, e: ReactMouseEvent<SVGElement>) => {
    e.stopPropagation(); // Evitar que active el click del overlay
    setActiveAnnotationId(annotation.id);
    setAnnotationEditMode('move');
  };

  const handleHandleMouseDown = (
    e: ReactMouseEvent<SVGElement>, 
    annotationId: string, 
    handle: 'start' | 'end'
  ) => {
    e.stopPropagation();
    const annotation = annotations.find(a => a.id === annotationId)!;
    setActiveAnnotationId(annotationId);
    setAnnotationEditMode(handle === 'start' ? 'resize-start' : 'resize-end');
    const point = handle === 'start' 
      ? { x: annotation.x1, y: annotation.y1 } 
      : { x: annotation.x2!, y: annotation.y2! };
    setEditPoint(point);
  };

  // Effect para mover/redimensionar anotaciones seleccionadas
  useEffect(() => {
    if (!activeAnnotationId || !annotationEditMode || !editPoint) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!overlayRef.current) return;
      
      const bounds = overlayRef.current.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - bounds.left) / bounds.width, 0), 1);
      const y = Math.min(Math.max((e.clientY - bounds.top) / bounds.height, 0), 1);

      setAnnotations(prev => 
        prev.map(ann => {
          if (ann.id !== activeAnnotationId) return ann;
          
          switch (annotationEditMode) {
            case 'move': {
              const dx = x - editPoint.x;
              const dy = y - editPoint.y;
              return {
                ...ann,
                x1: ann.x1 + dx,
                y1: ann.y1 + dy,
                x2: ann.x2 !== undefined ? ann.x2 + dx : ann.x2,
                y2: ann.y2 !== undefined ? ann.y2 + dy : ann.y2,
              };
            }
            case 'resize-start': {
              if (ann.type === 'horizontal') return ann; // Las horizontales no se redimensionan en X
              return {
                ...ann,
                x1: x,
                y1: y,
              };
            }
            case 'resize-end': {
              if (ann.type === 'horizontal') return ann;
              return {
                ...ann,
                x2: x,
                y2: y,
              };
            }
            default:
              return ann;
          }
        })
      );
    };

    const handleMouseUp = () => {
      setAnnotationEditMode(null);
      setEditPoint(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeAnnotationId, annotationEditMode, editPoint, annotations]);

  const renderOverlay = () => (
    <div className="pointer-events-none absolute inset-[52px_20px_16px_16px]">
      <svg className="h-full w-full overflow-visible">
        {annotations.map(annotation => {
          const isActive = activeAnnotationId === annotation.id;
          
          // Línea base (horizontal, trend o zone)
          const baseElement = () => {
            if (annotation.type === "horizontal") {
              return (
                <line
                  key={annotation.id}
                  x1="0%"
                  y1={projectY(annotation.y1)}
                  x2="100%"
                  y2={projectY(annotation.y1)}
                  stroke={isActive ? "#fbbf24" : "#f8fafc"}
                  strokeWidth={isActive ? 2 : 1.5}
                  strokeDasharray={isActive ? "2 2" : "6 4"}
                  opacity={0.9}
                  onClick={e => handleAnnotationClick(annotation, e)}
                  cursor="pointer"
                />
              );
            }

            if (annotation.type === "trend" && annotation.x2 !== undefined && annotation.y2 !== undefined) {
              return (
                <line
                  key={annotation.id}
                  x1={projectX(annotation.x1)}
                  y1={projectY(annotation.y1)}
                  x2={projectX(annotation.x2)}
                  y2={projectY(annotation.y2)}
                  stroke={isActive ? "#fbbf24" : "#38bdf8"}
                  strokeWidth={isActive ? 3 : 2}
                  opacity={0.9}
                  onClick={e => handleAnnotationClick(annotation, e)}
                  cursor="pointer"
                />
              );
            }

            if (annotation.type === "zone" && annotation.x2 !== undefined && annotation.y2 !== undefined) {
              const left = Math.min(annotation.x1, annotation.x2);
              const top = Math.min(annotation.y1, annotation.y2);
              const width = Math.abs(annotation.x2 - annotation.x1);
              const height = Math.abs(annotation.y2 - annotation.y1);
              
              return (
                <g key={annotation.id} onClick={e => handleAnnotationClick(annotation, e)} cursor="pointer">
                  <rect
                    x={projectX(left)}
                    y={projectY(top)}
                    width={`${width * 100}%`}
                    height={`${height * 100}%`}
                    fill={isActive ? "rgba(251, 191, 36, 0.2)" : "rgba(110, 231, 183, 0.14)"}
                    stroke={isActive ? "#fbbf24" : "#6ee7b7"}
                    strokeWidth={isActive ? 2 : 1.5}
                    rx={6}
                  />
                </g>
              );
            }
            
            return null;
          };

          // Handles para redimensionado (solo si está activa)
          const handles = () => {
            if (!isActive) return null;
            
            const getHandlePos = (x: number, y: number) => ({
              cx: projectX(x),
              cy: projectY(y),
              r: 4,
              fill: "#ffffff",
              stroke: "#fbbf24",
              strokeWidth: 1.5
            });

            if (annotation.type === "horizontal") {
              return (
                <>
                  {/* Handle izquierdo (solo Y editable) */}
                  {annotation.y1 !== undefined && (
                    <circle 
                      {...getHandlePos(0, annotation.y1)} 
                      onMouseDown={e => handleHandleMouseDown(e, annotation.id, 'start')}
                      cursor="row-resize"
                    />
                  )}
                  {/* Handle derecho (solo Y editable) */}
                  {annotation.y2 !== undefined && (
                    <circle 
                      {...getHandlePos(1, annotation.y2)} 
                      onMouseDown={e => handleHandleMouseDown(e, annotation.id, 'end')}
                      cursor="row-resize"
                    />
                  )}
                </>
              );
            }

            if (annotation.type === "trend" || annotation.type === "zone") {
              return (
                <>
                  {annotation.x1 !== undefined && annotation.y1 !== undefined && (
                    <circle 
                      {...getHandlePos(annotation.x1, annotation.y1)} 
                      onMouseDown={e => handleHandleMouseDown(e, annotation.id, 'start')}
                      cursor="pointer"
                    />
                  )}
                  {annotation.x2 !== undefined && annotation.y2 !== undefined && (
                    <circle 
                      {...getHandlePos(annotation.x2, annotation.y2)} 
                      onMouseDown={e => handleHandleMouseDown(e, annotation.id, 'end')}
                      cursor="pointer"
                    />
                  )}
                </>
              );
            }
            
            return null;
          };

          return (
            <g key={annotation.id}>
              {baseElement()}
              {handles()}
            </g>
          );
        })}
        
        {/* Punto de borrador (igual que antes) */}
        {draftPoint && activeTool !== "horizontal" && (
          <circle
            cx={projectX(draftPoint.x)}
            cy={projectY(draftPoint.y)}
            r="4"
            fill="#ffffff"
            opacity={0.9}
          />
        )}
      </svg>
    </div>
  );

  if (data.length < 2) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700">
          Accumulate more data points for chart analysis
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
          Analisis tecnico y dibujo
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeTool === "horizontal" ? "default" : "outline"}
            className="h-8 rounded-full"
            onClick={() => {
              setDraftPoint(null);
              setActiveTool((current) => (current === "horizontal" ? "none" : "horizontal"));
            }}
          >
            <RectangleHorizontal className="mr-2 h-3.5 w-3.5" />
            Soporte
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTool === "trend" ? "default" : "outline"}
            className="h-8 rounded-full"
            onClick={() => {
              setDraftPoint(null);
              setActiveTool((current) => (current === "trend" ? "none" : "trend"));
            }}
          >
            <Slash className="mr-2 h-3.5 w-3.5" />
            Tendencia
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTool === "zone" ? "default" : "outline"}
            className="h-8 rounded-full"
            onClick={() => {
              setDraftPoint(null);
              setActiveTool((current) => (current === "zone" ? "none" : "zone"));
            }}
          >
            <PencilLine className="mr-2 h-3.5 w-3.5" />
            Zona
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 rounded-full text-slate-300"
            onClick={() => {
              setAnnotations([]);
              resetDrawingState();
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>

      <div
        ref={overlayRef}
        className={`relative h-[calc(100%-44px)] ${
          activeTool === "none" ? "" : "cursor-crosshair"
        }`}
        onClick={handleOverlayClick}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 16, right: 14, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#334155"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              padding={{ left: 0, right: 0 }}
              minTickGap={32}
            />

            <YAxis
              orientation="left"
              stroke="#334155"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value: number) => `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
              domain={["dataMin", "dataMax"]}
              yAxisId={0}
            />

            {usesSecondaryAxis && (
              <YAxis
                orientation="right"
                stroke="#334155"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(value: number) => value.toFixed(2)}
                domain={secondaryDomain}
                tick={{ fill: "#64748b" }}
                yAxisId={1}
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(8, 15, 28, 0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "12px",
              }}
              labelStyle={{
                color: "#64748b",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
              itemStyle={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              formatter={(value: number, name: string) => {
                if (name === "price") {
                  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
                }

                if (["macd", "signal", "histogram", "roc"].includes(name)) {
                  return value.toFixed(4);
                }

                return value.toFixed(2);
              }}
            />

            {showPriceArea && (
              <Area
                type="monotone"
                dataKey="price"
                stroke="#6ee7b7"
                strokeWidth={2}
                fill="url(#priceGradient)"
                yAxisId={0}
              />
            )}

            <Line
              type="monotone"
              dataKey="price"
              stroke="#6ee7b7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
              yAxisId={0}
            />

            {indicators.some((indicator) => indicator.id === "rsi") && (
              <>
                <ReferenceLine y={30} stroke="#7c3aed" strokeDasharray="4 4" yAxisId={1} />
                <ReferenceLine y={70} stroke="#7c3aed" strokeDasharray="4 4" yAxisId={1} />
              </>
            )}

            {indicators.some((indicator) => indicator.id === "stochastic") && (
              <>
                <ReferenceLine y={20} stroke="#0891b2" strokeDasharray="4 4" yAxisId={1} />
                <ReferenceLine y={80} stroke="#0891b2" strokeDasharray="4 4" yAxisId={1} />
              </>
            )}

            {indicators.map((indicator) => {
              const yAxisId = SECONDARY_AXIS_INDICATORS.has(indicator.id) ? 1 : 0;

              if (indicator.id === "bollinger") {
                return [
                  <Line key="bb-upper" type="monotone" dataKey="upper" stroke={colorMap.upper} strokeWidth={1} strokeDasharray="4 2" yAxisId={0} dot={false} />,
                  <Line key="bb-middle" type="monotone" dataKey="middle" stroke={colorMap.middle} strokeWidth={1} strokeDasharray="2 2" yAxisId={0} dot={false} />,
                  <Line key="bb-lower" type="monotone" dataKey="lower" stroke={colorMap.lower} strokeWidth={1} strokeDasharray="4 2" yAxisId={0} dot={false} />,
                ];
              }

              if (indicator.id === "macd") {
                return [
                  <Bar key="macd-histogram" dataKey="histogram" fill="#84cc16" opacity={0.35} yAxisId={1} />,
                  <Line key="macd-line" type="monotone" dataKey="macd" stroke={colorMap.macd} strokeWidth={2} yAxisId={1} dot={false} />,
                  <Line key="macd-signal" type="monotone" dataKey="signal" stroke={colorMap.signal} strokeWidth={2} yAxisId={1} dot={false} />,
                ];
              }

              if (indicator.id === "stochastic") {
                return [
                  <Line key="stochastic-k" type="monotone" dataKey="stochastick" stroke={colorMap.stochastick} strokeWidth={2} yAxisId={1} dot={false} />,
                  <Line key="stochastic-d" type="monotone" dataKey="stochastics" stroke={colorMap.stochastics} strokeWidth={2} yAxisId={1} dot={false} />,
                ];
              }

              const dataKey = indicator.id;
              return (
                <Line
                  key={indicator.id}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={colorMap[dataKey] || "#ffffff"}
                  strokeWidth={indicator.id === "rsi" || indicator.id === "roc" ? 1.5 : 2}
                  yAxisId={yAxisId}
                  dot={false}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {renderOverlay()}

        {(activeTool !== "none" || draftPoint) && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
            {draftPoint
              ? "Selecciona el segundo punto"
              : activeTool === "horizontal"
                ? "Haz click para marcar soporte o resistencia"
                : activeTool === "trend"
                  ? "Selecciona el punto inicial"
                  : "Marca dos esquinas para la zona"}
          </div>
        )}
      </div>
    </div>
  );
}
