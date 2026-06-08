"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, ShieldCheck, LogOut, Compass, Trophy, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Esta es una utilidad que instaló Shadcn automáticamente

const menuItems = [
    { name: "Resumen", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Portafolios", icon: Briefcase, href: "/portfolio" },
    { name: "Mercados", icon: Compass, href: "/explorer" },
    { name: "Ranking Global", icon: Trophy, href: "/leaderboard" },
    { name: "Configuración", icon: SettingsIcon, href: "/settings" },
    { name: "Admin", icon: ShieldCheck, href: "/admin" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl flex flex-col">
            <div className="p-8">
                <h2 className="text-xl font-bold tracking-tighter text-white">CAPITAL FOURGE</h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {/* Usamos un truco de React: recorremos la lista de menú para no repetir código */}
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href || "#"}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <button className="flex w-full items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}