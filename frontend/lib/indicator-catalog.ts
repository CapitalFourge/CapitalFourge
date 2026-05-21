export interface IndicatorDefinition {
  id: string;
  label: string;
  category: "Tendencia" | "Momentum" | "Volatilidad" | "Volumen";
  shortDescription: string;
  usage: string;
}

export const INDICATOR_CATALOG: IndicatorDefinition[] = [
  {
    id: "sma",
    label: "SMA",
    category: "Tendencia",
    shortDescription: "Promedio simple del precio en una ventana fija.",
    usage: "Sirve para filtrar ruido y detectar la direccion base de la tendencia.",
  },
  {
    id: "ema",
    label: "EMA",
    category: "Tendencia",
    shortDescription: "Media movil que da mas peso a los precios recientes.",
    usage: "Reacciona antes que la SMA y ayuda a seguir cambios de sesgo con mas rapidez.",
  },
  {
    id: "wma",
    label: "WMA",
    category: "Tendencia",
    shortDescription: "Media movil ponderada con enfasis gradual en datos recientes.",
    usage: "Es util cuando quieres una lectura intermedia entre SMA y EMA.",
  },
  {
    id: "rsi",
    label: "RSI",
    category: "Momentum",
    shortDescription: "Oscilador que mide la fuerza relativa de las subidas y bajadas.",
    usage: "Ayuda a detectar sobrecompra, sobreventa y divergencias de momentum.",
  },
  {
    id: "macd",
    label: "MACD",
    category: "Momentum",
    shortDescription: "Compara dos medias y su señal para medir aceleracion del precio.",
    usage: "Es popular para confirmar cruces de tendencia y cambios de impulso.",
  },
  {
    id: "stochastic",
    label: "Stochastic",
    category: "Momentum",
    shortDescription: "Compara el cierre actual con el rango reciente del activo.",
    usage: "Se usa para ubicar extremos de corto plazo y posibles giros tacticos.",
  },
  {
    id: "roc",
    label: "ROC",
    category: "Momentum",
    shortDescription: "Rate of Change que expresa la variacion porcentual del precio.",
    usage: "Funciona bien para ver si el impulso gana o pierde velocidad.",
  },
  {
    id: "bollinger",
    label: "Bollinger",
    category: "Volatilidad",
    shortDescription: "Bandas dinamicas alrededor de una media basadas en desviacion estandar.",
    usage: "Sirven para medir expansion o compresion de volatilidad y zonas de estres.",
  },
  {
    id: "obv",
    label: "OBV",
    category: "Volumen",
    shortDescription: "On-Balance Volume que acumula flujo segun direccion del precio.",
    usage: "Ayuda a validar si el movimiento tiene acompanamiento real de participacion.",
  },
];

export const INDICATOR_CATEGORIES = ["Tendencia", "Momentum", "Volatilidad", "Volumen"] as const;
