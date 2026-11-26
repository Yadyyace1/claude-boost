import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Compass, Heart, Info, Sparkles, Undo2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { iconeCategoria } from "@/lib/icones"
import { num } from "@/lib/motor"
import { match, proxima, type Escolha } from "@/lib/descoberta"
import type { Avaliado } from "@/lib/tipos"
import { SeloCusto, SeloOrigem } from "./ItemCard"

type Props = {
  cartas: Avaliado[]
  escolhas: Escolha[]
  escolher: (e: Escolha) => void
  desfazer: () => void
  detalhes: (a: Avaliado) => void
}

const LIMIAR = 110

export function Descobrir({ cartas, escolhas, escolher, desfazer, detalhes }: Props) {
  const atual = useMemo(() => proxima(cartas, escolhas), [cartas, escolhas])
  const depois = useMemo(() => (atual ? proxima(cartas, [...escolhas, { id: atual.carta.item.id, quer: false }]) : null), [cartas, escolhas, atual])
  const [arraste, setArraste] = useState({ dx: 0, dy: 0, ativo: false })
  const [saindo, setSaindo] = useState<null | "dir" | "esq">(null)
  const inicio = useRef<{ x: number; y: number } | null>(null)

  function decidir(quer: boolean) {
    if (!atual || saindo) return
    setSaindo(quer ? "dir" : "esq")
    window.setTimeout(() => {
      escolher({ id: atual.carta.item.id, quer })
      setSaindo(null)
      setArraste({ dx: 0, dy: 0, ativo: false })
    }, 220)
  }

  useEffect(() => {
    const tecla = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement)?.tagName === "INPUT") return
      if (ev.key === "ArrowRight") decidir(true)
      if (ev.key === "ArrowLeft") decidir(false)
      if (ev.key === "Backspace" || (ev.key === "z" && (ev.ctrlKey || ev.metaKey))) desfazer()
    }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  })

  const melhor = useMemo(() => Math.max(1, ...cartas.map((c) => c.nota)), [cartas])
  const quero = escolhas.filter((e) => e.quer).length
  const pulei = escolhas.length - quero
  const total = cartas.length

  if (!total) {
    return <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Não sobrou nada para descobrir: a sua seleção já cobre tudo o que combina com você.</p>
  }

  const { dx, dy, ativo } = arraste
  const desloc = saindo === "dir" ? 700 : saindo === "esq" ? -700 : dx
  const forca = Math.min(1, Math.abs(dx) / LIMIAR)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="flex flex-col items-center gap-6">
        <div className="flex w-full max-w-md items-center justify-between text-sm text-muted-foreground">
          <span>Carta {Math.min(escolhas.length + 1, total)} de {total}</span>
          <span className="flex gap-3"><span className="text-emerald-400">✓ {quero}</span><span>✗ {pulei}</span></span>
        </div>

        <div className="relative h-[440px] w-full max-w-md select-none">
          {!atual && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl border border-dashed text-center p-8">
              <div className="space-y-2">
                <Sparkles className="mx-auto size-8 text-primary" />
                <p className="font-medium">Você viu todas as cartas!</p>
                <p className="text-sm text-muted-foreground">{quero ? `${quero} entraram na sua seleção.` : "Nenhuma entrou: tudo bem."} Siga para a revisão.</p>
              </div>
            </div>
          )}

          {depois && (
            <Carta a={depois.carta} nota={depois.nota} melhor={melhor} className="absolute inset-0 scale-[0.95] translate-y-3 opacity-60" />
          )}

          {atual && (
            <div
              key={atual.carta.item.id}
              className={cn("absolute inset-0 touch-none", !ativo && "transition-transform duration-200")}
              style={{ transform: `translate(${desloc}px, ${dy}px) rotate(${desloc / 18}deg)` }}
              onPointerDown={(ev) => {
                (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId)
                inicio.current = { x: ev.clientX, y: ev.clientY }
                setArraste({ dx: 0, dy: 0, ativo: true })
              }}
              onPointerMove={(ev) => {
                if (!inicio.current) return
                setArraste({ dx: ev.clientX - inicio.current.x, dy: (ev.clientY - inicio.current.y) * 0.3, ativo: true })
              }}
              onPointerUp={() => {
                inicio.current = null
                if (dx > LIMIAR) decidir(true)
                else if (dx < -LIMIAR) decidir(false)
                else setArraste({ dx: 0, dy: 0, ativo: false })
              }}
            >
              <Carta a={atual.carta} nota={atual.nota} melhor={melhor} explorando={atual.explorando} onDetalhes={() => detalhes(atual.carta)} />
              <span className="pointer-events-none absolute left-5 top-5 rotate-[-12deg] rounded-lg border-2 border-emerald-400 px-3 py-1 text-lg font-bold text-emerald-400" style={{ opacity: dx > 0 ? forca : 0 }}>QUERO</span>
              <span className="pointer-events-none absolute right-5 top-5 rotate-[12deg] rounded-lg border-2 border-rose-400 px-3 py-1 text-lg font-bold text-rose-400" style={{ opacity: dx < 0 ? forca : 0 }}>PULAR</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button size="icon-lg" variant="outline" className="size-14 rounded-full border-rose-400/50 text-rose-400 hover:bg-rose-400/10" onClick={() => decidir(false)} disabled={!atual} aria-label="Pular (seta para a esquerda)"><X className="size-6" /></Button>
          <Button size="icon" variant="ghost" className="rounded-full" onClick={desfazer} disabled={!escolhas.length} aria-label="Desfazer a última"><Undo2 /></Button>
          <Button size="icon-lg" className="size-14 rounded-full bg-emerald-500 text-white hover:bg-emerald-500/90" onClick={() => decidir(true)} disabled={!atual} aria-label="Quero (seta para a direita)"><Heart className="size-6" /></Button>
        </div>
        <p className="text-xs text-muted-foreground">Arraste a carta, use os botões ou as setas ← →. Errou? Desfaça.</p>
      </div>

      <aside className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5"><Compass className="size-4 text-primary" /> Como funciona</h3>
        <p className="text-sm text-muted-foreground">Cada "quero" ensina o algoritmo do que você gosta: as próximas cartas parecidas sobem, e as parecidas com o que você pulou descem. De vez em quando aparece uma carta de outro assunto, para você descobrir algo novo.</p>
        {quero > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Entraram na seleção</h3>
            <div className="flex flex-wrap gap-1.5">
              {escolhas.filter((e) => e.quer).map((e) => {
                const c = cartas.find((x) => x.item.id === e.id)
                return c ? <Badge key={e.id} variant="outline" className="border-emerald-500/40"><Check className="text-emerald-400" />{c.item.nome}</Badge> : null
              })}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function Carta({ a, nota, melhor, explorando, className, onDetalhes }: { a: Avaliado; nota: number; melhor: number; explorando?: boolean; className?: string; onDetalhes?: () => void }) {
  const it = a.item
  const Icone = iconeCategoria(it.categoria)
  const m = match(nota, melhor)
  return (
    <div className={cn("flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xl shadow-black/20", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary"><Icone className="size-7" /></span>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-primary">{m}%</div>
          <div className="text-xs text-muted-foreground">de match</div>
        </div>
      </div>
      <div>
        {explorando && <Badge className="mb-2"><Sparkles /> novidade para você</Badge>}
        <h3 className="text-2xl font-semibold leading-tight">{it.nome}</h3>
        <p className="text-sm text-muted-foreground">{it.categoria}</p>
      </div>
      <p className="text-[15px] leading-relaxed">{it.resumo}</p>
      <div className="flex flex-wrap gap-1.5">
        <SeloCusto a={a} />
        <Badge variant="outline">{it.tokens_fixos ? `${num(it.tokens_fixos)} tokens/sessão` : "não pesa no uso"}</Badge>
        <SeloOrigem a={a} />
      </div>
      {a.motivos.length > 0 && <p className="text-sm text-foreground/80"><Sparkles className="mr-1 inline size-3.5 text-primary" />{a.motivos.join(" · ")}</p>}
      <div className="mt-auto flex items-end justify-between gap-2">
        <span className="text-xs text-amber-400/90 line-clamp-2">{a.avisos[0] ?? ""}</span>
        {onDetalhes && (
          <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" onPointerDown={(e) => e.stopPropagation()} onClick={onDetalhes}><Info /> Detalhes</Button>
        )}
      </div>
    </div>
  )
}
