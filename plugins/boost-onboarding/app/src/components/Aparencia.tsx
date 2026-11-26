import { useState } from "react"
import { Check, LayoutDashboard, Moon, Palette, Plus, Sparkles, Sun, Wand2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CORES, PADROES, type Visual } from "@/lib/visual"
import type { Respostas } from "@/lib/tipos"

export type TemaPreview = {
  id: string
  nome: string
  descricao: string
  cena: string | null
  soEscuro: boolean
  escuro: { fundo: string; cartao: string; texto: string; suave: string }
  claro: { fundo: string; cartao: string; texto: string; suave: string } | null
  destaque: string
  extras: string[]
}

export type EscolhaAparencia = { tema: string | null; cenario: boolean; painel: boolean; abrirPainel: boolean; atalhos: string[] }

export const APARENCIA_PADRAO: EscolhaAparencia = { tema: "ambar", cenario: true, painel: true, abrirPainel: true, atalhos: [] }

const SUGESTOES: Record<string, string[]> = {
  base: ["Planejar o meu dia", "Resumir o que fiz hoje", "Sugerir o próximo passo do meu objetivo"],
  dev: ["Revisar a segurança deste projeto", "Explicar o que mudou no código hoje", "Escrever os testes que faltam"],
  stream: ["Preparar o roteiro da live de hoje", "Cortar os melhores momentos da última live", "Criar um overlay de 'já volto'"],
  marketing: ["Diagnosticar as campanhas da semana", "Criar 5 ganchos de anúncio", "Montar o relatório do cliente"],
  juridico: ["Revisar este contrato", "Resumir as novidades jurídicas da semana"],
  conteudo: ["Ideias de posts para a semana", "Legendar o último vídeo"],
  gestao: ["Resumir os e-mails importantes", "Organizar as tarefas da semana"],
  estudos: ["Criar flashcards do que estudei", "Resumir este artigo"],
  jogos: ["Ideias de mecânicas para o jogo", "Listar a arte que falta para a fase nova"],
  financas: ["Resumo do mercado hoje", "Organizar os gastos do mês"],
  design: ["Revisar este layout", "Gerar variações desta peça"],
}

export function sugestoesDeAtalho(r: Respostas) {
  const areas = ([] as string[]).concat((r.area as string[]) ?? [])
  return [...new Set([...areas.flatMap((a) => SUGESTOES[a] ?? []), ...SUGESTOES.base])]
}

type Props = {
  temas: TemaPreview[]
  ap: EscolhaAparencia
  setAp: (a: EscolhaAparencia) => void
  visual: Visual
  setVisual: (v: Visual) => void
  respostas: Respostas
}

