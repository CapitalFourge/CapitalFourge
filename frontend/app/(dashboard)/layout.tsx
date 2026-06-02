"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Compass,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { WelcomeDialog } from "@/components/ui/welcome-dialog";

const navigation = [
  {
    href: "/dashboard",
    label: "Resumen",
    icon: LayoutDashboard,
    info: {
      title: "Resumen",
      description:
        "Panel principal donde ves tu patrimonio total, caja disponible, capital invertido y saldo retenido en un solo vistazo.",
    },
  },
  {
    href: "/portfolio",
    label: "Portafolios",
    icon: Wallet,
    info: {
      title: "Portafolios",
      description:
        "Un portafolio es un conjunto de activos financieros organizados en una estrategia. Crea varios con diferentes perfiles de riesgo.",
    },
  },
  {
    href: "/explorer",
    label: "Mercados",
    icon: Compass,
    info: {
      title: "Mercados",
      description:
        "Explora activos globales: acciones, criptomonedas, materias primas y divisas. Busca por símbolo o filtra por categoría.",
    },
  },
  {
    href: "/strategies",
    label: "Estrategias",
    icon: BarChart3,
    info: {
      title: "Estrategias",
      description:
        "Planes de inversión predefinidos con datos reales de rendimiento. Aplícalas a tus portafolios según tu perfil de riesgo.",
    },
  },
  {
    href: "/transactions",
    label: "Movimientos",
    icon: History,
    info: {
      title: "Movimientos",
      description:
        "Historial completo de compras, ventas, depósitos y retiros. Lleva el control de toda tu actividad operativa.",
    },
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: Settings,
    info: {
      title: "Configuración",
      description:
        "Ajusta tu perfil, cambia tu contraseña, exporta reportes PDF y personaliza la aplicación.",
    },
  },
];

const ME_QUERY = gql`
  query GetMeForWelcome {
    me {
      id
      role
      showWelcome
    }
  }
`;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useQuery(ME_QUERY, { fetchPolicy: "cache-and-network" });

  const isAdmin = useMemo(() => {
    return data?.me?.role === "ADMIN";
  }, [data]);

  const allNavigation = isAdmin
    ? [...navigation, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : navigation;

  return (
    <div className="min-h-screen bg-dashboard">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-[1700px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-[290px] shrink-0 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 backdrop-blur-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-sm font-black text-slate-950">
                FS
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-white">FINSIGHT</p>
                <p className="text-xs text-slate-400">Professional wealth workspace</p>
              </div>
            </div>

<nav className="mt-6 flex-1 space-y-2">
               {allNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition duration-200",
                      isActive
                        ? "bg-emerald-300 text-slate-950 shadow-[0_14px_40px_rgba(110,231,183,0.2)]"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.info && <InfoTooltip title={item.info.title} description={item.info.description} />}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-4 border-t border-white/10 pt-5">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tu cuenta</p>
                <p className="mt-2 text-lg font-semibold text-white">Lista para operar</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                  <span className="status-dot" />
                  Datos en tiempo real
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("access_token");
                  window.location.href = "/";
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-4 z-20 mb-4 rounded-[1.5rem] border border-white/10 bg-slate-950/45 px-4 py-3 backdrop-blur-2xl lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.24em] text-white">FINSIGHT</p>
                <p className="text-xs text-slate-400">Workspace financiero</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("access_token");
                  window.location.href = "/";
                }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200"
              >
                Salir
              </button>
            </div>
<div className="flex gap-2 overflow-x-auto scrollbar-subtle">
               {allNavigation.map((item) => {
                 const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition",
                      isActive ? "bg-emerald-300 text-slate-950" : "bg-white/[0.05] text-slate-300"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="min-w-0 flex-1 rounded-[2rem] border border-white/8 bg-slate-950/28 p-4 backdrop-blur-xl sm:p-6 lg:p-7">
            {children}
          </main>
          <WelcomeDialog />
        </div>
      </div>
    </div>
  );
}
