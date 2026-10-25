"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/services/supabase/client";

export function BotonCerrarSesion() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  // Sin Supabase configurado (modo local de desarrollo) no hay sesión que cerrar
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const cerrarSesion = async () => {
    setSaliendo(true);
    const { error } = await createClient().auth.signOut();
    if (error) {
      setSaliendo(false);
      toast.error("No se pudo cerrar la sesión", { description: error.message });
      return;
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cerrarSesion}
      disabled={saliendo}
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      {saliendo ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
      Cerrar sesión
    </Button>
  );
}
