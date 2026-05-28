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
    shortDescription: "Media Movil Simple: promedio de precios recientes para ver la dirección.",
    usage: "Ideal para identificar la direccion principal de la tendencia filtrando el ruido del mercado.",
    examples: "Ejemplo: Si el precio de una acción cruza hacia arriba la SMA, puede ser señal de compra. SMA 200 en crypto muestra la tendencia a largo plazo. Combina SMA 9 y SMA 24 para señales mas tempranas.",
  },
  {
    id: "ema",
    label: "EMA",
    category: "Tendencia",
    shortDescription: "Media Movil Exponencial: da mayor peso a los precios mas recientes.",
    usage: "Reacciona mas rapido ante cambios, util para seguir tendencias en activos volatiles.",
    examples: "Ejemplo: EMA 9 en forex sigue de cerca cada movimiento. Usar EMA 21 como soporte dinamico. Cuando EMA 9 cruza arriba de EMA 21, señal alcista temprana.",
  },
  {
    id: "wma",
    label: "WMA",
    category: "Tendencia",
    shortDescription: "Media Movil Ponderada: pondera precios recientes con mas importancia.",
    usage: "Compromiso entre SMA (lento) y EMA (rapido), filtra ruido sin sobre-reaccionar.",
    examples: "Ejemplo: WMA 10 es un punto intermedio. WMA 15 + WMA 30 confirma tendencias de medio plazo. Reacciona mas rapido que SMA pero mas lento que EMA.",
  },
  {
    id: "rsi",
    label: "RSI",
    category: "Momentum",
    shortDescription: "Relative Strength Index: mide fuerza del precio del 0 al 100.",
    usage: "Valores altos = sobrecompra, valores bajos = sobreventa. Identifica señales de compra/venta.",
    examples: "Ejemplo: RSI bajo (ej. 25) + precio en soporte = posible compra. RSI alto (ej. 80) = considerar toma de ganancias. Divergencia: RSI sube pero precio baja, alerta de cambio.",
  },
  {
    id: "macd",
    label: "MACD",
    category: "Momentum",
    shortDescription: "Indicador con dos medias moviles: cruces generan señales de entrada.",
    usage: "El histograma confirma fuerza del movimiento. Cruces con la linea de señal son entradas.",
    examples: "Ejemplo: MACD arriba de la señal = impulso alcista. Histograma encogiendose = debilidad. Ideal para seguir indices como SPY.",
  },
  {
    id: "stochastic",
    label: "Stochastic",
    category: "Momentum",
    shortDescription: "Compara el cierre actual con el rango de precios reciente.",
    usage: "Senaliza condiciones extremas. Valores bajos = posible compra, altos = posible venta.",
    examples: "Ejemplo: Stochastic bajo + cruces alcistas = entrada en zona sobrevendido. Stochastic alto + cruces bajistas = toma de ganancias. Ideal en graficos de 1 hora.",
  },
  {
    id: "roc",
    label: "ROC",
    category: "Momentum",
    shortDescription: "Rate of Change: mide la variacion porcentual del precio.",
    usage: "Detecta cambios de momentum antes de que se reflejen en el precio.",
    examples: "Ejemplo: ROC positivo fuerte (ej. 15%) = impulso alcista. ROC negativo en resistencia = divergencia. ROC 25 muestra tendencia de 25 sesiones.",
  },
  {
    id: "bollinger",
    label: "Bollinger",
    category: "Volatilidad",
    shortDescription: "Bandas alrededor del precio basadas en desviacion estandar.",
    usage: "Bandas estrechas = proximo movimiento fuerte. Expansion = mayor volatilidad.",
    examples: "Ejemplo: Precio toca banda inferior + RSI bajo = entrada en sobreventa. Bandas muy separadas = volatilidad alta. Usar bandas de 20 periodos.",
  },
  {
    id: "obv",
    label: "OBV",
    category: "Volumen",
    shortDescription: "On-Balance Volume: acumula volumen segun direccion del precio.",
    usage: "Confirma tendencias con flujo real de dinero. Divergencias anticipan cambios.",
    examples: "Ejemplo: OBV en alza con precio = tendencia fuerte. Divergencia: OBV baja pero precio sube, alerta. Ideal para confirmar rompimientos.",
  },
];

export const INDICATOR_CATEGORIES = ["Tendencia", "Momentum", "Volatilidad", "Volumen"] as const;
