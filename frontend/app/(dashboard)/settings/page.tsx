"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, gql } from "@apollo/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Shield, FileText, Check, AlertCircle, Loader2, Download, RefreshCw } from "lucide-react";

const ME_QUERY = gql`
  query GetMe {
    me {
      username
      email
      language
    }
    portfolios {
      id
      name
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($username: String, $email: String, $language: String) {
    updateProfile(username: $username, email: $email, language: $language) {
      username
      email
      language
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

const REPAIR_BALANCE = gql`
  mutation RepairMyBalance {
    repairMyBalance
  }
`;

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'reports'>('profile');
    const { data, loading, error, refetch } = useQuery(ME_QUERY);

    // Profile Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [language, setLanguage] = useState('ES');

    // Security Form State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [updateProfileMutation, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE);
    const [changePasswordMutation, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);
    const [repairBalanceMutation, { loading: repairingBalance }] = useMutation(REPAIR_BALANCE);

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        if (data?.me) {
            setUsername(data.me.username);
            setEmail(data.me.email);
            setLanguage(data.me.language || 'ES');
        }
    }, [data]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            await updateProfileMutation({ variables: { username, email, language } });
            setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            refetch();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }
        try {
            await changePasswordMutation({ variables: { oldPassword, newPassword } });
            setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleRepairBalance = async () => {
        setMessage(null);
        try {
            await repairBalanceMutation();
            setMessage({ type: 'success', text: 'Balance sincronizado correctamente. Tus fondos han sido auditados.' });
            refetch();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const downloadReport = async (portfolioId: string, portfolioName: string) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8080/api/reports/portfolio/${portfolioId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ""
                }
            });
            if (!response.ok) throw new Error('Error al generar el reporte');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${portfolioName.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error(err);
            alert('Error al descargar el reporte');
        }
    };

    if (loading) return <div className="p-10 text-slate-500 font-mono animate-pulse uppercase tracking-widest">CARGANDO_CONFIGURACIÓN...</div>;

    if (error) return (
        <div className="p-10 text-red-400 font-mono bg-red-500/5 rounded-3xl border border-red-500/20">
            <h2 className="text-xl font-bold mb-2">ERROR_DE_SISTEMA</h2>
            <p className="opacity-70">{error.message}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tighter text-white uppercase italic">Configuración</h1>
                    <p className="text-slate-500 text-xs mt-2 uppercase tracking-[0.3em]">Personalización de Entorno y Seguridad de Activos</p>
                </div>
                <Badge className="bg-white/5 text-slate-500 border-white/10 px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase">
                    Build_070226 // Stable
                </Badge>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold uppercase tracking-tight">{message.text}</span>
                </div>
            )}

            {/* Custom Tabs Navigation */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                    <UserIcon size={14} /> Perfil
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'security' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Shield size={14} /> Seguridad
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'reports' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                    <FileText size={14} /> Reportes
                </button>
            </div>

            <Card className="glass border-none overflow-hidden rounded-[2.5rem]">
                <CardContent className="p-10">
                    {activeTab === 'profile' && (
                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Username / Identifier</label>
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-white/5 border-white/5 rounded-2xl h-14 focus:ring-white/10 text-white font-medium"
                                        placeholder="Tu nombre de usuario"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Account Email</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/5 border-white/5 rounded-2xl h-14 text-white font-medium"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Preferencias de Idioma</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('ES')}
                                        className={`h-16 rounded-2xl border flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all ${language === 'ES' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600 hover:border-white/10'}`}
                                    >
                                        <span className="text-xl">🇪🇸</span> Español
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage('EN')}
                                        className={`h-16 rounded-2xl border flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all ${language === 'EN' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-600 hover:border-white/10'}`}
                                    >
                                        <span className="text-xl">🇺🇸</span> English (v0.1)
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={updatingProfile}
                                className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all text-xs"
                            >
                                {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sincronizar Cambios'}
                            </Button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form onSubmit={handleChangePassword} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Contraseña Actual</label>
                                <Input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                                    required
                                />
                            </div>
                            <div className="h-px bg-white/5 w-full" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Nueva Contraseña</label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Confirmar Nueva Contraseña</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-white/5 border-white/5 rounded-2xl h-14 text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={changingPassword}
                                className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all text-xs"
                            >
                                {changingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Actualizar Credenciales'}
                            </Button>

                            <div className="pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-start gap-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Herramienta de Auditoría de Fondos</p>
                                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">
                                            Si has eliminado portafolios recientemente y notas que tu balance bloqueado no se ha sincronizado,
                                            usa esta herramienta para forzar una reconciliación de órdenes huérfanas.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleRepairBalance}
                                    disabled={repairingBalance}
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-slate-400 font-bold uppercase tracking-widest text-[10px] gap-2"
                                >
                                    {repairingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={14} />}
                                    Sincronizar Balance de Cartera
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'reports' && (
                        <div className="space-y-10">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-start gap-6">
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <FileText className="text-white" size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-white uppercase tracking-widest text-sm">Motor de Reportes PDF</p>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed uppercase tracking-tight">
                                        Nuestra IA generativa analiza tus métricas de rendimiento y genera documentos oficiales
                                        con sello de auditoría interna. Exporta tus resultados para gestión patrimonial.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-bold ml-1 inline-block">Portafolios Disponibles</label>
                                {data?.portfolios?.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {data.portfolios.map((p: any) => (
                                            <div key={p.id} className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                                                <div>
                                                    <p className="font-bold text-white text-lg tracking-tight">{p.name}</p>
                                                    <p className="text-[9px] text-slate-600 uppercase font-mono tracking-[0.2em] mt-1">Access_Token: #{p.id.substring(0, 12)}</p>
                                                </div>
                                                <Button
                                                    onClick={() => downloadReport(p.id, p.name)}
                                                    className="rounded-2xl h-14 px-8 bg-white/5 hover:bg-white text-white hover:text-black gap-3 transition-all border border-white/10 font-bold uppercase tracking-widest text-[10px]"
                                                >
                                                    <Download size={16} /> Descargar Reporte
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                        <p className="uppercase tracking-[0.5em] text-[10px] text-slate-600">No se detectan portafolios activos para auditoría</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-4 pt-10 opacity-30">
                <div className="h-px w-40 bg-white" />
                <p className="text-[9px] text-white uppercase tracking-[0.8em] font-mono">End_Of_Settings // System_State: Nominal</p>
            </div>
        </div>
    );
}
