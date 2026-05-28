export interface IndicatorDefinition {
  id: string;
  label: string;
  category: "Tendencia" | "Momentum" | "Volatilidad" | "Volumen";
  shortDescription: string;
  usage: string;
  examples: string;
}

export const INDICATOR_CATALOG: IndicatorDefinition[] = [
  {
    id: "sma",
    label: "SMA",
    category: "Tendencia",
    shortDescription: "Media Movil Simple: promedio aritmetico de precios en una ventana de tiempo fija.",
    usage: "Ideal para identificar la direccion principal de la tendencia filtrando el ruido del mercado.",
    examples: "SMA 9 en acciones: cruces alcista cuando el precio corta la SMA de forma bullish. SMA 200 en crypto: tendencia macro de bull/bear market. Combina SMA 9 y SMA 24 para señal precoz de cambio de tendencia.",
  },
  {
    id: "ema",
    label: "EMA",
    category: "Tendencia",
    shortDescription: "Media Movil Exponencial: da mayor peso a los precios mas recientes que la SMA.",
    usage: "Reacciona mas rapido ante cambios, util para seguir tendencias en activos volatiles.",
    examples: "EMA 9 en forex: reaccion inmediata a rupturas. Usar EMA 21 como soporte/resistencia dinamico. Cruce EMA 9 sobre EMA 21 = señal alcista temprana.",
  },
  {
    id: "wma",
    label: "WMA",
    category: "Tendencia",
    shortDescription: "Media Movil Ponderada: pondera precios recientes con pesos crecientes.",
    usage: "Compromiso entre SMA (lento) y EMA (rapido), filtra ruido sin sobre-reaccionar.",
    examples: "WMA 10: respuesta media en metales. WMA 15 + WMA 30 para confirmar tendencias de medio plazo.",
  },
  {
    id: "rsi",
    label: "RSI",
    category: "Momentum",
    shortDescription: "Relative Strength Index: oscilador de 0-100 que mide fuerza relativa del precio.",
    usage: "Identifica sobrecompra (>70), sobreventa (<30) y divergencias con el precio.",
    examples: "RSI < 30 + precio en soporte = entrada bullish. RSI > 70 + doji bearish = señal de toma de ganancias. Divergencia alcista: RSI sube mientras el precio baja.",
  },
  {
    id: "macd",
    label: "MACD",
    category: "Momentum",
    shortDescription: "Moving Average Convergence Divergence: cruza medias para medir aceleracion del precio.",
    usage: "Cruces de la linea MACD con la señal generan entradas; histograma confirma fuerza.",
    examples: "Cruce MACD por encima de la señal = impulso alcista. Histograma disminuyendo = debilidad momentum. Usar en indices como SPY para seguimiento macro.",
  },
  {
    id: "stochastic",
    label: "Stochastic",
    category: "Momentum",
    shortDescription: "Oscilador que compara el cierre actual con el rango de precios reciente.",
    usage: "Senaliza condiciones extrema de mercado y giros a corto plazo.",
    examples: "Stoch < 20 + cruces alcistas = entrada en sobreventa. Stoch > 80 + cruces bajistas = toma de ganancias. Ideal para operar en timeframes de 1H o menor.",
  },
  {
    id: "roc",
    label: "ROC",
    category: "Momentum",
    shortDescription: "Rate of Change: mide la variacion porcentual del precio en N periodos.",
    usage: "Detecta cambios de momentum antes de que se reflejen en el precio.",
    examples: "ROC 10 > 5% = fuerte impulso alcista. ROC negativo en resistancia = divergencia. Usar ROC 25 para tendencias de 25 sesiones.",
  },
  {
    id: "bollinger",
    label: "Bollinger",
    category: "Volatilidad",
    shortDescription: "Bandas basadas en desviacion estandar que miden volatilidad relativa.",
    usage: "Expansion de bandas = mayor volatilidad; compresion = proximo movimiento fuerte.",
    examples: "Precio apoya Banda inferior + RSI < 30 = entrada en oversold. Bandas estrechas + ruptura = movimiento fuerte esperado. Usar Banderas 20, 2 desviaciones.",
  },
  {
    id: "obv",
    label: "OBV",
    category: "Volumen",
    shortDescription: "On-Balance Volume: acumula volumen segun la direccion del precio.",
    usage: "Confirma tendencias con flujo real de dinero; divergencias anticipan cambios.",
    examples: "OBV en alza con precio = tendencia fuerte. Divergencia bajista en OBV = señal de cambio. Ideal para confirmar rompimientos.",
  },
];

export const INDICATOR_CATEGORIES = ["Tendencia", "Momentum", "Volatilidad", "Volumen"] as const;
