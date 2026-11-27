import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BookOpen, Check, Clapperboard, GraduationCap, Headset, MessageSquareText, PenLine, Share2, Sparkles, Wand2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Respostas, Skill } from "@/lib/tipos"
import { Ajuda } from "./Ajuda"

const ICONES: Record<string, typeof BookOpen> = {
  "Vídeo e roteiro": Clapperboard, "Redes sociais": Share2, "Texto e escrita": PenLine, Produtividade: MessageSquareText,
  Aprender: GraduationCap, "Usar melhor o Claude": Wand2, "Atendimento e vendas": Headset,
}

/** Recomendadas: as que servem para todo mundo + as que batem com as áreas ou as tarefas da pessoa. */
export function skillsRecomendadas(lista: Skill[], r: Respostas) {
  const areas = new Set([].concat((r.area as never) ?? []))
  const tarefas = new Set([].concat((r.tarefas as never) ?? []))
  return lista.filter((s) => s.todos || s.areas.some((a) => areas.has(a as never)) || s.tarefas.some((t) => tarefas.has(t as never))).map((s) => s.id)
}

type Props = { lista: Skill[]; escolhidas: Set<string>; setEscolhidas: (s: Set<string>) => void; respostas: Respostas }

export function Skills({ lista, escolhidas, setEscolhidas, respostas }: Props) {
  const recomendadas = useMemo(() => new Set(skillsRecomendadas(lista, respostas)), [lista, respostas])
  const categorias = useMemo(() => [...new Set(lista.map((s) => s.categoria))], [lista])
  const [filtro, setFiltro] = useState<string | null>(null)
  const visiveis = lista.filter((s) => !filtro || s.categoria === filtro)

  const alternar = (id: string) => {
    const n = new Set(escolhidas)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setEscolhidas(n)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Filtro on={filtro === null} onClick={() => setFiltro(null)}>Todas ({lista.length})</Filtro>
          {categorias.map((c) => {
            const Icone = ICONES[c] ?? BookOpen
            return <Filtro key={c} on={filtro === c} onClick={() => setFiltro(c)}><Icone className="size-3.5" /> {c}</Filtro>
          })}
        </div>
        <div className="flex items-center gap-2">
          <Ajuda titulo="Como usar uma skill">Depois de instalar, digite <b>/</b> e o nome no Claude, seguido do pedido. Ex.: <b>/roteiro-video Reels sobre o meu produto</b>. O Claude também usa a skill sozinho quando o pedido combina com ela. Elas ficam em ~/.claude/skills e não pesam no seu limite até serem usadas.</Ajuda>
          <Button size="sm" variant="outline" onClick={() => setEscolhidas(new Set(recomendadas))}><Sparkles /> Só as recomendadas</Button>
          <Button size="sm" variant="ghost" onClick={() => setEscolhidas(new Set(lista.map((s) => s.id)))}>Todas</Button>
          <Button size="sm" variant="ghost" onClick={() => setEscolhidas(new Set())}>Nenhuma</Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground"><b className="text-foreground">{escolhidas.size}</b> de {lista.length} marcadas · as com <Sparkles className="inline size-3.5 text-primary" /> combinam com o que você respondeu.</p>

      <motion.div layout className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        <AnimatePresence mode="popLayout">
          {visiveis.map((s, i) => {
            const on = escolhidas.has(s.id)
            const Icone = ICONES[s.categoria] ?? BookOpen
            return (
              <motion.button key={s.id} type="button" layout aria-pressed={on} onClick={() => alternar(s.id)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.02, type: "spring", stiffness: 400, damping: 30 }}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                className={cn("relative flex flex-col gap-2 rounded-2xl border bg-card p-4 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50", on && "border-primary bg-primary/10")}>
                <div className="flex items-start gap-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors", on && "bg-primary text-primary-foreground")}><Icone className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-medium leading-tight">{s.nome}{recomendadas.has(s.id) && <Sparkles className="size-3.5 shrink-0 text-primary" aria-label="recomendada" />}</div>
                    <code className="text-xs text-primary">/{s.id}</code>
                  </div>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border transition-colors", on && "border-primary bg-primary text-primary-foreground")}>{on && <Check className="size-3.5" />}</span>
                </div>
                <p className="text-sm text-foreground/85">{s.resumo}</p>
                <p className="line-clamp-2 rounded-lg bg-muted/50 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground">{s.exemplo}</p>
                <Badge variant="outline" className="w-fit text-[10px]">{s.categoria}</Badge>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function Filtro({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-primary bg-primary/15" : "text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
      {children}
    </button>
  )
}
