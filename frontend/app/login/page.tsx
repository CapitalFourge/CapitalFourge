"use client";

import Link from "next/link";
import { gql, useMutation } from "@apollo/client";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAuthCookie } from "@/lib/auth-cookie";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        username
        role
      }
    }
  }
`;

const trustSignals = [
  "Seguimiento consolidado de caja y posiciones",
  "Explorador de instrumentos con ejecución contextual",
  "Workspace sobrio para operar con menos ruido visual",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      console.log("[Login] ✅ onCompleted called", JSON.stringify(data, null, 2));
      localStorage.setItem("access_token", data.login.token);
      toast.success("Bienvenido de nuevo.");
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("[Login] ❌ onError", error);
      toast.error(`Error al iniciar sesión: ${error.message}`);
    },
  });

  console.log("[Login] 🔄 Component render", { loading, email: !!email, password: !!password });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("[Login] 🖱️ handleClick fired", { email, password: !!password, loading });
    e.preventDefault();
    e.stopPropagation();

    if (!email || !password) {
      console.warn("[Login] ⚠️ Missing credentials");
      toast.error("Completa email y contraseña");
      return;
    }

    console.log("[Login] 🚀 Calling login mutation", { email });
    login({ variables: { email, password } });
  };

  // También protegemos el submit nativo por si acaso
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log("[Login] 🛑 Native form submit intercepted");
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-[-4rem] top-24 h-64 w-64 rounded-full bg-emerald-400/16 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-400/14 blur-[140px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/45 backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Panel izquierdo */}
        <section className="flex flex-col justify-between border-b border-white/10 p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <img src="/icon.png" alt="Capital Fourge" className="h-10 w-[120px] object-contain sm:h-16 sm:w-[180px]" />
            </Link>

            <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="mt-14 max-w-xl">
              <p className="eyebrow">Acceso seguro</p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Aprende, practica y domina la inversión con un workspace <span className="text-gradient">sin riesgo</span>.
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-300">
                Inicia sesión para continuar en un entorno diseñado para seguimiento patrimonial, lectura táctica y ejecución con menos fricción visual.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }} className="grid gap-4">
              {trustSignals.map((signal) => (
                <div key={signal} className="panel-muted flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-slate-300">{signal}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Panel derecho - Formulario */}
        <section className="flex items-center p-6 sm:p-8 lg:p-12">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="w-full">
            <div className="panel mx-auto max-w-md p-7 sm:p-8">
              <div>
                <p className="eyebrow">Inicio de sesión</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Continúa a tu terminal.</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Usa tus credenciales para abrir el workspace financiero.
                </p>
              </div>

              {/* Formulario SIN onSubmit nativo */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Correo</label>
                  <Input
                    type="email"
                    placeholder="analista@firma.com"
                    value={email}
                    onChange={(event) => {
                      console.log("[Login] 📧 Email changed", event.target.value);
                      setEmail(event.target.value);
                    }}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white placeholder:text-slate-500"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Contraseña</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => {
                      console.log("[Login] 🔑 Password changed (length:", event.target.value.length, ")");
                      setPassword(event.target.value);
                    }}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] px-4 text-white placeholder:text-slate-500"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {/* Botón type="button" + onClick manual */}
                <Button
                  type="button"
                  disabled={loading}
                  onClick={handleClick}
                  className="h-14 w-full rounded-2xl bg-emerald-300 text-sm font-semibold text-slate-950 hover:bg-emerald-200"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
                <span>No tienes cuenta aún?</span>
                <Link href="/register" className="inline-flex items-center gap-2 font-medium text-white transition hover:text-emerald-200">
                  Crear cuenta
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
