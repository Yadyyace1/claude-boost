import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, FileText, KeyRound, Loader2, LogIn, MousePointerClick, PartyPopper, Play, RotateCcw, SquareTerminal, Zap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { pegar, postar, type ItemPlano, type Plano, type ResultadoItem } from "@/lib/api"

type Status = "pendente" | "rodando" | "ok" | "erro" | "feito"

const temCmd = (it: ItemPlano) => it.passos.some((p) => p.tipo === "cmd" && p.comando)
const temManual = (it: ItemPlano) => it.passos.some((p) => p.tipo === "login" || p.tipo === "manual")
const segredosDe = (it: ItemPlano) => it.passos.filter((p) => p.tipo === "segredo").map((p) => p.variavel!)

const LINKS: [RegExp, string][] = [
  [/Configurações → Conectores|Conectores/, "https://claude.ai/settings/connectors"],
  [/platform\.tripo3d\.ai/, "https://platform.tripo3d.ai"],
  [/github\.com\/settings\/personal-access-tokens/, "https://github.com/settings/personal-access-tokens/new"],
  [/pixellab/i, "https://pixellab.ai"],
]

export function Instalacao({ nome }: { nome: string }) {
  const [plano, setPlano] = useState<Plano | null>(null)
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [saidas, setSaidas] = useState<Record<string, ResultadoItem>>({})
  const [segredos, setSegredos] = useState<Record<string, boolean>>({})
  const [valores, setValores] = useState<Record<string, string>>({})
  const [confirmarTudo, setConfirmarTudo] = useState(false)
  const [rodandoTudo, setRodandoTudo] = useState(false)
  const [mdAplicado, setMdAplicado] = useState(false)
  const [fim, setFim] = useState(false)

  useEffect(() => {
    pegar<Plano>("plano").then((p) => {
      if (!p) return
      setPlano(p)
      setSegredos(p.segredos)
      setStatus(Object.fromEntries(p.itens.map((i) => [i.id, "pendente" as Status])))
    })
  }, [])

  const automaticos = useMemo(
    () => (plano?.itens ?? []).filter((i) => temCmd(i) && segredosDe(i).every((v) => segredos[v]) && (status[i.id] === "pendente" || status[i.id] === "erro")),
    [plano, segredos, status],
  )

  if (!plano) return <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>

  const concluidos = plano.itens.filter((i) => status[i.id] === "ok" || status[i.id] === "feito").length
  const total = plano.itens.length

  async function instalar(it: ItemPlano) {
    setStatus((s) => ({ ...s, [it.id]: "rodando" }))
    try {
      const r = await postar<ResultadoItem>("executar", { id: it.id })
      setSaidas((s) => ({ ...s, [it.id]: r }))
      setStatus((s) => ({ ...s, [it.id]: r.ok ? (temManual(it) ? "pendente" : "ok") : "erro" }))
      if (r.ok && temManual(it)) toast.success(`${it.nome} instalado`, { description: "Falta o passo que é seu (login ou configuração)." })
      if (!r.ok) toast.error(`${it.nome}: não deu certo`, { description: r.erro ?? "Veja o detalhe no cartão." })
      return r.ok
    } catch (e) {
      setStatus((s) => ({ ...s, [it.id]: "erro" }))
      setSaidas((s) => ({ ...s, [it.id]: { ok: false, erro: String((e as Error).message) } }))
      return false
    }
  }

  async function instalarTudo() {
    setConfirmarTudo(false)
    setRodandoTudo(true)
    for (const it of automaticos) await instalar(it)
    setRodandoTudo(false)
  }

  async function salvarSegredo(variavel: string) {
    const valor = valores[variavel]?.trim()
    if (!valor) return toast.error("Cole a chave antes de salvar.")
    try {
      await postar("segredo", { nome: variavel, valor })
      setSegredos((s) => ({ ...s, [variavel]: true }))
      setValores((v) => ({ ...v, [variavel]: "" }))
      toast.success(`${variavel} salva no seu computador`)
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message })
    }
  }

  async function aplicarMd() {
    try {
      const r = await postar<{ jaTinha?: boolean }>("claude-md")
      setMdAplicado(true)
      toast.success(r.jaTinha ? "Seu CLAUDE.md já tinha estas preferências" : "CLAUDE.md atualizado (com backup)")
    } catch (e) {
      toast.error("Não consegui aplicar", { description: (e as Error).message })
    }
  }

  async function concluir() {
    await postar("fim").catch(() => undefined)
    setFim(true)
  }

  if (fim) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-16 text-center">
        <PartyPopper className="mx-auto size-14 text-primary" />
        <h2 className="text-3xl font-semibold">Seu Claude está pronto{nome ? `, ${nome}` : ""}!</h2>
        <p className="text-muted-foreground">Feche e abra de novo o app do Claude (ou digite <code>/reload-plugins</code>) para ver o tema e o painel Hoje.</p>
        <div className="mx-auto max-w-sm space-y-2 text-left text-sm">
          {[["/tema", "troca o visual (ex.: /tema synthwave)"], ["/painel", "abre o painel Hoje"], ["/lembrete", "anota um lembrete no painel"], ["/onboarding", "refaz este assistente quando quiser"]].map(([c, d]) => (
            <div key={c} className="flex gap-3"><code className="w-24 shrink-0 text-primary">{c}</code><span className="text-muted-foreground">{d}</span></div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Pode fechar esta aba.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        {plano.itens.map((it) => (
          <CartaoItem
            key={it.id}
            it={it}
            status={status[it.id]}
            saida={saidas[it.id]}
            segredos={segredos}
            valores={valores}
            setValor={(v, x) => setValores((s) => ({ ...s, [v]: x }))}
            salvarSegredo={salvarSegredo}
            instalar={() => instalar(it)}
            marcarFeito={() => setStatus((s) => ({ ...s, [it.id]: "feito" }))}
            sistema={plano.sistema}
          />
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4 text-primary" /> Suas preferências no Claude (CLAUDE.md)</CardTitle>
            <CardDescription>O Claude lê este texto em toda conversa. Ele entra no fim do seu CLAUDE.md, sem apagar nada, e fazemos uma cópia de segurança antes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 text-xs whitespace-pre-wrap">{plano.claudeMd}</pre>
            <Button onClick={aplicarMd} disabled={mdAplicado} variant={mdAplicado ? "secondary" : "default"}>
              {mdAplicado ? <><CheckCircle2 /> Aplicado</> : "Aplicar ao meu Claude"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <aside className="h-fit space-y-4 xl:sticky xl:top-24">
        <Card className="gap-4">
          <CardHeader><CardTitle className="text-base">Andamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-semibold tabular-nums">{concluidos}<span className="text-sm font-normal text-muted-foreground"> de {total}</span></div>
            <Progress value={(concluidos / Math.max(total, 1)) * 100} className="h-1.5" />
            <Button className="h-11 w-full" disabled={!automaticos.length || rodandoTudo} onClick={() => setConfirmarTudo(true)}>
              {rodandoTudo ? <Loader2 className="animate-spin" /> : <Zap />} Instalar os automáticos ({automaticos.length})
            </Button>
            <p className="text-xs text-muted-foreground">Os itens com chave ou login esperam você: estão marcados nos cartões.</p>
            <Button variant="outline" className="w-full" onClick={concluir}>Concluir</Button>
          </CardContent>
        </Card>
      </aside>

      <Dialog open={confirmarTudo} onOpenChange={setConfirmarTudo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar {automaticos.length} itens agora?</DialogTitle>
            <DialogDescription>O Claude Boost vai rodar os comandos de instalação destes itens no seu computador, um por vez:</DialogDescription>
          </DialogHeader>
          <ul className="max-h-60 list-disc space-y-1 overflow-auto pl-5 text-sm">{automaticos.map((i) => <li key={i.id}>{i.nome}</li>)}</ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarTudo(false)}>Agora não</Button>
            <Button onClick={instalarTudo}><Play /> Instalar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type CartaoProps = {
  it: ItemPlano
  status: Status
  saida?: ResultadoItem
  segredos: Record<string, boolean>
  valores: Record<string, string>
  setValor: (variavel: string, valor: string) => void
  salvarSegredo: (variavel: string) => void
  instalar: () => void
  marcarFeito: () => void
  sistema: string
}

const SELO: Record<Status, { texto: string; classe: string }> = {
  pendente: { texto: "a fazer", classe: "" },
  rodando: { texto: "instalando…", classe: "border-primary/50 text-primary" },
  ok: { texto: "pronto", classe: "border-emerald-500/40 text-emerald-400" },
  feito: { texto: "pronto", classe: "border-emerald-500/40 text-emerald-400" },
  erro: { texto: "deu erro", classe: "border-rose-500/40 text-rose-400" },
}

function CartaoItem({ it, status, saida, segredos, valores, setValor, salvarSegredo, instalar, marcarFeito }: CartaoProps) {
  const pronto = status === "ok" || status === "feito"
  const faltaSegredo = segredosDe(it).some((v) => !segredos[v])
  const instalado = !!saida?.ok
  return (
    <div className={cn("rounded-xl border bg-card p-4 transition-colors", pronto && "border-emerald-500/30 bg-emerald-500/[0.04]")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium", pronto && "border-emerald-500 bg-emerald-500 text-white")}>
          {status === "rodando" ? <Loader2 className="size-4 animate-spin" /> : pronto ? <CheckCircle2 className="size-4" /> : it.ordem}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{it.nome}</span>
            <Badge variant="outline" className={SELO[status].classe}>{SELO[status].texto}</Badge>
            {it.tipo === "requisito" && <Badge variant="secondary">programa base</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{it.resumo}</p>
        </div>
      </div>

      <div className="mt-3 space-y-3 pl-11">
        {it.passos.map((p, i) => {
          if (p.tipo === "cmd") return (
            <div key={i} className="flex gap-2 text-xs text-muted-foreground"><SquareTerminal className="mt-0.5 size-3.5 shrink-0" /><code className="break-all">{p.comando}</code></div>
          )
          if (p.tipo === "segredo") {
            const salvo = segredos[p.variavel!]
            return (
              <div key={i} className="space-y-2 rounded-lg border border-dashed p-3">
                <div className="flex items-center gap-2 text-sm"><KeyRound className="size-4 text-primary" /> Chave <code className="text-xs">{p.variavel}</code> {salvo && <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">salva</Badge>}</div>
                <p className="text-xs text-muted-foreground">{p.texto} Ela fica só no seu computador e não passa pelo chat.</p>
                {!salvo && (
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); salvarSegredo(p.variavel!) }}>
                    <Input type="password" autoComplete="off" placeholder="Cole a chave aqui" value={valores[p.variavel!] ?? ""} onChange={(e) => setValor(p.variavel!, e.target.value)} className="h-9" />
                    <Button type="submit" size="lg">Salvar</Button>
                  </form>
                )}
              </div>
            )
          }
          const Icone = p.tipo === "login" ? LogIn : MousePointerClick
          const link = LINKS.find(([re]) => re.test(p.texto ?? ""))?.[1]
          return (
            <div key={i} className="flex flex-wrap items-start gap-2 text-sm">
              <Icone className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="flex-1">{p.texto}</span>
              {link && <Button size="sm" variant="outline" asChild><a href={link} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a></Button>}
            </div>
          )
        })}
        {it.aviso && <p className="flex gap-1.5 text-xs text-amber-400/90"><AlertTriangle className="mt-px size-3.5 shrink-0" />{it.aviso}</p>}

        <div className="flex flex-wrap gap-2">
          {temCmd(it) && !instalado && (
            <Button size="sm" onClick={instalar} disabled={status === "rodando" || faltaSegredo}>
              {status === "erro" ? <RotateCcw /> : <Play />} {status === "erro" ? "Tentar de novo" : faltaSegredo ? "Salve a chave primeiro" : "Instalar"}
            </Button>
          )}
          {temManual(it) && !pronto && (!temCmd(it) || instalado) && (
            <Button size="sm" variant="secondary" onClick={marcarFeito}><CheckCircle2 /> Já fiz</Button>
          )}
        </div>

        {saida && (saida.resultados?.length || saida.erro) && (
          <details className="group text-xs">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground"><ChevronDown className="size-3.5 transition-transform group-open:rotate-180" /> Ver o que aconteceu</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/60 p-2 whitespace-pre-wrap">{saida.erro ? `${saida.erro}\n` : ""}{(saida.resultados ?? []).map((r) => `$ ${r.comando}\n${r.saida || "(sem saída)"}\n[código ${r.codigo}]`).join("\n\n")}</pre>
          </details>
        )}
      </div>
    </div>
  )
}
