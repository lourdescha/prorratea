import Link from "next/link";
import { BotonCerrarSesion } from "@/components/auth/boton-cerrar-sesion";
import { Logo } from "@/components/marca/logo";
import { NavPrincipal } from "@/components/marca/nav-principal";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-8">
          <Link href="/" aria-label="Prorratea — inicio">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <NavPrincipal />
            <BotonCerrarSesion />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
