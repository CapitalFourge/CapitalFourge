import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { MoveRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-dashboard overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center mb-16">
        <h1 className="text-8xl font-extrabold tracking-tighter text-white cursor-default hover:text-white/40 transition-colors duration-700">
          FINSIGHT
        </h1>
        <p className="text-slate-500 uppercase tracking-[0.4em] text-[10px] mt-6 leading-relaxed">
          Crea tus portafolios de manera gratuita, rápido y sencillo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl relative z-10">
        <Card className="glass border-none group cursor-pointer hover:bg-white/[0.05] transition-all duration-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
              Nivel Institucional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-light text-white leading-tight">Gestión de portafolios con herramientas de grado profesional.</p>
          </CardContent>
        </Card>

        <Card className="glass border-none group cursor-pointer hover:bg-white/[0.05] transition-all duration-500">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
              Análisis Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-light text-white leading-tight">Visualiza tus activos y toma mejores decisiones financieras.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 relative z-10">
        <Link href="/login">
          <button className="group flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-200 transition-all shadow-2xl">
            LOG IN ACCOUNT <MoveRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </Link>
      </div>

      <p className="mt-20 text-[10px] text-zinc-700 uppercase tracking-[0.4em] font-mono">Build_v1.0.4 // Encrypted Connection</p>
    </div>
  );
}