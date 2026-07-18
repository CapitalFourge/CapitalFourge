'use client';

import { useMemo } from 'react';
import { FundamentalPricePoint } from '@/lib/types/fundamental-price-point';

interface IndicatorValues {
  [key: string]: number | null;
}

interface UseIndicatorsProps {
  priceHistory: FundamentalPricePoint[];
  activeIndicators: string[];
}

export function useIndicators({ priceHistory, activeIndicators }: UseIndicatorsProps) {
  const closeData = useMemo(
    () => priceHistory.filter((p) => typeof p.close === 'number'),
    [priceHistory]
  );

  const indicatorValues = useMemo(() => {
    const values: Record<string, number | null> = {};

    if (closeData.length === 0) {
      return values;
    }

    const calculateSMA = (data: FundamentalPricePoint[], period: number): number | null => {
      if (data.length < period) return null;
      const sum = data.slice(-period).reduce((acc, point) => acc + point.close, 0);
      return sum / period;
    };

    const calculateEMA = (data: FundamentalPricePoint[], period: number): number | null => {
      if (data.length < period) return null;
      const multiplier = 2 / (period + 1);
      let ema = data.slice(0, period).reduce((sum, point) => sum + point.close, 0) / period;
      for (let i = period; i < data.length; i++) {
        ema = (data[i].close - ema) * multiplier + ema;
      }
      return ema;
    };

    const calculateRSI = (data: FundamentalPricePoint[], period: number = 14): number | null => {
      if (data.length < period + 1) return null;

      let gains = 0;
      let losses = 0;

      for (let i = 1; i <= period; i++) {
        const change = data[data.length - i].close - data[data.length - i - 1].close;
        if (change >= 0) {
          gains += change;
        } else {
          losses += Math.abs(change);
        }
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;

      for (let i = period + 1; i < data.length; i++) {
        const change = data[data.length - i].close - data[data.length - i - 1].close;
        const gain = Math.max(change, 0);
        const loss = Math.max(-change, 0);
        avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
      }

      if (avgLoss === 0) return 100;

      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };

    const values: Record<string, number | null> = {};

    activeIndicators.forEach((indicatorId) => {
      switch (indicatorId) {
        case 'sma':
          values[indicatorId] = closeData.length >= 9 ? calculateSMA(closeData, 9) : null;
          break;
        case 'ema':
          values[indicatorId] = closeData.length >= 9 ? calculateEMA(closeData, 9) : null;
          break;
        case 'rsi':
          values[indicatorId] = closeData.length >= 15 ? calculateRSI(closeData, 14) : null;
          break;
        case 'wma':
          values[indicatorId] = closeData.length >= 9 ? calculateSMA(closeData, 9) : null;
          break;
        case 'roc':
          if (closeData.length >= 10) {
            const current = closeData[closeData.length - 1].close;
            const past = closeData[closeData.length - 10].close;
            values['roc'] = ((current - past) / past) * 100;
          }
          break;
      }
    });

    return values;
  }, [closeData, activeIndicators]);

  return indicatorValues;
}