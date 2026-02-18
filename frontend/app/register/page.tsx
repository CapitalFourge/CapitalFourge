"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validación de contraseña: Min 8, 1 Mayus, 1 Num
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            toast.error("Contraseña insegura", {
                description: "Debe tener al menos 8 caracteres, una mayúscula y un número."
            });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            if (res.ok) {
                toast.success("¡Cuenta creada! Ya puedes iniciar sesión.");
                router.push("/login");
            } else {
                const errorData = await res.json().catch(() => ({}));
                toast.error(errorData.message || "Error al crear cuenta");
            }
        } catch {
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="absolute inset-0 bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md glass border-white/5">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tighter">CREAR_CUENTA</CardTitle>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Únete a la terminal quant</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-slate-500">Username</label>
                            <Input
                                placeholder="usuario123"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-white/5 border-white/10"
                                required
                            />
                        </div>
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
                            <p className="text-[10px] text-slate-500 italic">
                                Min. 8 caracteres, una mayúscula y un número.
                            </p>
                        </div>
                        <Button
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-slate-200 mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "CREAR CUENTA"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            ¿Ya tienes cuenta? <Link href="/login" className="text-white hover:underline">Entrar</Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}