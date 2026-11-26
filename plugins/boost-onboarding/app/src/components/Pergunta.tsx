import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { iconeOpcao } from "@/lib/icones"
import { AVATARES, Avatar } from "@/lib/avatares"
import type { Pergunta as P, Respostas } from "@/lib/tipos"

type Props = { q: P; respostas: Respostas; mudar: (id: string, v: Respostas[string]) => void; erro?: string }

export function Pergunta({ q, respostas, mudar, erro }: Props) {
  const valor = respostas[q.id]
  const lista = Array.isArray(valor) ? valor : valor != null ? [String(valor)] : []
  const cheio = q.tipo === "multi" && !!q.max && lista.length >= q.max

  function alternar(v: string) {
    if (q.tipo === "unico") return mudar(q.id, v)
    const s = new Set(lista)
    if (s.has(v)) s.delete(v)
    else {
      if (q.max && s.size >= q.max) return
      s.add(v)
    }
    mudar(q.id, [...s])
  }

  const temDescricao = q.opcoes?.some((o) => o.descricao)
  const formatar = (n: number) => `${q.prefixo ?? ""}${n}${q.sufixo ?? ""}`

  return (
    <section className="space-y-3" aria-labelledby={`t-${q.id}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={`t-${q.id}`} className="text-base font-medium">{q.titulo}</h2>
        {q.tipo === "multi" && (
          <span className={cn("text-xs shrink-0", cheio ? "text-primary" : "text-muted-foreground")}>
            {cheio ? "máximo marcado: desmarque uma para trocar" : lista.length ? `${lista.length} marcada${lista.length > 1 ? "s" : ""}` : q.max ? `até ${q.max}` : "marque quantas quiser"}
          </span>
        )}
      </div>

      {q.tipo === "texto" && (
        <Input className="max-w-xl h-11" placeholder={q.placeholder} value={(valor as string) ?? ""} onChange={(e) => mudar(q.id, e.target.value)} />
      )}

      {q.tipo === "avatar" && (
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={q.titulo}>
          {AVATARES.map((a) => {
            const on = valor === a.id
            return (
              <button key={a.id} type="button" role="radio" aria-checked={on} aria-label={a.nome} title={a.nome} onClick={() => mudar(q.id, a.id)}
                className={cn("rounded-full p-1 transition-all outline-none hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50", on ? "ring-2 ring-primary scale-110" : "opacity-80 hover:opacity-100")}>
                <Avatar id={a.id} className="size-12" />
              </button>
            )
          })}
        </div>
      )}

      {q.tipo === "faixa" && (
        <div className="rounded-xl border bg-card p-5 space-y-4 max-w-xl">
          <div className="text-3xl font-semibold text-primary tabular-nums">{formatar(Number(valor ?? q.padrao))}</div>
          <Slider min={q.min} max={q.max} step={q.passo} value={[Number(valor ?? q.padrao)]} onValueChange={(v) => mudar(q.id, v[0])} />
          {q.atalhos && (
            <div className="flex flex-wrap gap-2">
              {q.atalhos.map((v) => (
                <Button key={v} type="button" size="sm" variant={Number(valor ?? q.padrao) === v ? "default" : "outline"} onClick={() => mudar(q.id, v)}>
                  {v === 0 && q.prefixo ? "Só grátis" : formatar(v)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {(q.tipo === "multi" || q.tipo === "unico") && temDescricao && (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {q.opcoes!.map((o) => {
            const on = lista.includes(o.valor)
            const Icone = iconeOpcao(q.id, o.valor)
            const bloqueado = !on && cheio
            return (
              <button
                key={o.valor}
                type="button"
                aria-pressed={on}
                disabled={bloqueado}
                onClick={() => alternar(o.valor)}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all outline-none",
                  "hover:border-foreground/25 hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  on && "border-primary bg-primary/10 hover:border-primary",
                  bloqueado && "opacity-40 cursor-not-allowed hover:translate-y-0",
                )}
              >
                {Icone && (
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors", on && "bg-primary text-primary-foreground")}>
                    <Icone className="size-5" />
                  </span>
                )}
                <span className="min-w-0 pr-4">
                  <span className="block font-medium leading-tight">{o.rotulo}</span>
                  {o.descricao && <span className="block text-xs text-muted-foreground mt-1">{o.descricao}</span>}
                </span>
                {on && <Check className="absolute right-3 top-3 size-4 text-primary" />}
              </button>
            )
          })}
        </div>
      )}

      {(q.tipo === "multi" || q.tipo === "unico") && !temDescricao && (
        <div className="flex flex-wrap gap-2">
          {q.opcoes!.map((o) => {
            const on = lista.includes(o.valor)
            const Icone = iconeOpcao(q.id, o.valor)
            return (
              <button
                key={o.valor}
                type="button"
                aria-pressed={on}
                disabled={!on && cheio}
                onClick={() => alternar(o.valor)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors outline-none",
                  "hover:border-foreground/25 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  on ? "border-primary bg-primary/10 text-foreground" : "bg-card text-muted-foreground",
                )}
              >
                {on ? <Check className="size-4 text-primary" /> : Icone ? <Icone className="size-4" /> : null}
                {o.rotulo}
              </button>
            )
          })}
        </div>
      )}

      {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
    </section>
  )
}
