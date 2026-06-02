"use client";

import React, { useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  Check,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    myFeedbacks {
      id
      category
      message
      createdAt
      read
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

const SUBMIT_FEEDBACK = gql`
  mutation SubmitFeedback($category: FeedbackCategory!, $message: String!) {
    submitFeedback(category: $category, message: $message) {
      id
      category
      message
      createdAt
      read
    }
  }
`;

type FeedbackCategoryInput = "QUEJA" | "RECLAMO" | "SUGERENCIA" | "OTRO";

const feedbackCategories: Record<FeedbackCategoryInput, string> = {
  QUEJA: "Queja",
  RECLAMO: "Reclamo",
  SUGERENCIA: "Sugerencia",
  OTRO: "Otro",
};

type TabKey = "profile" | "security" | "reports" | "feedback";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const { data, loading, error, refetch } = useQuery(ME_QUERY);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("ES");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [updateProfileMutation, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE);
  const [changePasswordMutation, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);
  const [repairBalanceMutation, { loading: repairingBalance }] = useMutation(REPAIR_BALANCE);
  const [submitFeedbackMutation, { loading: submittingFeedback }] = useMutation(SUBMIT_FEEDBACK);

  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategoryInput>("SUGERENCIA");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const feedbacks = data?.myFeedbacks || [];

  React.useEffect(() => {
    if (data?.me) {
      setUsername(data.me.username);
      setEmail(data.me.email);
      setLanguage(data.me.language || "ES");
    }
  }, [data]);

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      await updateProfileMutation({ variables: { username, email, language } });
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
      refetch();
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    try {
      await changePasswordMutation({ variables: { oldPassword, newPassword } });
      setMessage({ type: "success", text: "Contraseña actualizada correctamente." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleRepairBalance = async () => {
    setMessage(null);

    try {
      await repairBalanceMutation();
      setMessage({ type: "success", text: "Balance sincronizado y auditado." });
      refetch();
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const handleSubmitFeedback = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!feedbackMessage.trim()) {
      setMessage({ type: "error", text: "Escribe tu mensaje antes de enviarlo." });
      return;
    }

    try {
      await submitFeedbackMutation({
        variables: { category: feedbackCategory, message: feedbackMessage.trim() },
      });
      setMessage({ type: "success", text: "Tu comentario se envió correctamente. Gracias." });
      setFeedbackMessage("");
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message });
    }
  };

  const downloadReport = async (portfolioId: string, portfolioName: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://localhost:8080/api/reports/portfolio/${portfolioId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Error al generar el reporte");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Reporte_${portfolioName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      alert("Error al descargar el reporte");
    }
  };

  if (loading) {
    return <div className="p-8 text-sm uppercase tracking-[0.26em] text-slate-400">Cargando configuración...</div>;
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">No fue posible cargar configuración</h2>
        <p className="mt-2 text-sm text-red-100/80">{error.message}</p>
      </div>
    );
  }

  const tabs: { id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "security", label: "Seguridad", icon: Shield },
    { id: "reports", label: "Reportes", icon: FileText },
    { id: "feedback", label: "Comentarios", icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="eyebrow">Preferencias del workspace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">Configuración.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Ajusta tu perfil, seguridad y salida de reportes sin salir de la misma capa operativa.
          </p>
        </div>

        <Badge className="rounded-full border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">
          Build estable
        </Badge>
      </section>

      {message && (
        <div
          className={`flex items-center gap-3 rounded-[1.5rem] border px-5 py-4 ${
            message.type === "success"
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
              : "border-red-400/20 bg-red-500/10 text-red-100"
          }`}
        >
          {message.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
                active
                  ? "border-emerald-300/40 bg-emerald-300/12 text-white"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card className="panel border-white/10 py-0">
        <CardContent className="p-6 sm:p-7">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Usuario</label>
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    placeholder="Nombre de usuario"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Correo</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Idioma</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("ES")}
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                      language === "ES"
                        ? "border-emerald-300/40 bg-emerald-300/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300"
                    }`}
                  >
                    <p className="font-medium">Español</p>
                    <p className="mt-1 text-sm text-slate-400">Interfaz principal y mensajes del sistema.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("EN")}
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                      language === "EN"
                        ? "border-emerald-300/40 bg-emerald-300/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-slate-300"
                    }`}
                  >
                    <p className="font-medium">English</p>
                    <p className="mt-1 text-sm text-slate-400">Secondary locale for the workspace.</p>
                  </button>
                </div>
              </div>

              <Button className="h-12 rounded-2xl bg-emerald-300 px-6 text-slate-950 hover:bg-emerald-200" disabled={updatingProfile}>
                {updatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
              </Button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Contraseña actual</label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Nueva contraseña</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Confirmar contraseña</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-14 rounded-2xl border-white/10 bg-white/[0.04] text-white"
                    required
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-200" />
                  <div>
                    <p className="font-medium text-white">Sincronización de balance</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Si eliminaste portafolios recientemente y el saldo retenido no coincide, ejecuta una reconciliación manual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="h-12 rounded-2xl bg-emerald-300 px-6 text-slate-950 hover:bg-emerald-200" disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar credenciales"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRepairBalance}
                  disabled={repairingBalance}
                  className="h-12 rounded-2xl border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"
                >
                  {repairingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reconciliar balance
                </Button>
              </div>
            </form>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-lg font-semibold text-white">Exportación PDF</p>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Genera reportes por cartera con el estado actual de la información disponible.
                </p>
              </div>

              {data?.portfolios?.length > 0 ? (
                <div className="grid gap-4">
                  {data.portfolios.map((portfolio: { id: string; name: string }) => (
                    <div key={portfolio.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">{portfolio.name}</p>
                        <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-slate-500">
                          ID {portfolio.id.slice(0, 10)}
                        </p>
                      </div>
                      <Button
                        onClick={() => downloadReport(portfolio.id, portfolio.name)}
                        className="h-11 rounded-2xl bg-emerald-300 px-5 text-slate-950 hover:bg-emerald-200"
                      >
                        <Download className="h-4 w-4" />
                        Descargar reporte
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                  No hay portafolios disponibles para exportar.
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-lg font-semibold text-white">Comentarios, quejas y reclamos</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Tu opinión es muy importante. Envía sugerencias, reporta problemas o cuéntanos cómo podemos mejorar FinSight.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(feedbackCategories) as FeedbackCategoryInput[]).map((option) => {
                      const active = feedbackCategory === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFeedbackCategory(option)}
                          className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                            active
                              ? "border-emerald-300/40 bg-emerald-300/12 text-white"
                              : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {feedbackCategories[option]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-400">Tu mensaje</label>
                  <textarea
                    value={feedbackMessage}
                    onChange={(event) => setFeedbackMessage(event.target.value)}
                    className="h-32 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white placeholder:text-slate-500 outline-none"
                    placeholder="Describe tu comentario, queja o sugerencia con el mayor detalle posible..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingFeedback}
                  className="h-12 rounded-2xl bg-emerald-300 px-6 text-slate-950 hover:bg-emerald-200"
                >
                  {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar comentario"}
                </Button>
              </form>

              {feedbacks.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Mis comentarios anteriores</p>
                  {feedbacks.map((feedback: Record<string, unknown>) => (
                    <div key={feedback.id as string} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{feedback.category as string}</p>
                        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
                          {new Date(feedback.createdAt as string).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-200">{feedback.message as string}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {feedback.read ? "Leído" : "Pendiente de revisión"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Aún no has enviado comentarios.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
