import { BollingerBands, EMA, MACD, OBV, ROC, RSI, SMA, Stochastic, WMA } from "technicalindicators";

interface BasePricePoint {
  date: string;
  close: number;
}

interface StochasticPricePoint extends BasePricePoint {
  high: number;
  low: number;
}

interface VolumePricePoint extends BasePricePoint {
  volume: number;
}

interface MACDOptions {
  fast: number;
  slow: number;
  signal: number;
}

interface BollingerOptions {
  period: number;
  stdDev: number;
}

interface StochasticOptions {
  k: number;
  d: number;
  smoothing: number;
}

export function calculateSMA(data: BasePricePoint[], period: number) {
  if (!data || data.length < period) return [];

  const closes = data.map((point) => point.close);
  const smaValues = SMA.calculate({ period, values: closes });

  return data.slice(period - 1).map((point, index) => ({
    date: point.date,
    sma: smaValues[index],
  }));
}

export function calculateEMA(data: BasePricePoint[], period: number) {
  if (!data || data.length < period) return [];

  const closes = data.map((point) => point.close);
  const emaValues = EMA.calculate({ period, values: closes });

  return data.slice(period - 1).map((point, index) => ({
    date: point.date,
    ema: emaValues[index],
  }));
}

export function calculateWMA(data: BasePricePoint[], period: number) {
  if (!data || data.length < period) return [];

  const closes = data.map((point) => point.close);
  const wmaValues = WMA.calculate({ period, values: closes });

  return data.slice(period - 1).map((point, index) => ({
    date: point.date,
    wma: wmaValues[index],
  }));
}

export function calculateRSI(data: BasePricePoint[], period = 14) {
  if (!data || data.length < period + 1) return [];

  const closes = data.map((point) => point.close);
  const rsiValues = RSI.calculate({ period, values: closes });

  return data.slice(period).map((point, index) => ({
    date: point.date,
    rsi: rsiValues[index],
  }));
}

export function calculateMACD(
  data: BasePricePoint[],
  options: MACDOptions = { fast: 12, slow: 26, signal: 9 },
) {
  if (!data || data.length < options.slow) return [];

  const closes = data.map((point) => point.close);
  const macdValues = MACD.calculate({
    fastPeriod: options.fast,
    slowPeriod: options.slow,
    signalPeriod: options.signal,
    values: closes,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  return data.slice(options.slow - 1).map((point, index) => ({
    date: point.date,
    macd: macdValues[index]?.MACD ?? 0,
    signal: macdValues[index]?.signal ?? 0,
    histogram: macdValues[index]?.histogram ?? 0,
  }));
}

export function calculateBollingerBands(
  data: BasePricePoint[],
  options: BollingerOptions = { period: 20, stdDev: 2 },
) {
  if (!data || data.length < options.period) return [];

  const closes = data.map((point) => point.close);
  const bandValues = BollingerBands.calculate({
    period: options.period,
    stdDev: options.stdDev,
    values: closes,
  });

  return data.slice(options.period - 1).map((point, index) => ({
    date: point.date,
    upper: bandValues[index]?.upper ?? 0,
    middle: bandValues[index]?.middle ?? 0,
    lower: bandValues[index]?.lower ?? 0,
  }));
}

export function calculateStochastic(
  data: Array<BasePricePoint | StochasticPricePoint>,
  options: StochasticOptions = { k: 14, d: 3, smoothing: 3 },
) {
  if (!data || data.length < options.k) return [];

  const highs = data.map((point) => ("high" in point ? point.high : point.close));
  const lows = data.map((point) => ("low" in point ? point.low : point.close));
  const closes = data.map((point) => point.close);

  const stochasticValues = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: options.k,
    signalPeriod: options.d,
  });

  return data.slice(options.k - 1).map((point, index) => ({
    date: point.date,
    k: stochasticValues[index]?.k ?? 0,
    d: stochasticValues[index]?.d ?? 0,
  }));
}

export function calculateOBV(data: VolumePricePoint[]) {
  if (!data || data.length === 0) return [];

  const closes = data.map((point) => point.close);
  const volumes = data.map((point) => point.volume);
  const obvValues = OBV.calculate({
    close: closes,
    volume: volumes,
  });

  return data.map((point, index) => ({
    date: point.date,
    obv: obvValues[index] ?? 0,
  }));
}

export function calculateROC(data: BasePricePoint[], period = 12) {
  if (!data || data.length < period + 1) return [];

  const closes = data.map((point) => point.close);
  const rocValues = ROC.calculate({
    period,
    values: closes,
  });

  return data.slice(period).map((point, index) => ({
    date: point.date,
    roc: rocValues[index] ?? 0,
  }));
}
