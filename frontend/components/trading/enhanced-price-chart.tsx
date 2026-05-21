"use client";

import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  Cell,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BetweenHorizontalStart,
  CandlestickChart,
  ChartNoAxesColumn,
  ChevronsUpDown,
  PencilLine,
  Slash,
  Trash2,
} from "lucide-react";

import type { IndicatorData } from "@/lib/indicatorTypes";
import type { DrawingTool } from "@/lib/chart-drawing-catalog";
import { DRAWING_TOOL_CATALOG, DRAWING_TOOL_SECTIONS } from "@/lib/chart-drawing-catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  chartType?: "area" | "line" | "candles";
  showPriceArea?: boolean;
}

type ChartAnnotationType = Exclude<DrawingTool, "none">;
type InteractionMode = "idle" | "drawing" | "moving" | "resize-start" | "resize-end";

interface ChartAnnotation {
  id: string;
  type: ChartAnnotationType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface OverlayPoint {
  x: number;
  y: number;
}

interface DragState {
  annotationId: string;
  mode: Exclude<InteractionMode, "idle" | "drawing">;
  origin: OverlayPoint;
  snapshot: ChartAnnotation;
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

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function roundPoint(point: OverlayPoint): OverlayPoint {
  return {
    x: Number(clamp(point.x).toFixed(4)),
    y: Number(clamp(point.y).toFixed(4)),
  };
}

function normalizeAnnotation(annotation: ChartAnnotation): ChartAnnotation {
  if (annotation.type === "horizontal") {
    return { ...annotation, x1: 0, x2: 1, y2: annotation.y1 };
  }

  if (annotation.type === "vertical") {
    return { ...annotation, x2: annotation.x1, y1: 0, y2: 1 };
  }

  return annotation;
}

function getToolIcon(tool: ChartAnnotationType) {
  switch (tool) {
    case "horizontal":
      return <BetweenHorizontalStart className="h-3.5 w-3.5" />;
    case "trend":
      return <Slash className="h-3.5 w-3.5" />;
    case "arrow":
      return <ArrowRight className="h-3.5 w-3.5" />;
    case "vertical":
      return <ChevronsUpDown className="h-3.5 w-3.5" />;
    case "zone":
      return <PencilLine className="h-3.5 w-3.5" />;
    case "fibonacci":
      return <ChartNoAxesColumn className="h-3.5 w-3.5" />;
    default:
      return <CandlestickChart className="h-3.5 w-3.5" />;
  }
}

export function EnhancedPriceChart({
  data,
  indicators = [],
  chartType = "area",
  showPriceArea = true,
}: EnhancedPriceChartProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("idle");
  const [draftStart, setDraftStart] = useState<OverlayPoint | null>(null);
  const [draftCurrent, setDraftCurrent] = useState<OverlayPoint | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        date: point.date,
        price: point.close,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        wickBase: point.low,
        wickSpan: Math.max(point.high - point.low, 0.000001),
        bodyBase: Math.min(point.open, point.close),
        bodySpan: Math.max(Math.abs(point.close - point.open), 0.000001),
        isBullish: point.close >= point.open ? 1 : 0,
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
      .filter(([key, value]) => key !== "date" && typeof value === "number")
      .filter(([key]) => !["price", "open", "high", "low", "close", "volume"].includes(key))
      .filter(([key]) => !PRICE_AXIS_INDICATORS.has(key))
      .map(([, value]) => Number(value))
  );

  const secondaryDomain: [number | "auto", number | "auto"] =
    hasOscillator && secondaryAxisValues.length === 0 ? [0, 100] : ["auto", "auto"];

  const projectX = (value: number) => `${value * 100}%`;
  const projectY = (value: number) => `${value * 100}%`;

  const selectedAnnotation = annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null;

  const getOverlayPoint = (event: MouseEvent | ReactMouseEvent): OverlayPoint | null => {
    if (!overlayRef.current) {
      return null;
    }

    const bounds = overlayRef.current.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return null;
    }

