"use client";

import { FleteSeguro } from "./flete-seguro";
import { LiquidacionAduana } from "./liquidacion-aduana";
import { ListaGastos } from "./lista-gastos";

export function PasoGastosTributos() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <FleteSeguro />
        <ListaGastos />
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <LiquidacionAduana />
      </div>
    </div>
  );
}
