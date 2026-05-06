import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

/**
 * Calculate Simple Moving Average
 * @param {Array<Object>} data - Array of { date: string, close: number }
 * @param {number} period - The period for SMA
 * @returns {Array<Object>} Array of { date: string, sma: number }
 */
export function calculateSMA(data, period) {
  if (!data || data.length < period) return [];
  
  const closes = data.map(d => d.close);
  const smaValues = SMA.calculate({ period, values: closes });
  
  // Align the SMA values with the dates (the first period-1 values are undefined)
  return data.slice(period - 1).map((d, i) => ({
    date: d.date,
    sma: smaValues[i]
  }));
}

/**
 * Calculate Exponential Moving Average
 * @param {Array<Object>} data - Array of { date: string, close: number }
 * @param {number} period - The period for EMA
 * @returns {Array<Object>} Array of { date: string, ema: number }
 */
export function calculateEMA(data, period) {
  if (!data || data.length < period) return [];
  
  const closes = data.map(d => d.close);
  const emaValues = EMA.calculate({ period, values: closes });
  
  // Align the EMA values with the dates
  return data.slice(period - 1).map((d, i) => ({
    date: d.date,
    ema: emaValues[i]
  }));
}

/**
 * Calculate Relative Strength Index
 * @param {Array<Object>} data - Array of { date: string, close: number }
 * @param {number} period - The period for RSI (default 14)
 * @returns {Array<Object>} Array of { date: string, rsi: number }
 */
export function calculateRSI(data, period = 14) {
  if (!data || data.length < period + 1) return [];
  
  const closes = data.map(d => d.close);
  const rsiValues = RSI.calculate({ period, values: closes });
  
  // Align the RSI values with the dates (the first period values are undefined)
  return data.slice(period).map((d, i) => ({
    date: d.date,
    rsi: rsiValues[i]
  }));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array<Object>} data - Array of { date: string, close: number }
 * @param {Object} options - { fast: 12, slow: 26, signal: 9 }
 * @returns {Array<Object>} Array of { date: string, macd: number, signal: number, histogram: number }
 */
export function calculateMACD(data, options = { fast: 12, slow: 26, signal: 9 }) {
  if (!data || data.length < options.slow) return [];
  
  const closes = data.map(d => d.close);
  const macdValues = MACD.calculate({ 
    fastPeriod: options.fast, 
    slowPeriod: options.slow, 
    signalPeriod: options.signal, 
    values: closes 
  });
  
  // Align the MACD values with the dates (the first slow-1 values are undefined)
  return data.slice(options.slow - 1).map((d, i) => ({
    date: d.date,
    macd: macdValues[i].MACD,
    signal: macdValues[i].signal,
    histogram: macdValues[i].histogram
  }));
}

/**
 * Calculate Bollinger Bands
 * @param {Array<Object>} data - Array of { date: string, close: number }
 * @param {Object} options - { period: 20, stdDev: 2 }
 * @returns {Array<Object>} Array of { date: string, upper: number, middle: number, lower: number }
 */
export function calculateBollingerBands(data, options = { period: 20, stdDev: 2 }) {
  if (!data || data.length < options.period) return [];
  
  const closes = data.map(d => d.close);
  const bbValues = BollingerBands.calculate({ 
    period: options.period, 
    stdDev: options.stdDev, 
    values: closes 
  });
  
  // Align the Bollinger Bands values with the dates
  return data.slice(options.period - 1).map((d, i) => ({
    date: d.date,
    upper: bbValues[i].upper,
    middle: bbValues[i].middle,
    lower: bbValues[i].lower
  }));
}