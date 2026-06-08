package com.capitalfourge.portfoliomanager.application.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.capitalfourge.portfoliomanager.infrastructure.grpc.GrpcFinancialDataClient;

@Service
public class TechnicalAnalysisService {

    private final GrpcFinancialDataClient grpcClient;

    public TechnicalAnalysisService(GrpcFinancialDataClient grpcClient) {
        this.grpcClient = grpcClient;
    }

    public List<IndicatorSeries> getIndicators(String symbol, int days) {
        List<HistoricalPoint> history = grpcClient.getPriceHistory(symbol, days).stream()
                .filter(point -> point.getClose() > 0 && point.getDate() != null && !point.getDate().isBlank())
                .map(point -> new HistoricalPoint(point.getDate(), point.getClose()))
                .toList();

        if (history.size() < 2) {
            return List.of();
        }

        return List.of(
                new IndicatorSeries("sma", "line", calculateSma(history, 20)),
                new IndicatorSeries("ema", "line", calculateEma(history, 20)),
                new IndicatorSeries("wma", "line", calculateWma(history, 20)),
                new IndicatorSeries("rsi", "line", calculateRsi(history, 14)),
                new IndicatorSeries("macd", "line", calculateMacd(history, 12, 26, 9)),
                new IndicatorSeries("bollinger", "line", calculateBollinger(history, 20, 2.0)),
                new IndicatorSeries("stochastic", "line", calculateStochastic(history, 14, 3)),
                new IndicatorSeries("roc", "line", calculateRoc(history, 12)),
                new IndicatorSeries("obv", "line", calculateObv(history)));
    }

