import { Gauge, Info, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { iconeCategoria, iconeOpcao } from "@/lib/icones"
import { brl } from "@/lib/motor"
import type { Item, Perfil, Perguntas, Respostas } from "@/lib/tipos"

/** Retrato do perfil: chips com ícone das respostas principais, para a pessoa se reconhecer na recomendação. */
export function PerfilResumo({ respostas, perguntas, perfil }: { respostas: Respostas; perguntas: Perguntas; perfil: Perfil }) {
  const rotulo = (id: string) => {
    for (const e of perguntas.etapas) for (const q of e.perguntas) if (q.id === id && q.opcoes) {
      return [].concat((respostas[id] ?? []) as never).map((v: string) => ({ v, r: q.opcoes!.find((o) => o.valor === v)?.rotulo })).filter((x) => x.r)
    }
    return []
  }
  const chips = [
    ...rotulo("area").map((x) => ({ id: "area", ...x })),
    ...rotulo("nivel").map((x) => ({ id: "nivel", ...x })),
    ...rotulo("plano").map((x) => ({ id: "plano", ...x, r: `Plano ${x.r}` })),
    ...rotulo("equipe").map((x) => ({ id: "equipe", ...x })),
    ...rotulo("preferencia").map((x) => ({ id: "preferencia", ...x })),
  ]
  return (
    <Card className="py-4">
      <CardContent className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Sparkles className="size-4 text-primary" /> Seu perfil</span>
        {chips.map((c) => {
          const Icone = iconeOpcao(c.id, c.v)
          return (
            <span key={`${c.id}-${c.v}`} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm">
              {Icone && <Icone className="size-3.5 text-primary" />}{c.r}
            </span>
          )
        })}
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm">{brl(perfil.orcamento)}/mês</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm", perfil.economiaAjustada ? "border-primary/50 bg-primary/10" : "bg-muted/40")}>
              <Gauge className="size-3.5 text-primary" /> Economia {perfil.economia === "alta" ? "alta" : perfil.economia === "media" ? "equilibrada" : "baixa"}
              {perfil.economiaAjustada && <Info className="size-3.5" />}
            </span>
          </TooltipTrigger>
          {perfil.economiaAjustada && <TooltipContent>Ajustamos para cima por causa do seu plano ou das horas de uso.</TooltipContent>}
        </Tooltip>
      </CardContent>
    </Card>
  )
}

/** "O que o seu Claude vai ganhar": uma peça por categoria, acendendo conforme a seleção. */
export function GanhosPorCategoria({ itens, todasCategorias }: { itens: Item[]; todasCategorias: string[] }) {
  const porCat = new Map<string, Item[]>()
  for (const it of itens) if (it.tipo !== "requisito") porCat.set(it.categoria, [...(porCat.get(it.categoria) ?? []), it])
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">O que o seu Claude vai ganhar</h3>
      <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(168px,1fr))]">
        {todasCategorias.map((cat) => {
          const lista = porCat.get(cat) ?? []
          const on = lista.length > 0
          const Icone = iconeCategoria(cat)
          return (
            <Tooltip key={cat}>
              <TooltipTrigger asChild>
                <div className={cn("flex items-center gap-2.5 rounded-xl border p-3 transition-all", on ? "border-primary/40 bg-primary/[0.07]" : "border-dashed opacity-45")}>
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <Icone className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-tight">{cat}</span>
                    <span className="block text-xs text-muted-foreground">{on ? `${lista.length} ${lista.length > 1 ? "itens" : "item"}` : "nada ainda"}</span>
                  </span>
                </div>
              </TooltipTrigger>
              {on && <TooltipContent className="max-w-60">{lista.map((i) => i.nome).join(", ")}</TooltipContent>}
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
