"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
  timestamp: string;
  totalValue: number;
}

interface PortfolioValueChartProps {
  transactions: Transaction[];
  className?: string;
}

export function PortfolioValueChart({ transactions, className = "h-80" }: PortfolioValueChartProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className} text-slate-400`}>
        <p>No hay datos de transacciones para mostrar la evolución</p>
      </div>
    );
  }

  // Ordenar transacciones por fecha ascendente
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Preparar datos para el gráfico: usar totalValue acumulado por fecha
  const chartData = sortedTransactions.map((tx, index) => ({
    date: format(new Date(tx.timestamp), "dd/MM", { locale: es }),
    fullDate: format(new Date(tx.timestamp), "dd/MM/yyyy HH:mm", { locale: es }),
    value: tx.totalValue,
    label: index === 0 ? "Inicial" : `${tx.totalValue >= 0 ? "+" : ""}${tx.totalValue}`,
  }));

  const minValue = Math.min(...chartData.map((d) => d.value));
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const padding = (maxValue - minValue) * 0.1 || 1000;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#1e293b" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[minValue - padding, maxValue + padding]}
            tickFormatter={(value) =>
              new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value),
              "Valor total",
            ]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={0.15}
            fill="url(#portfolioValueGradient)"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, fill: "#22c55e", stroke: "#0f172a" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2, fill: "#22c55e", stroke: "#0f172a" }}
          />
          <defs>
            <linearGradient id="portfolioValueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}