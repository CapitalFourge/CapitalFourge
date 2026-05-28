import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface PricePoint {
  date: string;
  price: number;
}

interface BinnedData {
  priceRange: string;
  count: number;
  fill: string;
}

/**
 * Simple liquidity heatmap showing price distribution (volume profile approximation)
 * Uses price history to bin prices and show frequency as a proxy for liquidity/volume
 */
export function LiquidityHeatmap({ data }: { data: PricePoint[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-400 py-4">No data available</div>;
  }

  // Bin the prices into 20 buckets
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const numBins = 20;
  const binSize = (maxPrice - minPrice) / numBins;

  const bins: BinnedData[] = [];
  for (let i = 0; i < numBins; i++) {
    const low = minPrice + i * binSize;
    const high = low + binSize;
    const count = prices.filter(p => p >= low && p < high).length;
    // Use a color gradient from light to dark based on count
    const fill = `rgba(30, 64, 175, ${0.2 + (count / Math.max(...bins.map(b => b.count), 1)) * 0.8})`;
    bins.push({
      priceRange: `${low.toFixed(2)} - ${high.toFixed(2)}`,
      count,
      fill,
    });
  }

  // Sort bins by price ascending
  bins.sort((a, b) => parseFloat(a.priceRange.split(' - ')[0]) - parseFloat(b.priceRange.split(' - ')[0]));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={bins}>
        <CartesianGrid vertical={false} horizontal={true} stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="priceRange" tick={false} axisLine={false} tickLine={false} />
        <YAxis tick={false} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{ backgroundColor: "rgba(8, 15, 28, 0.96)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", color: "#fff" }}
          labelStyle={{ color: "#fff" }}
          formatter={(value) => `${value} occurrences`}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {bins.map((bin) => (
            <Cell key={bin.priceRange} fill={bin.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