    return roundPoint({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  };

  const clearDraft = () => {
    setDraftStart(null);
    setDraftCurrent(null);
    setInteractionMode("idle");
  };

  const resetTool = () => {
    clearDraft();
    setActiveTool("none");
  };

  const pushAnnotation = (annotation: ChartAnnotation) => {
    const normalized = normalizeAnnotation(annotation);
    setAnnotations((current) => [...current, normalized]);
    setSelectedAnnotationId(normalized.id);
  };

  const updateAnnotationFromDrag = (currentPoint: OverlayPoint) => {
    if (!dragState) {
      return;
    }

    const { annotationId, mode, origin, snapshot } = dragState;
    const dx = currentPoint.x - origin.x;
    const dy = currentPoint.y - origin.y;

    let nextAnnotation = snapshot;

    if (mode === "moving") {
      const next = {
        ...snapshot,
        x1: snapshot.x1 + dx,
        y1: snapshot.y1 + dy,
        x2: snapshot.x2 + dx,
        y2: snapshot.y2 + dy,
      };

      const minX = Math.min(next.x1, next.x2);
      const maxX = Math.max(next.x1, next.x2);
      const minY = Math.min(next.y1, next.y2);
      const maxY = Math.max(next.y1, next.y2);
      const offsetX = minX < 0 ? -minX : maxX > 1 ? 1 - maxX : 0;
      const offsetY = minY < 0 ? -minY : maxY > 1 ? 1 - maxY : 0;

      nextAnnotation = {
        ...next,
        x1: clamp(next.x1 + offsetX),
        y1: clamp(next.y1 + offsetY),
        x2: clamp(next.x2 + offsetX),
        y2: clamp(next.y2 + offsetY),
      };
    }

    if (mode === "resize-start") {
      nextAnnotation = {
        ...snapshot,
        x1: currentPoint.x,
        y1: currentPoint.y,
      };
    }

    if (mode === "resize-end") {
      nextAnnotation = {
        ...snapshot,
        x2: currentPoint.x,
        y2: currentPoint.y,
      };
    }

    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === annotationId ? normalizeAnnotation(nextAnnotation) : annotation
      )
    );
  };

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const point = getOverlayPoint(event);
      if (!point) {
        return;
      }

