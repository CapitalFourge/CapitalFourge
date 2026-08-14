"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { Loader2, Users, Database, BarChart3, Shield, Activity, TrendingUp, AlertCircle, CheckCircle, Server } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_USERS_QUERY = gql`
  query AdminUsers {
    adminUsers {
      id
      email
      username
      role
      active
      createdAt
      cashBalance
      lockedBalance
    }
  }
`;

const ADMIN_SET_ROLE_MUTATION = gql`
  mutation AdminSetRole($userId: ID!, $role: String!) {
    adminSetRole(userId: $userId, role: $role) {
      id
      role
    }
  }
`;

const ADMIN_DEACTIVATE_MUTATION = gql`
  mutation AdminDeactivateUser($userId: ID!) {
    adminDeactivateUser(userId: $userId)
  }
`;

// System metrics query - uses existing public queries
const SYSTEM_METRICS_QUERY = gql`
  query SystemMetrics {
    assetMovers(sort: "volatile", limit: 10) {
      topGainers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      topLosers {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
      mostTraded {
        symbol
        name
        price
        changePercent
        changeValue
        volume
      }
    }
    assetsByCategory(category: "STOCKS") {
      symbol
      name
      category
    }
  }
`;

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: string | null;
  cashBalance: number;
  lockedBalance: number;
}

interface AssetMover {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  changeValue: number;
  volume: number;
}

interface Asset {
  symbol: string;
  name: string;
  category: string;
}

export default function AdminPage() {
  const { data: usersData, loading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery(ADMIN_USERS_QUERY, {
    fetchPolicy: "network-only",
  });
  const { data: metricsData, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useQuery(SYSTEM_METRICS_QUERY, {
    fetchPolicy: "network-only",
  });

  const [setRoleMutation, { loading: settingRole }] = useMutation(ADMIN_SET_ROLE_MUTATION);
  const [deactivateMutation, { loading: deactivating }] = useMutation(ADMIN_DEACTIVATE_MUTATION);

  const handleSetRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      await setRoleMutation({ variables: { userId, role: newRole } });
      toast.success(`Rol actualizado a ${newRole}`);
      refetchUsers();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return;
    try {
      await deactivateMutation({ variables: { userId } });
      toast.success("Usuario desactivado");
      refetchUsers();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  };

  const users: User[] = usersData?.adminUsers || [];
  const assetMoversData = metricsData?.assetMovers;
  const movers: AssetMover[] = assetMoversData 
    ? [...(assetMoversData.topGainers ?? []), ...(assetMoversData.topLosers ?? []), ...(assetMoversData.mostTraded ?? [])]
    : [];
  const stocks: Asset[] = metricsData?.assetsByCategory || [];

  const activeUsers = users.filter(u => u.active).length;
  const adminUsers = users.filter(u => u.role === "ADMIN").length;
  const totalBalance = users.reduce((sum, u) => sum + (u.cashBalance || 0) + (u.lockedBalance || 0), 0);

  if (usersLoading && metricsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="panel p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow">Panel de administración</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Gestión de usuarios y métricas del sistema.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text/base">
              Administra roles, estado de cuentas y monitoriza métricas clave de la plataforma.
            </p>
          </div>
          <Button
            onClick={() => { refetchUsers(); refetchMetrics(); }}
            disabled={usersLoading || metricsLoading}
            className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-sm"
          >
            <Loader2 className={`mr-2 h-4 w-4 ${(usersLoading || metricsLoading) ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="panel border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-300/10">
                <Users className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Usuarios totales</p>
                <p className="text-2xl font-semibold text-white">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-300/10">
                <CheckCircle className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Usuarios activos</p>
                <p className="text-2xl font-semibold text-white">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-300/10">
                <Shield className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Administradores</p>
                <p className="text-2xl font-semibold text-white">{adminUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10">
                <TrendingUp className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Símbolos STOCKS</p>
                <p className="text-2xl font-semibold text-white">{stocks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="panel border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-300/10">
                <Server className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Balance total</p>
                <p className="text-2xl font-semibold text-white">${totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
          <TabsTrigger value="users" className="data-[state=active]:bg-white/5 data-[state=active]:text-emerald-300">
            <Users className="mr-2 h-4 w-4" /> Usuarios
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-white/5 data-[state=active]:text-emerald-300">
            <BarChart3 className="mr-2 h-4 w-4" /> Métricas mercado
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white/5 data-[state=active]:text-emerald-300">
            <Activity className="mr-2 h-4 w-4" /> Sistema
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          {usersError && (
            <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
              <h2 className="text-lg font-semibold">Error al cargar usuarios</h2>
              <p className="mt-2 text-sm">{usersError.message}</p>
            </div>
          )}

          <Card className="panel border-white/10">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                <Users className="h-5 w-5 text-emerald-300" />
                Usuarios registrados ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-4 pt-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Usuario</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Email</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Rol</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Estado</TableHead>
                      <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Registrado</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400 pr-6">Balance</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400 pr-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell colSpan={7} className="px-6 py-16 text-center text-sm text-slate-400">
                          No hay usuarios registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="border-white/10 hover:bg-white/[0.03]">
                          <TableCell className="px-6 font-medium text-white">{user.username}</TableCell>
                          <TableCell className="font-mono text-sm text-slate-300">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.role === "ADMIN"
                                  ? "bg-emerald-300/15 text-emerald-200 border-emerald-300/30"
                                  : "bg-white/10 text-slate-300 border-white/20"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                user.active
                                  ? "bg-emerald-300/15 text-emerald-200 border-emerald-300/30"
                                  : "bg-red-400/15 text-red-200 border-red-400/30"
                              }
                            >
                              {user.active ? "Activo" : "Desactivado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-ES") : "—"}
                          </TableCell>
                          <TableCell className="pr-6 text-right font-mono text-sm text-slate-300">
                            ${((user.cashBalance || 0) + (user.lockedBalance || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetRole(user.id, user.role)}
                                disabled={settingRole || !user.active}
                                className="h-8 rounded-xl border-white/10 bg-white/[0.03] text-xs text-slate-200 hover:bg-white/[0.06]"
                              >
                                {user.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                              </Button>
                              {user.active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeactivate(user.id)}
                                  disabled={deactivating}
                                  className="h-8 rounded-xl border-red-400/20 bg-red-500/10 text-xs text-red-200 hover:bg-red-500/20"
                                >
                                  Desactivar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          {metricsError && (
            <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
              <h2 className="text-lg font-semibold">Error al cargar métricas</h2>
              <p className="mt-2 text-sm">{metricsError.message}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="panel border-white/10">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                  <TrendingUp className="h-5 w-5 text-emerald-300" />
                  Top Movers (Volatilidad)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-4 pt-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Símbolo</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Nombre</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400">Precio</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400">Cambio %</TableHead>
                        <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400">Volumen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movers.length === 0 ? (
                        <TableRow className="border-white/10">
                          <TableCell colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                            No hay datos de movers
                          </TableCell>
                        </TableRow>
                      ) : (
                        movers.map((mover) => (
                          <TableRow key={mover.symbol} className="border-white/10 hover:bg-white/[0.03]">
                            <TableCell className="px-6 font-medium text-white">{mover.symbol}</TableCell>
                            <TableCell className="text-sm text-slate-300">{mover.name}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-slate-300">${mover.price?.toFixed(2) ?? "—"}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              <span className={mover.changePercent && mover.changePercent >= 0 ? "text-emerald-300" : "text-red-300"}>
                                {mover.changePercent ? `${mover.changePercent >= 0 ? "+" : ""}${mover.changePercent.toFixed(2)}%` : "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-slate-300">
                              {mover.volume ? mover.volume.toLocaleString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="panel border-white/10 sm:col-span-2">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Database className="h-5 w-5 text-blue-300" />
                  Activos STOCKS disponibles ({stocks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-4 pt-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Símbolo</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Nombre</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Categoría</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stocks.slice(0, 20).map((stock) => (
                        <TableRow key={stock.symbol} className="border-white/10 hover:bg-white/[0.03]">
                          <TableCell className="px-6 font-medium text-white">{stock.symbol}</TableCell>
                          <TableCell className="text-sm text-slate-300">{stock.name}</TableCell>
                          <TableCell className="text-sm text-slate-400">
                            <Badge className="bg-blue-300/15 text-blue-200 border-blue-300/30">{stock.category}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {stocks.length > 20 && (
                        <TableRow className="border-white/10">
                          <TableCell colSpan={3} className="px-6 py-4 text-center text-sm text-slate-400">
                            ... y {stocks.length - 20} más
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="panel border-white/10">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Server className="h-5 w-5 text-cyan-300" />
                  Estado de servicios
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <CheckCircle className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Portfolio Manager</p>
                        <p className="text-sm text-slate-400">Spring Boot 3.2.2</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <CheckCircle className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Data Collector</p>
                        <p className="text-sm text-slate-400">FastAPI + yfinance</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <Database className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">PostgreSQL (TimescaleDB)</p>
                        <p className="text-sm text-slate-400">Puerto 5432</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <Database className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Redis</p>
                        <p className="text-sm text-slate-400">Puerto 6379</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <BarChart3 className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Prometheus</p>
                        <p className="text-sm text-slate-400">Puerto 9090</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-300/10">
                        <BarChart3 className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Grafana</p>
                        <p className="text-sm text-slate-400">Puerto 3001</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-300/15 text-emerald-200 border-emerald-300/30">HEALTHY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="panel border-white/10 sm:col-span-2 lg:col-span-2">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Activity className="h-5 w-5 text-amber-300" />
                  Endpoints clave
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="px-6 text-xs uppercase tracking-[0.22em] text-slate-400">Servicio</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Endpoint</TableHead>
                        <TableHead className="text-xs uppercase tracking-[0.22em] text-slate-400">Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Portfolio Manager</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/actuator/health/readiness</TableCell>
                        <TableCell className="text-sm text-slate-400">Health check k8s readiness</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Portfolio Manager</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/actuator/prometheus</TableCell>
                        <TableCell className="text-sm text-slate-400">Métricas Prometheus (JVM, HTTP, DB)</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Portfolio Manager</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/graphql</TableCell>
                        <TableCell className="text-sm text-slate-400">GraphQL API (dashboard, explorer)</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Data Collector</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/health</TableCell>
                        <TableCell className="text-sm text-slate-400">Health check simple</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Data Collector</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/price/history/&lbrace;symbol&rbrace;?days=30</TableCell>
                        <TableCell className="text-sm text-slate-400">OHLCV + fundamentals (yfinance)</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Prometheus</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/-/healthy</TableCell>
                        <TableCell className="text-sm text-slate-400">Health check Prometheus</TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/[0.03]">
                        <TableCell className="px-6 font-medium text-white">Grafana</TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">/api/health</TableCell>
                        <TableCell className="text-sm text-slate-400">Health check Grafana</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="panel border-white/10 sm:col-span-2 lg:col-span-2">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
                  <AlertCircle className="h-5 w-5 text-amber-300" />
                  Acciones rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open("https://grafana.capitalfourge.com", "_blank")}
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-sm"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Abrir Grafana
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open("https://api.capitalfourge.com/actuator/prometheus", "_blank")}
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-sm"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Ver métricas Prometheus
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetchMetrics()}
                    disabled={metricsLoading}
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-sm"
                  >
                    <TrendingUp className={`mr-2 h-4 w-4 ${metricsLoading ? "animate-spin" : ""}`} />
                    Refrescar métricas mercado
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetchUsers()}
                    disabled={usersLoading}
                    className="h-10 rounded-xl border-white/10 bg-white/[0.03] text-sm"
                  >
                    <Users className={`mr-2 h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                    Refrescar usuarios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}