    private List<IndicatorPoint> calculateSma(List<HistoricalPoint> history, int period) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < period) {
            return result;
        }

        for (int index = period - 1; index < history.size(); index++) {
            double sum = 0;
            for (int offset = index - period + 1; offset <= index; offset++) {
                sum += history.get(offset).close();
            }
            result.add(IndicatorPoint.value(history.get(index).date(), sum / period));
        }

        return result;
    }

    private List<IndicatorPoint> calculateEma(List<HistoricalPoint> history, int period) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < period) {
            return result;
        }

        double multiplier = 2.0 / (period + 1);
        double ema = averageClose(history, 0, period);
        result.add(IndicatorPoint.value(history.get(period - 1).date(), ema));

        for (int index = period; index < history.size(); index++) {
            ema = ((history.get(index).close() - ema) * multiplier) + ema;
            result.add(IndicatorPoint.value(history.get(index).date(), ema));
        }

        return result;
    }

    private List<IndicatorPoint> calculateWma(List<HistoricalPoint> history, int period) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < period) {
            return result;
        }

        int weightSum = period * (period + 1) / 2;
        for (int index = period - 1; index < history.size(); index++) {
            double weightedTotal = 0;
            int weight = 1;
            for (int offset = index - period + 1; offset <= index; offset++) {
                weightedTotal += history.get(offset).close() * weight;
                weight++;
            }
            result.add(IndicatorPoint.value(history.get(index).date(), weightedTotal / weightSum));
        }

        return result;
    }

    private List<IndicatorPoint> calculateRsi(List<HistoricalPoint> history, int period) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() <= period) {
            return result;
        }

        double gainSum = 0;
        double lossSum = 0;
        for (int index = 1; index <= period; index++) {
            double change = history.get(index).close() - history.get(index - 1).close();
            if (change >= 0) {
                gainSum += change;
            } else {
                lossSum += -change;
            }
        }

        double averageGain = gainSum / period;
        double averageLoss = lossSum / period;
        result.add(IndicatorPoint.value(history.get(period).date(), toRsi(averageGain, averageLoss)));

        for (int index = period + 1; index < history.size(); index++) {
            double change = history.get(index).close() - history.get(index - 1).close();
            double gain = Math.max(change, 0);
            double loss = Math.max(-change, 0);
            averageGain = ((averageGain * (period - 1)) + gain) / period;
            averageLoss = ((averageLoss * (period - 1)) + loss) / period;
            result.add(IndicatorPoint.value(history.get(index).date(), toRsi(averageGain, averageLoss)));
        }

        return result;
    }

    private List<IndicatorPoint> calculateMacd(List<HistoricalPoint> history, int fastPeriod, int slowPeriod, int signalPeriod) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < slowPeriod + signalPeriod - 1) {
            return result;
        }

        List<Double> fastEma = calculateEmaValues(history, fastPeriod);
        List<Double> slowEma = calculateEmaValues(history, slowPeriod);
        List<Double> macdValues = new ArrayList<>();
        List<String> macdDates = new ArrayList<>();

        for (int index = 0; index < history.size(); index++) {
            Double fast = fastEma.get(index);
            Double slow = slowEma.get(index);
            if (fast != null && slow != null) {
                macdValues.add(fast - slow);
                macdDates.add(history.get(index).date());
            }
        }

        if (macdValues.size() < signalPeriod) {
            return result;
        }

        List<Double> signalValues = calculateEmaForSeries(macdValues, signalPeriod);
        for (int index = 0; index < macdValues.size(); index++) {
            Double signal = signalValues.get(index);
            if (signal != null) {
                double macd = macdValues.get(index);
                result.add(IndicatorPoint.macd(macdDates.get(index), macd, signal, macd - signal));
            }
        }

        return result;
    }

    private List<IndicatorPoint> calculateBollinger(List<HistoricalPoint> history, int period, double stdDevMultiplier) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < period) {
            return result;
        }

        for (int index = period - 1; index < history.size(); index++) {
            double mean = averageClose(history, index - period + 1, period);
            double variance = 0;
            for (int offset = index - period + 1; offset <= index; offset++) {
                double delta = history.get(offset).close() - mean;
                variance += delta * delta;
            }
            double standardDeviation = Math.sqrt(variance / period);
            result.add(IndicatorPoint.bollinger(
                    history.get(index).date(),
                    mean + (standardDeviation * stdDevMultiplier),
                    mean,
                    mean - (standardDeviation * stdDevMultiplier)));
        }

        return result;
    }

    private List<IndicatorPoint> calculateStochastic(List<HistoricalPoint> history, int period, int signalPeriod) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() < period) {
            return result;
        }

        List<Double> kValues = new ArrayList<>();
        List<String> dates = new ArrayList<>();

        for (int index = period - 1; index < history.size(); index++) {
            double highestHigh = Double.NEGATIVE_INFINITY;
            double lowestLow = Double.POSITIVE_INFINITY;
            for (int offset = index - period + 1; offset <= index; offset++) {
                double close = history.get(offset).close();
                highestHigh = Math.max(highestHigh, close);
                lowestLow = Math.min(lowestLow, close);
            }

            double denominator = highestHigh - lowestLow;
            double k = denominator == 0 ? 50.0 : ((history.get(index).close() - lowestLow) / denominator) * 100.0;
            kValues.add(k);
            dates.add(history.get(index).date());
        }

        for (int index = 0; index < kValues.size(); index++) {
            if (index + 1 < signalPeriod) {
                continue;
            }

            double d = 0;
            for (int offset = index - signalPeriod + 1; offset <= index; offset++) {
                d += kValues.get(offset);
            }
            result.add(IndicatorPoint.stochastic(dates.get(index), kValues.get(index), d / signalPeriod));
        }

        return result;
    }

    private List<IndicatorPoint> calculateRoc(List<HistoricalPoint> history, int period) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.size() <= period) {
            return result;
        }

        for (int index = period; index < history.size(); index++) {
            double previousClose = history.get(index - period).close();
            if (previousClose == 0) {
                continue;
            }
            double roc = ((history.get(index).close() - previousClose) / previousClose) * 100.0;
            result.add(IndicatorPoint.value(history.get(index).date(), roc));
        }

        return result;
    }

    private List<IndicatorPoint> calculateObv(List<HistoricalPoint> history) {
        List<IndicatorPoint> result = new ArrayList<>();
        if (history.isEmpty()) {
            return result;
        }

        double obv = 0;
        result.add(IndicatorPoint.value(history.get(0).date(), obv));

        for (int index = 1; index < history.size(); index++) {
            double previousClose = history.get(index - 1).close();
            double currentClose = history.get(index).close();
            if (currentClose > previousClose) {
                obv += 1;
            } else if (currentClose < previousClose) {
                obv -= 1;
            }

            result.add(IndicatorPoint.value(history.get(index).date(), obv));
        }

        return result;
    }

    private List<Double> calculateEmaValues(List<HistoricalPoint> history, int period) {
        List<Double> emaValues = new ArrayList<>();
        for (int index = 0; index < history.size(); index++) {
            emaValues.add(null);
        }

        if (history.size() < period) {
            return emaValues;
        }

        double multiplier = 2.0 / (period + 1);
        double ema = averageClose(history, 0, period);
        emaValues.set(period - 1, ema);

        for (int index = period; index < history.size(); index++) {
            ema = ((history.get(index).close() - ema) * multiplier) + ema;
            emaValues.set(index, ema);
        }

        return emaValues;
    }

    private List<Double> calculateEmaForSeries(List<Double> values, int period) {
        List<Double> emaValues = new ArrayList<>();
        for (int index = 0; index < values.size(); index++) {
            emaValues.add(null);
        }

        if (values.size() < period) {
            return emaValues;
        }

        double multiplier = 2.0 / (period + 1);
        double ema = values.subList(0, period).stream().mapToDouble(Double::doubleValue).average().orElse(0);
        emaValues.set(period - 1, ema);

        for (int index = period; index < values.size(); index++) {
            ema = ((values.get(index) - ema) * multiplier) + ema;
            emaValues.set(index, ema);
        }

        return emaValues;
    }

    private double averageClose(List<HistoricalPoint> history, int startInclusive, int length) {
        double sum = 0;
        for (int index = startInclusive; index < startInclusive + length; index++) {
            sum += history.get(index).close();
        }
        return sum / length;
    }

    private double toRsi(double averageGain, double averageLoss) {
        if (averageLoss == 0) {
            return 100.0;
        }

        double relativeStrength = averageGain / averageLoss;
        return 100.0 - (100.0 / (1.0 + relativeStrength));
    }

    private record HistoricalPoint(String date, double close) {
    }

    public static final class IndicatorSeries {
        private final String id;
        private final String type;
        private final List<IndicatorPoint> points;

        public IndicatorSeries(String id, String type, List<IndicatorPoint> points) {
            this.id = id;
            this.type = type;
            this.points = List.copyOf(points);
        }

        public String getId() {
            return id;
        }

        public String getType() {
            return type;
        }

        public List<IndicatorPoint> getPoints() {
            return points;
        }
    }

    public static final class IndicatorPoint {
        private final String date;
        private final Double value;
        private final Double signal;
        private final Double histogram;
        private final Double upper;
        private final Double middle;
        private final Double lower;
        private final Double k;
        private final Double d;

        private IndicatorPoint(String date, Double value, Double signal, Double histogram, Double upper, Double middle,
                Double lower, Double k, Double d) {
            this.date = date;
            this.value = value;
            this.signal = signal;
            this.histogram = histogram;
            this.upper = upper;
            this.middle = middle;
            this.lower = lower;
            this.k = k;
            this.d = d;
        }

        public static IndicatorPoint value(String date, double value) {
            return new IndicatorPoint(date, value, null, null, null, null, null, null, null);
        }

        public static IndicatorPoint macd(String date, double value, double signal, double histogram) {
            return new IndicatorPoint(date, value, signal, histogram, null, null, null, null, null);
        }

        public static IndicatorPoint bollinger(String date, double upper, double middle, double lower) {
            return new IndicatorPoint(date, null, null, null, upper, middle, lower, null, null);
        }

        public static IndicatorPoint stochastic(String date, double k, double d) {
            return new IndicatorPoint(date, null, null, null, null, null, null, k, d);
        }

        public String getDate() {
            return date;
        }

        public Double getValue() {
            return value;
        }

        public Double getSignal() {
            return signal;
        }

        public Double getHistogram() {
            return histogram;
        }

        public Double getUpper() {
            return upper;
        }

        public Double getMiddle() {
            return middle;
        }

        public Double getLower() {
            return lower;
        }

        public Double getK() {
            return k;
        }

        public Double getD() {
            return d;
        }
    }
}
