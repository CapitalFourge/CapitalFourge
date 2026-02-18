"use client";

import Link from "next/link";
import { LayoutDashboard, Wallet, LogOut, Settings, History } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 flex flex-col p-6 space-y-8 bg-zinc-950/50 backdrop-blur-xl transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg" />
                    <span className="font-bold tracking-tighter text-xl">FINSIGHT</span>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl text-sm font-medium text-white transition-all hover:bg-white/10">
                        <LayoutDashboard size={18} /> Panel Central
                    </Link>
                    <Link href="/portfolio" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium rounded-xl hover:bg-white/5">
                        <Wallet size={18} /> Portafolios
                    </Link>
                    <Link href="/transactions" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm font-medium rounded-xl hover:bg-white/5">
                        <History size={18} /> Transacciones
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-white transition-colors text-sm font-medium rounded-xl hover:bg-white/5">
                        <Settings size={18} /> Config. Terminal
                    </Link>
                </nav>

                <button
                    onClick={() => { localStorage.removeItem("access_token"); window.location.href = "/"; }}
                    className="flex items-center gap-3 px-4 py-3 text-red-400/60 hover:text-red-400 transition-colors text-sm font-medium rounded-xl hover:bg-red-400/5 group"
                >
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> Cerrar Sesión
                </button>
            </aside>

            {/* Content */}
            <main className="flex-1 p-10 overflow-y-auto bg-black">
                {children}
            </main>
        </div>
    );
}