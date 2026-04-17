"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const requirements = [
  "Contraseña mínima de 8 caracteres",
  "Al menos una mayúscula",
  "Al menos un número para reforzar seguridad",
];

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Contraseña insegura", {
        description: "Debe tener al menos 8 caracteres, una mayúscula y un número.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        toast.success("Cuenta creada correctamente.");
        router.push("/login");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Error al crear cuenta");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute right-[-4rem] top-24 h-64 w-64 rounded-full bg-emerald-400/16 blur-[120px]" />
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-400/14 blur-[140px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45 backdrop-blur-2xl lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
          <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="w-full">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-sm font-black text-slate-950">
                FS
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-white">FINSIGHT</p>
                <p className="text-xs text-slate-400">Institutional-grade workspace</p>
              </div>
            </Link>

            <p className="eyebrow mt-12">Onboarding</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Crea una cuenta para empezar a operar con una vista <span className="text-gradient">más seria y moderna</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Registra tu perfil y entra a un workspace preparado para carteras, exploración de mercado y reportes desde una misma capa visual.
            </p>

            <div className="mt-10 grid gap-4">
              {requirements.map((item) => (
                <div key={item} className="panel-muted flex items-center gap-4 px-5 py-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="flex items-center p-6 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="w-full"
          >
            <div className="panel mx-auto max-w-xl p-7 sm:p-8">
              <div>
                <p className="eyebrow">Crear cuenta</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Configura tu acceso.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Tus credenciales abrirán el entorno principal de análisis y ejecución.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Usuario</label>
                    <Input
                      placeholder="analista_01"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Correo</label>
                    <Input
                      type="email"
                      placeholder="analista@firma.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Contraseña</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white placeholder:text-slate-500"
                    required
                  />
                  <p className="text-xs leading-6 text-slate-500">
                    Usa una contraseña fuerte para proteger cartera, movimientos y reportes.
                  </p>
                </div>

                <Button
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-emerald-300 text-sm font-semibold text-slate-950 hover:bg-emerald-200"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
                <span>Ya tienes acceso?</span>
                <Link href="/login" className="inline-flex items-center gap-2 font-medium text-white transition hover:text-emerald-200">
                  Ir a login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
