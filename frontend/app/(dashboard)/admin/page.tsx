import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getLeaderboard() {
  const response = await fetch("http://localhost:8080/api/metrics/leaderboard", { cache: "no-store" });

  if (!response.ok) {
    return {};
  }

  return response.json();
}

export default async function AdminPage() {
  const leaderboard = await getLeaderboard();
  const ranking = Object.entries(leaderboard).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-7">
        <p className="eyebrow">Control administrativo</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Ranking de rendimiento.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Vista consolidada de performance por portafolio para monitoreo interno.
        </p>
      </section>

      <Card className="panel border-white/10 py-0">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Trophy className="h-5 w-5 text-amber-300" />
            ROI leaderboard
          </CardTitle>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
            {ranking.length} carteras
          </span>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Rank</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Portfolio ID</TableHead>
                  <TableHead className="pr-6 text-right text-xs uppercase tracking-[0.22em] text-slate-400">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={3} className="px-6 py-16 text-center text-sm text-slate-400">
                      No hay portafolios activos en el ranking.
                    </TableCell>
                  </TableRow>
                ) : (
                  ranking.map(([id, roi], index) => (
                    <TableRow key={id} className="border-white/10 hover:bg-white/[0.03]">
                      <TableCell className="px-6 font-mono text-sm text-slate-400">#{String(index + 1).padStart(2, "0")}</TableCell>
                      <TableCell className="font-mono text-sm text-white">{id}</TableCell>
                      <TableCell className="pr-6 text-right text-sm font-semibold text-white">
                        {Number(roi).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
