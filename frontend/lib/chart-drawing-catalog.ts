export type DrawingTool =
  | "none"
  | "horizontal"
  | "trend"
  | "arrow"
  | "vertical"
  | "zone"
  | "fibonacci";

export interface DrawingToolDefinition {
  id: Exclude<DrawingTool, "none">;
  label: string;
  section: "Lineas" | "Niveles" | "Zonas";
  description: string;
}

export const DRAWING_TOOL_CATALOG: DrawingToolDefinition[] = [
  {
    id: "trend",
    label: "Linea de tendencia",
    section: "Lineas",
    description: "Traza direccion y pendiente del movimiento principal.",
  },
  {
    id: "arrow",
    label: "Flecha",
    section: "Lineas",
    description: "Marca una ruptura, rechazo o punto de interes puntual.",
  },
  {
    id: "vertical",
    label: "Linea vertical",
    section: "Lineas",
    description: "Senala una fecha o vela clave dentro del grafico.",
  },
  {
    id: "horizontal",
    label: "Soporte / resistencia",
    section: "Niveles",
    description: "Marca un precio relevante para reaccion del mercado.",
  },
  {
    id: "fibonacci",
    label: "Retrocesos Fibonacci",
    section: "Niveles",
    description: "Divide un tramo en niveles tecnicos de retroceso.",
  },
  {
    id: "zone",
    label: "Zona",
    section: "Zonas",
    description: "Destaca un area de oferta, demanda o consolidacion.",
  },
];

export const DRAWING_TOOL_SECTIONS = ["Lineas", "Niveles", "Zonas"] as const;
