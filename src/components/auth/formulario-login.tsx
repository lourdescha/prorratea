"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/services/supabase/client";

type Modo = "ingresar" | "registrarse";

/** Email + contraseña con Supabase Auth. El registro envía un correo de confirmación. */
export function FormularioLogin({ siguiente }: { siguiente: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("ingresar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setAviso(null);
    const supabase = createClient();

    if (modo === "ingresar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(
          error.code === "email_not_confirmed"
            ? "Confirma tu correo antes de ingresar (revisa tu bandeja de entrada)."
            : "Correo o contraseña incorrectos.",
        );
        setCargando(false);
        return;
      }
      router.replace(siguiente);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(siguiente)}`,
      },
    });
    setCargando(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      // Proyecto con confirmación de correo desactivada: entra directo
      router.replace(siguiente);
      router.refresh();
      return;
    }
    setAviso(`Te enviamos un enlace de confirmación a ${email}.`);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{modo === "ingresar" ? "Ingresar" : "Crear cuenta"}</CardTitle>
        <CardDescription>Accede a tus operaciones de importación</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete={modo === "ingresar" ? "current-password" : "new-password"}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {aviso && (
            <Alert>
              <AlertDescription>{aviso}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando && <Loader2Icon className="animate-spin" />}
            {modo === "ingresar" ? "Ingresar" : "Crear cuenta"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => {
              setModo(modo === "ingresar" ? "registrarse" : "ingresar");
              setError(null);
              setAviso(null);
            }}
          >
            {modo === "ingresar" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Ingresa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