export function Aparencia({ temas, ap, setAp, visual, setVisual, respostas }: Props) {
  const [novo, setNovo] = useState("")
  const sugestoes = sugestoesDeAtalho(respostas)
  const atalhos = ap.atalhos.length ? ap.atalhos : sugestoes.slice(0, 4)
  const mudar = (p: Partial<EscolhaAparencia>) => setAp({ ...ap, atalhos, ...p })
  const alternarAtalho = (t: string) => mudar({ atalhos: atalhos.includes(t) ? atalhos.filter((x) => x !== t) : [...atalhos, t].slice(0, 6) })
  const nome = typeof respostas.nome === "string" && respostas.nome ? respostas.nome : "você"
  const temaAtual = temas.find((t) => t.id === ap.tema)

  return (
    <div className="space-y-12 max-w-5xl">
      {/* 1. Tema do Claude */}
      <section className="space-y-4">
        <Cabecalho icone={Palette} titulo="Tema do seu Claude" sub="O visual do app do Claude depois da instalação. Dá para trocar a qualquer hora com /tema." />
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
          {temas.map((t) => {
            const on = ap.tema === t.id
            return (
              <button key={t.id} type="button" aria-pressed={on} onClick={() => mudar({ tema: t.id })}
                className={cn("group overflow-hidden rounded-2xl border bg-card text-left transition-all outline-none hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/50", on && "border-primary ring-2 ring-primary/40")}>
                <MiniJanela t={t} />
                <div className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{t.nome}</span>
                    {on && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.descricao}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.cena && <Badge variant="secondary"><Sparkles /> fundo animado</Badge>}
                    <Badge variant="outline">{t.soEscuro ? "só escuro" : "claro e escuro"}</Badge>
                  </div>
                </div>
              </button>
            )
          })}
          <button type="button" aria-pressed={ap.tema === null} onClick={() => mudar({ tema: null })}
            className={cn("grid place-items-center rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground transition-all hover:border-foreground/30", ap.tema === null && "border-primary text-foreground")}>
            <span className="space-y-2"><X className="mx-auto size-5" /> Manter o visual padrão do Claude</span>
          </button>
        </div>
        {temaAtual?.cena && (
          <div className="flex items-center gap-3">
            <Switch id="cenario" checked={ap.cenario} onCheckedChange={(v) => mudar({ cenario: v })} />
            <Label htmlFor="cenario">Fundo animado no tema {temaAtual.nome} (movimento lento; para quem pede menos movimento, fica parado)</Label>
          </div>
        )}
      </section>

      {/* 2. Painel Hoje */}
      <section className="space-y-4">
        <Cabecalho icone={LayoutDashboard} titulo="Tela inicial como dashboard" sub="O painel Hoje fica ao lado do chat: saudação, uso do limite, atalhos de um clique e lembretes." />
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Switch id="painel" checked={ap.painel} onCheckedChange={(v) => mudar({ painel: v })} />
              <Label htmlFor="painel">Quero o painel Hoje</Label>
            </div>
            {ap.painel && (
              <>
                <div className="flex items-center gap-3">
                  <Switch id="abrir" checked={ap.abrirPainel} onCheckedChange={(v) => mudar({ abrirPainel: v })} />
                  <Label htmlFor="abrir">Abrir sozinho quando eu começar uma conversa</Label>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Atalhos de um clique <span className="text-muted-foreground font-normal">(até 6)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...sugestoes, ...atalhos])].map((s) => {
                      const on = atalhos.includes(s)
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => alternarAtalho(s)}
                          className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-primary bg-primary/10" : "bg-card text-muted-foreground hover:border-foreground/25")}>
                          {on ? <Check className="size-3.5 text-primary" /> : <Wand2 className="size-3.5" />}{s}
                        </button>
                      )
                    })}
                  </div>
                  <form className="flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); if (novo.trim()) { alternarAtalho(novo.trim()); setNovo("") } }}>
                    <Input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Escrever um atalho seu" className="h-9" />
                    <Button type="submit" variant="outline" size="lg"><Plus /> Adicionar</Button>
                  </form>
                </div>
              </>
            )}
          </div>
          {ap.painel && <MiniPainel nome={nome} atalhos={atalhos} />}
        </div>
      </section>

      {/* 3. Visual deste assistente */}
      <section className="space-y-4">
        <Cabecalho icone={Sun} titulo="Visual deste assistente" sub="Só muda esta tela de configuração. Fica salvo neste navegador." />
        <div className="flex flex-wrap gap-8">
          <div className="space-y-2">
            <p className="text-sm font-medium">Modo</p>
            <div className="flex gap-2">
              {(["escuro", "claro"] as const).map((m) => (
                <Button key={m} type="button" variant={visual.modo === m ? "default" : "outline"} onClick={() => setVisual({ ...visual, modo: m })}>
                  {m === "escuro" ? <Moon /> : <Sun />} {m === "escuro" ? "Escuro" : "Claro"}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Cor de destaque</p>
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button key={c.cor} type="button" title={c.nome} aria-label={c.nome} aria-pressed={visual.cor === c.cor} onClick={() => setVisual({ ...visual, cor: c.cor })}
                  className={cn("size-8 rounded-full border-2 transition-transform hover:scale-110", visual.cor === c.cor ? "border-foreground" : "border-transparent")} style={{ background: c.cor }} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Fundo</p>
            <div className="flex gap-2">
              {PADROES.map((p) => (
                <Button key={p.id} type="button" size="sm" variant={visual.padrao === p.id ? "default" : "outline"} onClick={() => setVisual({ ...visual, padrao: p.id })}>{p.nome}</Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Cabecalho({ icone: Icone, titulo, sub }: { icone: typeof Palette; titulo: string; sub: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><Icone className="size-[18px]" /></span>
      <div><h2 className="text-lg font-medium">{titulo}</h2><p className="text-sm text-muted-foreground">{sub}</p></div>
    </div>
  )
}

/** Uma janela de chat em miniatura nas cores do tema: escura à esquerda, clara à direita. */
function MiniJanela({ t }: { t: TemaPreview }) {
  const lados = t.claro ? [t.escuro, t.claro] : [t.escuro]
  return (
    <div className="flex h-28">
      {lados.map((c, i) => (
        <div key={i} className="relative flex-1 space-y-1.5 p-3" style={{ background: c.fundo }}>
          {t.cena && i === 0 && <div className="absolute inset-x-0 bottom-0 h-8 opacity-60" style={{ background: `linear-gradient(transparent, ${t.destaque}55)` }} />}
          <div className="ml-auto h-3 w-2/3 rounded-md" style={{ background: t.destaque, opacity: 0.85 }} />
          <div className="space-y-1 rounded-md p-1.5" style={{ background: c.cartao }}>
            <div className="h-1.5 w-11/12 rounded" style={{ background: c.texto, opacity: 0.85 }} />
            <div className="h-1.5 w-3/4 rounded" style={{ background: c.suave, opacity: 0.8 }} />
            <div className="flex gap-1 pt-0.5">{t.extras.map((x) => <span key={x} className="h-1.5 w-4 rounded" style={{ background: x }} />)}</div>
          </div>
          <div className="absolute inset-x-3 bottom-2 h-3 rounded-md border" style={{ borderColor: `${c.suave}66`, background: c.cartao }} />
        </div>
      ))}
    </div>
  )
}

/** Prévia do painel Hoje como ele aparece ao lado do chat. */
function MiniPainel({ nome, atalhos }: { nome: string; atalhos: string[] }) {
  const hora = new Date().getHours()
  const ola = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4 text-sm shadow-lg shadow-black/10">
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Painel</span><span className="font-medium text-foreground">Hoje</span></div>
      <div><div className="font-semibold">{ola}, {nome}!</div><div className="text-xs text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div></div>
      <div className="space-y-2">
        {[["Contexto da conversa", 34], ["Limite de 5 horas", 22], ["Limite da semana", 41]].map(([r, v]) => (
          <div key={r as string} className="space-y-1">
            <div className="flex justify-between text-xs"><span>{r}</span><span className="text-muted-foreground">{v}%</span></div>
            <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-medium">Atalhos</div>
        {atalhos.slice(0, 4).map((a) => <div key={a} className="truncate rounded-md border px-2 py-1 text-xs">{a}</div>)}
        {atalhos.length > 4 && <div className="text-xs text-muted-foreground">+{atalhos.length - 4}</div>}
      </div>
      <div className="space-y-1"><div className="text-xs font-medium">Lembretes</div><div className="text-xs text-muted-foreground">○ anote com /lembrete</div></div>
    </div>
  )
}
