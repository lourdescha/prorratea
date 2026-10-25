import Link from "next/link";
import { Logo } from "@/components/marca/logo";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-8">
          <Link href="/proyectos/nuevo" aria-label="Prorratea — inicio">
            <Logo />
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
