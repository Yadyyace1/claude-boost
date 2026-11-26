import { AlertTriangle, CheckCircle2, Info, PowerOff, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { iconeCategoria } from "@/lib/icones"
import { brl, num } from "@/lib/motor"
import type { Avaliado } from "@/lib/tipos"

export function SeloCusto({ a }: { a: Avaliado }) {
  const c = a.item.custo ?? { tipo: "gratis" }
  if (c.tipo === "pago") return <Badge variant="outline" className="border-amber-500/40 text-amber-400">{c.mensal_brl ? `~${brl(c.mensal_brl)}/mês` : "pago"}</Badge>
  if (c.tipo === "freemium") return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">grátis com limites</Badge>
  return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">grátis</Badge>
}

export function SeloOrigem({ a }: { a: Avaliado }) {
  const it = a.item
  return <Badge variant="secondary">{it.oficial ? "oficial" : it.kit ? "do kit" : "comunidade"}</Badge>
}

type Props = { a: Avaliado; marcado: boolean; alternar: () => void; detalhes: () => void }

export function ItemCard({ a, marcado, alternar, detalhes }: Props) {
  const it = a.item
  const Icone = iconeCategoria(it.categoria)
  return (
    <div
      role="checkbox"
      aria-checked={marcado}
      tabIndex={0}
      onClick={alternar}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); alternar() } }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all cursor-pointer outline-none",
        "hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        marcado && "border-primary/70 bg-primary/[0.06] hover:border-primary",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground", marcado && "bg-primary/15 text-primary")}>
          <Icone className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-tight">{it.nome}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{it.categoria}</div>
        </div>
        <Checkbox checked={marcado} tabIndex={-1} aria-hidden className="mt-0.5 pointer-events-none" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{it.resumo}</p>

      <div className="flex flex-wrap gap-1.5">
        <SeloCusto a={a} />
        <Badge variant="outline">{it.tokens_fixos ? `${num(it.tokens_fixos)} tokens/sessão` : "não pesa no uso"}</Badge>
        <SeloOrigem a={a} />
        {a.instalado && <Badge variant="outline" className="border-emerald-500/30 text-emerald-400"><CheckCircle2 /> já instalado</Badge>}
        {a.desligado && <Badge variant="outline"><PowerOff /> desligado até precisar</Badge>}
      </div>

      {a.motivos.length > 0 && (
        <p className="flex gap-1.5 text-xs text-foreground/80"><Sparkles className="size-3.5 shrink-0 mt-px text-primary" />{a.motivos.join(" · ")}</p>
      )}

      <div className="mt-auto flex items-end justify-between gap-2">
        {a.avisos[0] ? (
          <p className="flex gap-1.5 text-xs text-amber-400/90 line-clamp-2"><AlertTriangle className="size-3.5 shrink-0 mt-px" />{a.avisos[0]}</p>
        ) : <span />}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 -mr-2 -mb-1 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); detalhes() }}
        >
          <Info /> Detalhes
        </Button>
      </div>
    </div>
  )
}
