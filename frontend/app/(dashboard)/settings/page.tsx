"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, Cpu, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-bold tracking-tighter">CONFIGURACIÓN_TERMINAL</h1>
                <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">Ajustes globales del motor de ejecución</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Shield size={16} /> Seguridad y Acceso
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div>
                                <p className="font-bold text-sm">Autenticación por Token</p>
                                <p className="text-[10px] text-slate-500 uppercase">JWT_HS256 activado</p>
                            </div>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-3">ACTIVO</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={16} /> Motor de Ejecución
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div>
                                <p className="font-bold text-sm">Protocolo gRPC</p>
                                <p className="text-[10px] text-slate-500 uppercase">Puerto: 50051 // Local-only</p>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-400 border-none px-3">ESTÁNDAR</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-none">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Bell size={16} /> Notificaciones Globales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl opacity-50">
                            <div>
                                <p className="font-bold text-sm">Alertas del Sistema</p>
                                <p className="text-[10px] text-slate-500 uppercase">En desarrollo (Fase 8)</p>
                            </div>
                            <Badge className="bg-white/10 text-white border-none px-3">PENDIENTE</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-center pt-20">
                <p className="text-[10px] text-zinc-800 uppercase tracking-[0.6em] font-mono">Terminal_State: Operational // Build_070226</p>
            </div>
        </div>
    );
}
