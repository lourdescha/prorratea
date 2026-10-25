import { Suspense } from "react";
import { FormularioLogin } from "@/components/auth/formulario-login";
import { Logo } from "@/components/marca/logo";
import { rutaInterna } from "@/lib/ruta-interna";

type Props = { searchParams: Promise<{ next?: string }> };

export default function LoginPage({ searchParams }: Props) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <Logo />
      <Suspense>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Formulario({ searchParams }: Props) {
  const { next } = await searchParams;
  return <FormularioLogin siguiente={rutaInterna(next)} />;
}
