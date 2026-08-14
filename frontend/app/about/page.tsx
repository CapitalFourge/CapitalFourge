"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Globe, Shield, Sparkles, Target, Users } from "lucide-react";

const values = [
  { icon: Target, title: "Enfoque realista", desc: "Simulamos condiciones reales: spreads, slippage, comisiones, horarios de mercado. Nada de datos perfectos." },
  { icon: Shield, title: "Integridad primero", desc: "Sin datos fabricados. Sin backtests amañados. Sin promesas de riqueza rápida. Educación honesta." },
  { icon: BookOpen, title: "Educación accionable", desc: "Conceptos financieros explicados con ejemplos de mercado real. Teoría que se puede aplicar mañana." },
  { icon: Globe, title: "Cobertura global", desc: "Acciones, crypto, forex, commodities, índices. Un workspace para todo tu universo inversor." },
  // { icon: BarChart3, title: "Herramientas de grado profesional", desc: "Charting avanzado, indicadores técnicos, métricas fundamentales, dibujo técnico. Sin juguetes." }, // PAUSADO
  { icon: Users, title: "Comunidad seria", desc: "Espacio para analistas, no para ruido. Comparte estrategias, no señales de telegram." },
];

const milestones = [
  { year: "2024", title: "Inicio del proyecto", desc: "Arquitectura base: Spring Boot + Next.js + GraphQL. Paper trading con Alpaca/Alpaca." },
  { year: "2025 Q1", title: "Lanzamiento alfa", desc: "Primeros usuarios reales. Feedback loop semanal. Corrección de fricciones UX críticas." },
  // { year: "2025 Q2", title: "Estrategias académicas", desc: "7 estrategias basadas en papers (momentum, mean reversion, pairs, factor, etc.). Backtesting vectorizado." }, // PAUSADO
  { year: "2025 Q3", title: "Dashboard institucional", desc: "Multi-portfolio, risk metrics, attribution, reporting automatizado. Preparación para beta pública." },
  { year: "2025 Q4", title: "Beta pública + API", desc: "Registro abierto. API para integraciones. Programa de partners educativos." },
];

const team = [
  { role: "Fundador & Arquitecto", name: "Capital Fourge", desc: "15+ años en mercados, ingeniería de sistemas y cuantitativa. Ex-fundador fintech. Cree que la educación financiera debe ser rigurosa, accesible y sin humo." },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-[-4rem] top-24 h-64 w-64 rounded-full bg-emerald-400/16 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-400/14 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Hero */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-16 lg:mb-20">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-300/10 border border-emerald-300/20 px-4 py-2 mb-6">
              <Sparkles className="h-5 w-5 text-emerald-200" />
              <span className="text-sm font-medium text-emerald-200">En construcción pública desde 2024</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl leading-[0.95]">
              Donde el conocimiento financiero
              <br />
              <span className="text-gradient">toma forma</span>.
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-slate-300">
              Capital Fourge nace de una idea simple: aprender a invertir no debería ser un casino.
              Construimos la plataforma que nos hubiera gustado tener al empezar: datos reales, herramientas serias,
              y una comunidad que valora el proceso sobre el resultado.
            </motion.p>
          </div>
        </motion.section>

        {/* Values */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="mb-16 lg:mb-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Principios</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Lo que nos guía.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <motion.article
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.08 }}
                className="panel p-6 hover:border-emerald-300/30 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-emerald-200 mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-slate-400 leading-7">{value.desc}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mb-16 lg:mb-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Historia</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Hitos del proyecto.</h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10 lg:left-1/2" />
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={`relative mb-10 lg:mb-12 ${index % 2 === 0 ? "lg:pr-20 lg:text-right" : "lg:pl-20 lg:ml-1/2"}`}
              >
                <div className="absolute top-2 lg:left-[calc(50%-8px)] w-4 h-4 rounded-full bg-emerald-300 border-4 border-dashboard z-10 lg:-translate-x-1/2" />
                <div className="panel p-6 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-emerald-300">{milestone.year}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Hito</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">{milestone.title}</h3>
                  <p className="mt-2 text-slate-400 leading-7">{milestone.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Team */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="mb-16 lg:mb-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Equipo</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Pequeño equipo, ambición grande.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <motion.article
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="panel p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200 mb-4">
                  <ArrowRight className="h-6 w-6 rotate-45" />
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200 mb-1">{member.role}</p>
                <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-slate-400 leading-7">{member.desc}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }} className="mb-16 lg:mb-20">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Tecnología</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">Stack moderno, probado en producción.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Frontend", tech: "Next.js 16, React 19, TypeScript, Tailwind v4" },
              { label: "Backend", tech: "Spring Boot 3, Java 21, GraphQL, WebSocket" },
              { label: "Data", tech: "PostgreSQL, Redis, TimescaleDB, Apache Kafka" },
              { label: "Infra", tech: "Docker, Kubernetes, Render, Railway, Vercel" },
              { label: "ML/Quant", tech: "Python, Pandas, NumPy, scikit-learn, Kronos" },
              { label: "Auth", tech: "JWT, Refresh tokens, bcrypt, OAuth2 (pendiente)" },
              { label: "Observabilidad", tech: "OpenTelemetry, Grafana, Loki, Tempo" },
              { label: "CI/CD", tech: "GitHub Actions, Docker Buildx, Trivy, Renovate" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
                className="panel p-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200 mb-2">{item.label}</p>
                <p className="text-sm text-slate-300 leading-6">{item.tech}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Philosophy */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="mb-16 lg:mb-20">
          <div className="panel p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-300/5 via-transparent to-blue-400/5" />
            <div className="relative max-w-3xl">
              <p className="eyebrow mb-4">Filosofía</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mb-6 md:text-4xl">
                &ldquo;El mercado no premia la suerte. Premia el proceso.&rdquo;
              </h2>
              <div className="space-y-4 text-slate-300 leading-8">
                <p>
                  La mayoría de plataformas te venden el sueño: señales mágicas, copy-trading, &ldquo;pasivo&rdquo; que no lo es.
                  Capital Fourge va en dirección opuesta: te damos las herramientas para que <strong className="text-white">tú construyas tu propio proceso</strong>.
                </p>
                <p>
                  Datos limpios. Backtesting honesto (sin look-ahead bias, sin survivorship bias).
                  Métricas de riesgo reales (VaR, CVaR, drawdown path-dependent).
                  Y una comunidad que pregunta &ldquo;¿cuál es tu thesis?&rdquo; en vez de &ldquo;¿qué compro?&rdquo;.
                </p>
                <p className="pt-4 border-t border-white/10">
                  <span className="font-medium text-emerald-200">Sin datos falsos.</span> Sin backtests de marketing.
                  Sin promesas de rentabilidad. Solo el camino largo, aburrido y rentable de aprender bien.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }} className="text-center">
          <p className="eyebrow mb-4">¿Listo para empezar?</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white mb-6 md:text-4xl">
            Únete a miles de analistas construyendo su edge.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto animate-sheen rounded-full bg-emerald-300 px-8 py-4 text-base font-semibold text-slate-950 hover:bg-emerald-200 transition-colors">
              Crear cuenta gratis
              <ArrowRight className="inline h-5 w-5 ml-2" />
            </Link>
            {/* <Link href="/strategies" className="w-full sm:w-auto rounded-full border border-white/12 bg-white/[0.03] px-8 py-4 text-base font-medium text-white hover:bg-white/[0.08] transition-colors">
              Ver estrategias
            </Link> */}
          </div>
        </motion.section>
      </div>
    </main>
  );
}