      updateAnnotationFromDrag(point);
    };

    const handleMouseUp = () => {
      setDragState(null);
      setInteractionMode("idle");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  const handleOverlayMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const point = getOverlayPoint(event);
    if (!point) {
      return;
    }

    if (activeTool === "none") {
      setSelectedAnnotationId(null);
      setToolsOpen(false);
      return;
    }

    setSelectedAnnotationId(null);
    setInteractionMode("drawing");

    if (activeTool === "horizontal") {
      pushAnnotation({
        id: generateUUID(),
        type: "horizontal",
        x1: 0,
        y1: point.y,
        x2: 1,
        y2: point.y,
      });
      resetTool();
      return;
    }

    if (activeTool === "vertical") {
      pushAnnotation({
        id: generateUUID(),
        type: "vertical",
        x1: point.x,
        y1: 0,
        x2: point.x,
        y2: 1,
      });
      resetTool();
      return;
    }

    setDraftStart(point);
    setDraftCurrent(point);
  };

  const handleOverlayMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "drawing" || !draftStart) {
      return;
    }

    const point = getOverlayPoint(event);
    if (!point) {
      return;
    }

    setDraftCurrent(point);
  };

  const handleOverlayMouseUp = () => {
    if (interactionMode !== "drawing" || !draftStart || !draftCurrent || activeTool === "none") {
      return;
    }

    const distance = Math.abs(draftCurrent.x - draftStart.x) + Math.abs(draftCurrent.y - draftStart.y);
    if (distance < 0.02) {
      clearDraft();
      return;
    }

    pushAnnotation({
      id: generateUUID(),
      type: activeTool,
      x1: draftStart.x,
      y1: draftStart.y,
      x2: draftCurrent.x,
      y2: draftCurrent.y,
    });
    resetTool();
  };

  const beginDrag = (
    event: ReactMouseEvent<SVGElement>,
    annotation: ChartAnnotation,
    mode: Exclude<InteractionMode, "idle" | "drawing">
  ) => {
    event.stopPropagation();
    const point = getOverlayPoint(event);
    if (!point) {
      return;
    }

    setSelectedAnnotationId(annotation.id);
    setDragState({
      annotationId: annotation.id,
      mode,
      origin: point,
      snapshot: { ...annotation },
    });
    setInteractionMode(mode);
  };

  const renderPreview = () => {
    if (!draftStart || !draftCurrent || activeTool === "none") {
      return null;
    }

    const preview: ChartAnnotation = normalizeAnnotation({
      id: "preview",
      type: activeTool,
      x1: draftStart.x,
      y1: draftStart.y,
      x2: draftCurrent.x,
      y2: draftCurrent.y,
    });

    return renderAnnotation(preview, false, true);
  };

  const renderHandle = (
    annotation: ChartAnnotation,
    handle: "start" | "end",
    point: OverlayPoint,
    cursor: string
  ) => (
    <circle
      key={`${annotation.id}-${handle}`}
      cx={projectX(point.x)}
      cy={projectY(point.y)}
      r="4.5"
      fill="#ffffff"
      stroke="#fbbf24"
      strokeWidth="1.5"
      style={{ cursor }}
      onMouseDown={(event) =>
        beginDrag(event, annotation, handle === "start" ? "resize-start" : "resize-end")
      }
    />
  );

  const renderFibonacci = (annotation: ChartAnnotation, isActive: boolean, isPreview: boolean) => {
    const minX = Math.min(annotation.x1, annotation.x2);
    const maxX = Math.max(annotation.x1, annotation.x2);
    const minY = Math.min(annotation.y1, annotation.y2);
    const maxY = Math.max(annotation.y1, annotation.y2);
    const height = maxY - minY;

    return (
      <g
        key={annotation.id}
        opacity={isPreview ? 0.7 : 1}
        onMouseDown={isPreview ? undefined : (event) => beginDrag(event, annotation, "moving")}
        style={{ cursor: isPreview ? "crosshair" : "move" }}
      >
        <rect
          x={projectX(minX)}
          y={projectY(minY)}
          width={`${(maxX - minX) * 100}%`}
          height={`${height * 100}%`}
          fill="rgba(59, 130, 246, 0.08)"
          stroke={isActive ? "#fbbf24" : "#60a5fa"}
          strokeWidth="1.2"
          rx="8"
        />
        {FIB_LEVELS.map((level) => {
          const y = minY + height * level;

          return (
            <g key={`${annotation.id}-${level}`}>
              <line
                x1={projectX(minX)}
                y1={projectY(y)}
                x2={projectX(maxX)}
                y2={projectY(y)}
                stroke={isActive ? "#fbbf24" : "#93c5fd"}
                strokeDasharray={level === 0.5 ? "0" : "4 3"}
                strokeWidth={level === 0.5 ? 1.6 : 1}
              />
              <text
                x={projectX(maxX)}
                y={projectY(y)}
                dx={6}
                dy={-3}
                fill="#cbd5e1"
                fontSize="10"
              >
                {level.toFixed(3)}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const renderAnnotation = (annotation: ChartAnnotation, isActive: boolean, isPreview = false) => {
    const accent = isActive ? "#fbbf24" : "#e2e8f0";
    const previewOpacity = isPreview ? 0.6 : 1;

    if (annotation.type === "horizontal") {
      return (
        <g key={annotation.id} opacity={previewOpacity}>
          <line
            x1="0%"
            y1={projectY(annotation.y1)}
            x2="100%"
            y2={projectY(annotation.y1)}
            stroke={accent}
            strokeWidth={isActive ? 2.2 : 1.6}
            strokeDasharray="6 4"
            onMouseDown={isPreview ? undefined : (event) => beginDrag(event, annotation, "moving")}
            style={{ cursor: isPreview ? "crosshair" : "row-resize" }}
          />
          {isActive &&
            !isPreview &&
            [renderHandle(annotation, "start", { x: 0, y: annotation.y1 }, "row-resize"), renderHandle(annotation, "end", { x: 1, y: annotation.y2 }, "row-resize")]}
        </g>
      );
    }

    if (annotation.type === "vertical") {
      return (
        <g key={annotation.id} opacity={previewOpacity}>
          <line
            x1={projectX(annotation.x1)}
            y1="0%"
            x2={projectX(annotation.x1)}
            y2="100%"
            stroke={isActive ? "#fbbf24" : "#c084fc"}
            strokeWidth={isActive ? 2.2 : 1.6}
            strokeDasharray="6 4"
            onMouseDown={isPreview ? undefined : (event) => beginDrag(event, annotation, "moving")}
            style={{ cursor: isPreview ? "crosshair" : "col-resize" }}
          />
          {isActive &&
            !isPreview &&
            [renderHandle(annotation, "start", { x: annotation.x1, y: 0 }, "col-resize"), renderHandle(annotation, "end", { x: annotation.x2, y: 1 }, "col-resize")]}
        </g>
      );
    }

    if (annotation.type === "zone") {
      const left = Math.min(annotation.x1, annotation.x2);
      const top = Math.min(annotation.y1, annotation.y2);
      const width = Math.abs(annotation.x2 - annotation.x1);
      const height = Math.abs(annotation.y2 - annotation.y1);

      return (
        <g key={annotation.id} opacity={previewOpacity}>
          <rect
            x={projectX(left)}
            y={projectY(top)}
            width={`${width * 100}%`}
            height={`${height * 100}%`}
            fill={isActive ? "rgba(251, 191, 36, 0.18)" : "rgba(110, 231, 183, 0.13)"}
            stroke={isActive ? "#fbbf24" : "#6ee7b7"}
            strokeWidth={isActive ? 2 : 1.4}
            rx="8"
            onMouseDown={isPreview ? undefined : (event) => beginDrag(event, annotation, "moving")}
            style={{ cursor: isPreview ? "crosshair" : "move" }}
          />
          {isActive &&
            !isPreview &&
            [renderHandle(annotation, "start", { x: annotation.x1, y: annotation.y1 }, "nwse-resize"), renderHandle(annotation, "end", { x: annotation.x2, y: annotation.y2 }, "nwse-resize")]}
        </g>
      );
    }

    if (annotation.type === "fibonacci") {
      return (
        <g key={annotation.id}>
          {renderFibonacci(annotation, isActive, isPreview)}
          {isActive &&
            !isPreview &&
            [renderHandle(annotation, "start", { x: annotation.x1, y: annotation.y1 }, "move"), renderHandle(annotation, "end", { x: annotation.x2, y: annotation.y2 }, "move")]}
        </g>
      );
    }

    const stroke = annotation.type === "arrow" ? "#fb7185" : "#38bdf8";

    return (
      <g key={annotation.id} opacity={previewOpacity}>
        <line
          x1={projectX(annotation.x1)}
          y1={projectY(annotation.y1)}
          x2={projectX(annotation.x2)}
          y2={projectY(annotation.y2)}
          stroke={isActive ? "#fbbf24" : stroke}
          strokeWidth={isActive ? 2.8 : 2}
          markerEnd={annotation.type === "arrow" ? "url(#annotationArrowHead)" : undefined}
          onMouseDown={isPreview ? undefined : (event) => beginDrag(event, annotation, "moving")}
          style={{ cursor: isPreview ? "crosshair" : "move" }}
        />
        {isActive &&
          !isPreview &&
          [renderHandle(annotation, "start", { x: annotation.x1, y: annotation.y1 }, "move"), renderHandle(annotation, "end", { x: annotation.x2, y: annotation.y2 }, "move")]}
      </g>
    );
  };

  if (data.length < 2) {
    return (
      <div className="flex h-[460px] w-full items-center justify-center rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700">
          Accumulate more data points for chart analysis
        </p>
      </div>
    );
  }

  const activeToolLabel =
    activeTool === "none" ? "Sin dibujo activo" : DRAWING_TOOL_CATALOG.find((tool) => tool.id === activeTool)?.label;
  const isCandleChart = chartType === "candles";
  const isLineChart = chartType === "line";
  const isAreaChart = chartType === "area";

  return (
    <div className="relative flex flex-col h-[460px] w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/45">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">Analisis tecnico y dibujo</p>
          <p className="mt-2 text-sm text-slate-400">
            Usa dibujos para marcar estructura, zonas y niveles. El panel esta agrupado por tipo para que no sature la vista.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`h-9 rounded-full border-white/10 px-4 ${toolsOpen ? "bg-white/10" : "bg-transparent"}`}
            onClick={() => setToolsOpen((current) => !current)}
          >
            <CandlestickChart className="h-4 w-4" />
            Dibujos
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 rounded-full text-slate-300"
            onClick={() => {
              setAnnotations([]);
              setSelectedAnnotationId(null);
              resetTool();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Limpiar todo
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-white/10 bg-white/[0.03] px-3 py-1 text-slate-200">
          {activeToolLabel}
        </Badge>
        {selectedAnnotation && (
          <Badge variant="outline" className="border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-100">
            Seleccionado: {DRAWING_TOOL_CATALOG.find((tool) => tool.id === selectedAnnotation.type)?.label}
          </Badge>
        )}
        {selectedAnnotation && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-3 text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
            onClick={() => {
              setAnnotations((current) => current.filter((annotation) => annotation.id !== selectedAnnotation.id));
              setSelectedAnnotationId(null);
            }}
          >
            Eliminar dibujo
          </Button>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {toolsOpen && (
          <div className="absolute left-3 top-[48px] z-20 w-[320px] rounded-[1.5rem] border border-white/10 bg-slate-950/96 p-4 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Dibujos</p>
                <p className="mt-1 text-xs text-slate-400">Inspirado en paneles de trading, pero centrado en lo util.</p>
              </div>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setToolsOpen(false)}>
                <Trash2 className="h-3.5 w-3.5 rotate-45" />
              </Button>
            </div>

            <div className="space-y-4">
              {DRAWING_TOOL_SECTIONS.map((section) => (
                <section key={section}>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-500">{section}</p>
                  <div className="space-y-2">
                    {DRAWING_TOOL_CATALOG.filter((tool) => tool.section === section).map((tool) => {
                      const active = activeTool === tool.id;

                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => {
                            clearDraft();
                            setSelectedAnnotationId(null);
                            setActiveTool((current) => (current === tool.id ? "none" : tool.id));
                          }}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-emerald-400/30 bg-emerald-400/10"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full border border-white/10 bg-black/20 p-2 text-slate-200">
                              {getToolIcon(tool.id)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{tool.label}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-400">{tool.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        <div
          ref={overlayRef}
          className={`relative h-full ${activeTool === "none" ? "" : "cursor-crosshair"}`}
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
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
                filterNull
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
                  if (["wickBase", "wickSpan", "bodyBase", "bodySpan", "isBullish"].includes(name)) {
                    return null;
                  }

                  if (["open", "high", "low", "close"].includes(name)) {
                    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
                  }

                  if (name === "volume") {
                    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
                  }

                  if (name === "price") {
                    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
                  }

                  if (["macd", "signal", "histogram", "roc"].includes(name)) {
                    return value.toFixed(4);
                  }

                  return value.toFixed(2);
                }}
              />

              {isAreaChart && showPriceArea && (
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#6ee7b7"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  yAxisId={0}
                />
              )}

              {(isAreaChart || isLineChart) && (
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#6ee7b7"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
                  yAxisId={0}
                />
              )}

              {isCandleChart && (
                <>
                  <Bar dataKey="wickBase" stackId="wick" fill="transparent" yAxisId={0} isAnimationActive={false} />
                  <Bar dataKey="wickSpan" stackId="wick" barSize={4} fill="#94a3b8" yAxisId={0} isAnimationActive={false}>
                    {chartData.map((point, index) => (
                      <Cell key={`wick-${point.date}-${index}`} fill={point.isBullish ? "#34d399" : "#fb7185"} />
                    ))}
                  </Bar>
                  <Bar dataKey="bodyBase" stackId="body" fill="transparent" yAxisId={0} isAnimationActive={false} />
                  <Bar dataKey="bodySpan" stackId="body" barSize={10} radius={[3, 3, 3, 3]} yAxisId={0} isAnimationActive={false}>
                    {chartData.map((point, index) => (
                      <Cell key={`body-${point.date}-${index}`} fill={point.isBullish ? "#34d399" : "#fb7185"} />
                    ))}
                  </Bar>
                </>
              )}

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

                return (
                  <Line
                    key={indicator.id}
                    type="monotone"
                    dataKey={indicator.id}
                    stroke={colorMap[indicator.id] || "#ffffff"}
                    strokeWidth={indicator.id === "rsi" || indicator.id === "roc" ? 1.5 : 2}
                    yAxisId={yAxisId}
                    dot={false}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-[16px_14px_8px_0]">
            <svg className="pointer-events-auto h-full w-full overflow-visible">
              <defs>
                <marker
                  id="annotationArrowHead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L8,4 L0,8 z" fill="#fb7185" />
                </marker>
              </defs>

              {annotations.map((annotation) =>
                renderAnnotation(annotation, annotation.id === selectedAnnotationId)
              )}
              {renderPreview()}
            </svg>
          </div>

          {(activeTool !== "none" || draftStart) && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-white/10 bg-slate-950/90 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
              {draftStart
                ? "Arrastra para completar el dibujo"
                : activeTool === "horizontal"
                  ? "Haz click para marcar un nivel"
                  : activeTool === "vertical"
                    ? "Haz click para marcar una fecha"
                    : "Haz click y arrastra sobre la grafica"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
