"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface Transaction {
    timestamp: string;
    balanceTransaction: number | string;
}

export function BalanceChart({ transactions }: { transactions: Transaction[] }) {
    // Ordenamos y formateamos los datos para Recharts
    const data = transactions
        ?.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(t => ({
            date: format(new Date(t.timestamp), "MMM dd HH:mm"),
            balance: Number(t.balanceTransaction)
        })) || [];

    if (data.length < 2) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01] mt-10">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700">Accumulate more data points for terminal analysis</p>
            </div>
        );
    }

    return (
        <div className="h-[350px] w-full mt-10 p-8 glass rounded-[2rem] border-none shadow-2xl">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Capital_History_Log
            </p>
            <ResponsiveContainer width="100%" height="85%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#334155"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        padding={{ left: 20, right: 20 }}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#334155"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: number) => `$${val.toLocaleString()}`}
                        domain={['auto', 'auto']}
                        orientation="right"
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "12px", backdropFilter: "blur(10px)" }}
                        itemStyle={{ color: "#fff", fontSize: "14px", fontWeight: "bold" }}
                        labelStyle={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
                        cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, "LIQUID_VALUE"]}
                    />
                    <Line
                        type="stepAfter"
                        dataKey="balance"
                        stroke="#fff"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#fff", stroke: "#000", strokeWidth: 2 }}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
