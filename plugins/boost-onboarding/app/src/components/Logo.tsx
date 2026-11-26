import { cn } from "@/lib/utils"

// A faísca do Spark: o mesmo desenho do ícone do instalador (instalador/gerar_icone.py).
// Estrela de quatro pontas com lados côncavos, mais uma faísca pequena acima à direita.
function faisca(cx: number, cy: number, r: number) {
  const k = r * 0.14
  return `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`
}
const FAISCAS = faisca(470, 560, 330) + faisca(770, 260, 120)

/** Só a faísca, na cor do texto (currentColor): para botões e selos. */
export function Faisca({ className }: { className?: string }) {
  return (
    <svg viewBox="130 130 780 780" className={cn("size-4", className)} aria-hidden="true">
      <path d={FAISCAS} fill="currentColor" />
    </svg>
  )
}

/** O logo completo: faísca âmbar num quadrado escuro arredondado. */
export function LogoSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-8", className)} role="img" aria-label="Spark">
      <defs>
        <linearGradient id="spark-fundo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E2922" />
          <stop offset="1" stopColor="#141311" />
        </linearGradient>
        <linearGradient id="spark-cor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FACE6E" />
          <stop offset="1" stopColor="#D68A1E" />
        </linearGradient>
        <filter id="spark-brilho" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="45" />
        </filter>
      </defs>
      <rect x="40" y="40" width="944" height="944" rx="210" fill="url(#spark-fundo)" stroke="#E0A33B" strokeOpacity=".35" strokeWidth="10" />
      <path d={FAISCAS} fill="#E0A33B" opacity=".55" filter="url(#spark-brilho)" />
      <path d={FAISCAS} fill="url(#spark-cor)" />
    </svg>
  )
}
