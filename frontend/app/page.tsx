"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

const stats = [
  { label: "Activos disponibles", value: "250+", detail: "Acciones, crypto, commodities y forex en un solo lugar." },
  { label: "Tiempo de respuesta", value: "< 120 ms", detail: "Datos en tiempo real para tus decisiones de trading." },
  { label: "Disponible 24/7", value: "Siempre activo", detail: "Accede a tu portafolio desde cualquier dispositivo." },
];

const features = [
  {
    icon: Wallet,
    title: "Control patrimonial claro",
    copy: "Caja, posiciones, bloqueos y rendimiento neto visibles sin navegar entre pantallas inconexas.",
  },
  {
    icon: BarChart3,
    title: "Lectura táctica del mercado",
    copy: "Explora instrumentos, filtra categorías y opera desde una interfaz sobria orientada a decisión.",
  },
  {
    icon: ShieldCheck,
    title: "Infraestructura con disciplina",
    copy: "Diseño serio, lenguaje financiero y superficies limpias para una experiencia más institucional.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-emerald-400/12 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-6rem] top-10 h-80 w-80 rounded-full bg-blue-400/12 blur-[140px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-xl sm:px-5 sm:py-4"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="Capital Fourge"
              width={120}
              height={40}
              className="h-10 w-[120px] object-contain sm:h-16 sm:w-[180px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.08] hover:text-white sm:px-5 sm:text-sm">
              <Link href="/register">Crear cuenta</Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-300 px-3 py-1.5 text-xs text-slate-950 hover:bg-emerald-200 sm:px-5 sm:text-sm">
              <Link href="/login">Ingresar</Link>
            </Button>
          </div>
        </motion.header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="hero-glow"
          >
            <p className="eyebrow mb-5">Tu academia de trading</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.94] tracking-[-0.05em] text-white md:text-7xl">
              Aprende, practica y conviértete en un <span className="text-gradient">trader rentable</span>.
            </h1>
               <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
               Capital Fourge te ayuda a aprender, practicar y dominar la inversión mediante educación y simulaciones realistas del mercado.
               </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="animate-sheen rounded-full bg-emerald-300 px-7 text-slate-950 hover:bg-emerald-200">
                <Link href="/login">
                  Comenzar ahora
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/12 bg-white/[0.03] px-7 text-white hover:bg-white/[0.08]">
                <Link href="/strategies">Ver estrategias</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <span className="status-dot" />
                Monitoreo continuo de posiciones y liquidez
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Motion sutil para reforzar jerarquía y foco
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="panel relative overflow-hidden p-6 sm:p-7"
          >
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="grid gap-4">
              <div className="panel-muted animate-float p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Valor consolidado</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white">$ 2.48M</p>
                  </div>
                  <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    +12.4% YTD
                  </div>
                </div>
                <div className="mt-6 h-28 rounded-[1.4rem] bg-gradient-to-br from-emerald-300/16 via-white/4 to-transparent p-4">
                  <div className="flex h-full items-end gap-2">
                    {[28, 42, 34, 56, 51, 72, 66, 83].map((value, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-full bg-gradient-to-t from-emerald-300/85 to-emerald-100/20"
                        style={{ height: `${value}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="panel-muted animate-float-delayed p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Liquidez</p>
                  <p className="mt-3 text-3xl font-semibold text-white">$ 412k</p>
                  <p className="mt-2 text-sm text-slate-400">Capital listo para nuevas asignaciones.</p>
                </div>
                <div className="panel-muted p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Riesgo agregado</p>
                  <p className="mt-3 text-3xl font-semibold text-white">Moderado</p>
                  <p className="mt-2 text-sm text-slate-400">Lectura rápida de exposición y volatilidad.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
              className="metric-tile"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{stat.detail}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-5 pb-16 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 + index * 0.08 }}
                className="panel p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-emerald-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{feature.copy}</p>
              </motion.article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
