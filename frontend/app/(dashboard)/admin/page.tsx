import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getLeaderboard() {
    const res = await fetch('http://localhost:8080/api/metrics/leaderboard', { cache: 'no-store' });
    if (!res.ok) return {};
    return res.json();
}

export default async function AdminPage() {
    const leaderboard = await getLeaderboard();

    // Convertimos el objeto {uuid: roi} en una lista para poder recorrerla
    const ranking = Object.entries(leaderboard).sort((a, b) => (b[1] as number) - (a[1] as number));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tighter text-white">ADMIN TERMINAL</h1>
                <p className="text-slate-500 uppercase text-xs tracking-[0.3em] mt-2">Global Performance Ranking</p>
            </div>

            <Card className="glass border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-light">ROI Leaderboard (Real-time)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-slate-400">RANK</TableHead>
                                <TableHead className="text-slate-400">PORTFOLIO ID</TableHead>
                                <TableHead className="text-right text-slate-400">PERFORMANCE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ranking.map(([id, roi], index) => (
                                <TableRow key={id} className="border-white/5 hover:bg-white/[0.02]">
                                    <TableCell className="font-mono text-slate-500">#0{index + 1}</TableCell>
                                    <TableCell className="font-mono text-white text-xs">{id}</TableCell>
                                    <TableCell className="text-right font-bold text-white">
                                        {Number(roi).toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            {ranking.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-slate-600 italic">
                                        No active portfolios tracked yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}