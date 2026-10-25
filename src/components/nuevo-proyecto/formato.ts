const usdFmt = new Intl.NumberFormat("es-PE", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const penFmt = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: 1 });

export const usd = (v: number) => usdFmt.format(v);
export const pen = (v: number) => penFmt.format(v);
export const num = (v: number) => numFmt.format(v);
export const pct = (v: number) => pctFmt.format(v);
export const factor = (v: number) => v.toFixed(4);
