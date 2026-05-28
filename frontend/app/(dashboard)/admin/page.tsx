"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import { User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default function AdminPage() {
  const { data, loading, error, refetch } = useQuery(ADMIN_USERS_QUERY, {
    fetchPolicy: "network-only",
  });
  const [setRoleMutation, { loading: settingRole }] = useMutation(ADMIN_SET_ROLE_MUTATION);
  const [deactivateMutation, { loading: deactivating }] = useMutation(ADMIN_DEACTIVATE_MUTATION);

  const handleSetRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try {
      await setRoleMutation({ variables: { userId, role: newRole } });
      toast.success(`Rol actualizado a ${newRole}`);
      refetch();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return;
    try {
      await deactivateMutation({ variables: { userId } });
      toast.success("Usuario desactivado");
      refetch();
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-8 text-red-200">
        <h2 className="text-lg font-semibold">Error al cargar usuarios</h2>
        <p className="mt-2 text-sm">{error.message}</p>
      </div>
    );
  }

  const users: User[] = data?.adminUsers || [];

  return (
    <div className="space-y-6">
      <section className="panel p-6 sm:p-7">
        <p className="eyebrow">Panel de administración</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
          Gestión de usuarios.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          Administra roles y estado de cuentas de usuarios registrados en la plataforma.
        </p>
      </section>

      <Card className="panel border-white/10">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <UserIcon className="h-5 w-5 text-emerald-300" />
            Usuarios registrados
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
                  <TableHead className="text-right text-xs uppercase tracking-[0.22em] text-slate-400 pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="px-6 py-16 text-center text-sm text-slate-400">
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
    </div>
  );
}