"use client";

import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
    }
  }
`;

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const [login, { loading }] = useMutation(LOGIN_MUTATION, {
        onCompleted: (data) => {
            localStorage.setItem("access_token", data.login.token);
            toast.success("¡Bienvenido de nuevo!");
            router.push("/dashboard");
        },
        onError: (error) => {
            toast.error("Error al iniciar sesión: " + error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login({ variables: { email, password } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md glass border-white/5">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tighter">INICIAR_SESIÓN</CardTitle>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Acceso a terminal segura</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-slate-500">Email</label>
                            <Input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/5 border-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-slate-500">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-white/10"
                                required
                            />
                        </div>
                        <Button
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-slate-200 mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "INGRESAR"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            ¿No tienes cuenta? <Link href="/register" className="text-white hover:underline">Regístrate</Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}