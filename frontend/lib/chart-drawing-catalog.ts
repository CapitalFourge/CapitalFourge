export type DrawingTool =
  | "none"
  | "horizontal"
  | "trend"
  | "arrow"
  | "vertical"
  | "zone"
  | "fibonacci"
  | "triangle"
  | "rectangle"
  | "ellipse";

export interface DrawingToolDefinition {
  id: Exclude<DrawingTool, "none">;
  label: string;
  section: "Lineas" | "Niveles" | "Zonas" | "Patrones";
  description: string;
  examples?: string;
}

export const DRAWING_TOOL_CATALOG: DrawingToolDefinition[] = [
  {
    id: "trend",
    label: "Linea de tendencia",
    section: "Lineas",
    description: "Conecta minimos o maximos para mostrar direccion del movimiento.",
    examples: "Tendencia alcista: conectar minimos crecientes. Romper la linea de tendencia = señal de cambio.",
  },
  {
    id: "arrow",
    label: "Flecha",
    section: "Lineas",
    description: "Marca puntos de entrada, salida o rupturas importantes.",
    examples: "Flecha alcista arriba de resistencia rota = entrada. Flecha de alerta en soporte clave.",
  },
  {
    id: "vertical",
    label: "Linea vertical",
    section: "Lineas",
    description: "Senala una fecha o vela clave (aniversarios, eventos).",
    examples: "Marcar earnings, split, o fecha de ruptura importante.",
  },
  {
    id: "horizontal",
    label: "Soporte / resistencia",
    section: "Niveles",
    description: "Horizontales que marcan precios donde el mercado reacciona.",
    examples: "Resistencia: precio no logra superar. Soporte: precio rebota o se detiene. Entrar cerca de soporte.",
  },
  {
    id: "fibonacci",
    label: "Retrocesos Fibonacci",
    section: "Niveles",
    description: "Niveles de 23.6%, 38.2%, 50%, 61.8% para proyectar entrada.",
    examples: "Fibo en tendencia alcista: buscar entrada en 61.8% o 38.2%. Extension 161.8% para objetivo.",
  },
  {
    id: "zone",
    label: "Zona",
    section: "Zonas",
    description: "Area rectangular para marcar soportes/resistencias o consolidaciones.",
    examples: "Zona de acumulacion: precios comprando tranquilos. Zona de salida: ruptura fuerte.",
  },
  {
    id: "triangle",
    label: "Triangulo",
    section: "Patrones",
    description: "Formacion con líneas que converge. Señala continuacion o ruptura.",
    examples: "Triangulo simetrico = continuacion. Romper arriba = objetivo alto. Volumen decrece en consolidacion.",
  },
  {
    id: "rectangle",
    label: "Rectangulo",
    section: "Patrones",
    description: "Canal vertical horizontal. Rango lateral con limites claros.",
    examples: "Acciones en rango lateral. Compra en fondo del rectangulo, venta en techo. Breakout fuerte.",
  },
  {
    id: "ellipse",
    label: "Elipse",
    section: "Patrones",
    description: "Marcar consolidacion o patron de continuation como cup-handle.",
    examples: "Elipse pequeña = acumulacion silenciosa. Salida fuerte significa movimiento inminente.",
  },
];

export const DRAWING_TOOL_SECTIONS = ["Lineas", "Niveles", "Zonas", "Patrones"] as const;
