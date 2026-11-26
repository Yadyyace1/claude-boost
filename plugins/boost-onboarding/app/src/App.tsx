import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { calcular, carregar, recomendar } from "@/lib/motor"
import type { Ambiente, Avaliado, Catalogo, Item, Marca, Perguntas, Recomendacao as Rec, Respostas } from "@/lib/tipos"
import { Pergunta } from "@/components/Pergunta"
import { Recomendacao } from "@/components/Recomendacao"
import { ItemDetalhes } from "@/components/ItemDetalhes"
import { Resumo } from "@/components/Resumo"
import { Revisao } from "@/components/Revisao"
import { GanhosPorCategoria, PerfilResumo } from "@/components/Visuais"
import { ICONE_ETAPA } from "@/lib/icones"
import { Bot, ClipboardCheck, Wand2 } from "lucide-react"

const OBRIGATORIAS = ["area", "nivel", "preferencia", "economia", "sensivel"]
const MEMORIA = "boost-onboarding-v1"

type Dados = { catalogo: Catalogo; perguntas: Perguntas; marca: Marca; ambiente: Ambiente }

export default function App() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [respostas, setRespostas] = useState<Respostas>({ orcamento: 50 })
  const [etapa, setEtapa] = useState(0)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [rec, setRec] = useState<Rec | null>(null)
  const [selecao, setSelecao] = useState<Set<string>>(new Set())
  const [aberto, setAberto] = useState<Avaliado | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)

  // Carrega catálogo, perguntas, marca, ambiente e o perfil pré-preenchido (se o consultor mandou).
  useEffect(() => {
    carregar().then(({ catalogo, perguntas, marca, ambiente, preenchidas }) => {
      const { _nota, ...pre } = preenchidas as Respostas & { _nota?: string }
      void _nota
      const salvo = JSON.parse(localStorage.getItem(MEMORIA) || "null")
      setRespostas({ orcamento: 50, ...pre, ...(salvo?.respostas ?? {}) })
      if (salvo?.etapa) setEtapa(Math.min(salvo.etapa, perguntas.etapas.length - 1))
      if (marca?.cor) {
        const r = document.documentElement.style
        r.setProperty("--primary", marca.cor)
        r.setProperty("--ring", marca.cor)
        r.setProperty("--primary-foreground", "#1a1206")
      }
      document.title = `${marca?.nome ?? "Claude"} · Onboarding`
      setDados({ catalogo, perguntas, marca, ambiente })
    })
  }, [])

  useEffect(() => {
    if (dados && !pronto) localStorage.setItem(MEMORIA, JSON.stringify({ respostas, etapa: Math.min(etapa, dados.perguntas.etapas.length - 1) }))
  }, [respostas, etapa, dados, pronto])

  // Ao trocar de etapa, volta para o topo (depois de desenhar a etapa nova).
  useEffect(() => { window.scrollTo({ top: 0 }) }, [etapa])

  const nEtapas = dados ? dados.perguntas.etapas.length : 3
  const IDX_REC = nEtapas
  const IDX_REV = nEtapas + 1
  const titulos = dados ? [...dados.perguntas.etapas.map((e) => e.titulo), "Recomendação", "Revisão"] : []
  const porId = useMemo(() => Object.fromEntries((dados?.catalogo.itens ?? []).map((i) => [i.id, i])) as Record<string, Item>, [dados])
  const avaliados = useMemo(() => (rec ? (Object.values(rec.grupos).flat() as Avaliado[]) : []), [rec])
  const totais = useMemo(
    () => (dados && rec ? calcular([...selecao], dados.catalogo, dados.ambiente, { avaliados }) : null),
    [selecao, rec, dados, avaliados],
  )

  if (!dados) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" /></div>
  }

  const mudar = (id: string, v: Respostas[string]) => {
    setRespostas((r) => ({ ...r, [id]: v }))
    setErros((e) => ({ ...e, [id]: "" }))
  }

  function validar() {
    const novos: Record<string, string> = {}
    for (const q of dados!.perguntas.etapas[etapa].perguntas) {
      const r = respostas[q.id]
      const vazio = r == null || r === "" || (Array.isArray(r) && !r.length)
      if (OBRIGATORIAS.includes(q.id) && vazio) novos[q.id] = "Escolha uma opção para continuar."
    }
    setErros(novos)
    if (Object.keys(novos).length) {
      document.getElementById(`t-${Object.keys(novos)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return false
    }
    return true
  }

  function irPara(i: number) {
    if (i === IDX_REC && etapa < IDX_REC) {
      const r = recomendar(respostas, dados!.catalogo, dados!.perguntas, dados!.ambiente)
      setRec(r)
      setSelecao(new Set(r.selecao))
    }
    setEtapa(i)
  }

  function avancar() {
    if (etapa < IDX_REC && !validar()) return
    irPara(etapa + 1)
  }

  function alternar(id: string) {
    setSelecao((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function confirmar() {
    if (!rec || !totais) return
    setEnviando(true)
    const desligados = avaliados.filter((a) => a.desligado && selecao.has(a.item.id)).map((a) => a.item.id)
    const corpo = { respostas, selecao: [...selecao], requisitos: totais.requisitos, desligados, totais: totais.totais, teto_tokens: rec.teto, sistema: dados!.ambiente.sistema || "win" }
    try {
      const r = await fetch("confirmar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
      if (!r.ok) throw new Error(String(r.status))
      localStorage.removeItem(MEMORIA)
      setPronto(true)
    } catch {
      toast.error("Não consegui falar com o Claude", { description: "Ele ainda está aberto? Tente de novo em instantes." })
    } finally {
      setEnviando(false)
    }
  }

  function recomecar() {
    localStorage.removeItem(MEMORIA)
    location.reload()
  }

  const categorias = [...new Set(dados.catalogo.itens.filter((i) => i.tipo !== "requisito").map((i) => i.categoria))]
  const IconeEtapa = etapa < IDX_REC ? ICONE_ETAPA[dados.perguntas.etapas[etapa].icone ?? ""] ?? Bot : etapa === IDX_REC ? Wand2 : ClipboardCheck
  const nome = typeof respostas.nome === "string" && respostas.nome ? respostas.nome : ""
  const orcamento = Number(respostas.orcamento ?? 0)
  const itensSelecionados = [...(totais?.requisitos ?? []), ...selecao].map((id) => porId[id]).filter(Boolean)

  if (pronto) {
    return (
      <Casca marca={dados.marca}>
        <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-5">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="text-3xl font-semibold">Tudo certo{nome ? `, ${nome}` : ""}!</h1>
          <p className="text-muted-foreground">Suas escolhas foram enviadas. Pode fechar esta aba e voltar para o Claude: ele vai instalar {selecao.size} itens, um por vez, e pedir o seu OK em cada passo.</p>
          <ol className="mx-auto max-w-sm space-y-2 text-left text-sm">
            {["O Claude mostra o plano e começa pelos programas que faltam.", "Quando um item pedir login ou chave, ele explica onde clicar.", "No fim, ele escreve o seu CLAUDE.md pessoal e um resumo do que ficou pronto."].map((t, i) => (
              <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-medium">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
      </Casca>
    )
  }

  return (
    <Casca marca={dados.marca} progresso={((etapa + 1) / titulos.length) * 100}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr] lg:px-8">
        <nav aria-label="Etapas" className="hidden lg:block">
          <div className="sticky top-24">
          <ol className="space-y-1">
            {titulos.map((t, i) => {
              const feita = i < etapa
              const atual = i === etapa
              const podeIr = feita
              return (
                <li key={t}>
                  <button
                    type="button"
                    disabled={!podeIr}
                    onClick={() => podeIr && irPara(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      atual && "bg-muted font-medium",
                      podeIr && "hover:bg-muted/60 cursor-pointer",
                      !atual && !feita && "text-muted-foreground",
                    )}
                  >
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-xs", atual && "border-primary text-primary", feita && "border-primary bg-primary text-primary-foreground")}>
                      {feita ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    {t}
                  </button>
                </li>
              )
            })}
          </ol>
          <Separator className="my-6" />
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={recomecar}><RotateCcw /> Recomeçar</Button>
          </div>
        </nav>

        <main className="min-w-0">
          <header className="mb-8 flex items-start gap-4">
            <span className="hidden sm:grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <IconeEtapa className="size-7" />
            </span>
            <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Etapa {etapa + 1} de {titulos.length}</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {etapa === IDX_REC ? `Sua recomendação${nome ? `, ${nome}` : ""}` : etapa === IDX_REV ? "Revise antes de instalar" : titulos[etapa]}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {etapa < IDX_REC && "Responda do seu jeito: dá para mudar tudo no final. As respostas ficam salvas neste navegador."}
              {etapa === IDX_REC && "Montada a partir das suas respostas. Clique num cartão para marcar ou desmarcar, e em Detalhes para ver o que cada item faz e como é instalado."}
              {etapa === IDX_REV && "É isto que vai acontecer. Nada é instalado sem o seu OK, e senhas e chaves nunca passam pelo chat."}
            </p>
            {etapa < IDX_REC && dados.perguntas.etapas[etapa].dica && (
              <p className="text-sm text-primary/90">Por que perguntamos: {dados.perguntas.etapas[etapa].dica}</p>
            )}
            </div>
          </header>

          {etapa < IDX_REC && (
            <div className="space-y-10 max-w-4xl">
              {dados.perguntas.etapas[etapa].perguntas.map((q) => (
                <Pergunta key={q.id} q={q} respostas={respostas} mudar={mudar} erro={erros[q.id]} />
              ))}
            </div>
          )}

          {etapa >= IDX_REC && rec && totais && (
            <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
              <div className="min-w-0">
                {etapa === IDX_REC ? (
                  <div className="space-y-8">
                  <PerfilResumo respostas={respostas} perguntas={dados.perguntas} perfil={rec.perfil} />
                  <GanhosPorCategoria itens={itensSelecionados} todasCategorias={categorias} />
                  <Recomendacao grupos={rec.grupos} selecao={selecao} alternar={alternar} detalhes={setAberto} />
                  </div>
                ) : (
                  <Revisao itens={itensSelecionados} />
                )}
              </div>
              <aside className="xl:sticky xl:top-24 h-fit">
                <Resumo
                  qtd={selecao.size}
                  mensal={totais.totais.mensal_brl}
                  orcamento={orcamento}
                  tokens={totais.totais.tokens_fixos}
                  teto={rec.teto}
                  requisitos={totais.requisitos.map((id) => porId[id]?.nome ?? id)}
                  acao={
                    etapa === IDX_REC
                      ? { rotulo: "Revisar", onClick: () => irPara(IDX_REV), desativado: selecao.size === 0 }
                      : { rotulo: enviando ? "Enviando…" : "Confirmar e instalar", onClick: confirmar, desativado: enviando }
                  }
                />
              </aside>
            </div>
          )}

          <Separator className="my-10" />
          <div className="flex items-center justify-between gap-4 pb-10">
            <Button variant="outline" onClick={() => irPara(etapa - 1)} disabled={etapa === 0}><ArrowLeft /> Voltar</Button>
            {etapa < IDX_REV && (
              <Button onClick={avancar} disabled={etapa === IDX_REC && selecao.size === 0}>
                {etapa === IDX_REC - 1 ? "Ver minha recomendação" : etapa === IDX_REC ? "Revisar" : "Continuar"} <ArrowRight />
              </Button>
            )}
            {etapa === IDX_REV && (
              <Button onClick={confirmar} disabled={enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Check />} Confirmar e instalar</Button>
            )}
          </div>
        </main>
      </div>

      <ItemDetalhes
        a={aberto}
        aberto={!!aberto}
        fechar={() => setAberto(null)}
        marcado={aberto ? selecao.has(aberto.item.id) : false}
        alternar={() => aberto && alternar(aberto.item.id)}
        porId={porId}
        sistema={dados.ambiente.sistema || "win"}
      />
    </Casca>
  )
}

function Casca({ marca, progresso, children }: { marca: Marca; progresso?: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground font-semibold">{marca.nome?.[0] ?? "C"}</span>
            <div className="leading-tight">
              <div className="font-medium">{marca.nome}</div>
              <div className="text-xs text-muted-foreground">{marca.subtitulo}</div>
            </div>
          </div>
          {progresso != null && <Progress value={progresso} className="h-1.5 w-40" aria-label="Progresso" />}
        </div>
      </header>
      {children}
      {marca.rodape && <footer className="border-t py-6 text-center text-xs text-muted-foreground">{marca.rodape}</footer>}
    </div>
  )
}
