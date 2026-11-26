import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ClipboardCheck, Loader2, Moon, Palette, RotateCcw, SlidersHorizontal, Sun, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { calcular, carregar, recomendar } from "@/lib/motor"
import { ICONE_ETAPA } from "@/lib/icones"
import { aplicarVisual, lerVisual, type Visual } from "@/lib/visual"
import type { Escolha } from "@/lib/descoberta"
import type { Ambiente, Avaliado, Catalogo, Item, Marca, Perguntas, Recomendacao as Rec, Respostas } from "@/lib/tipos"
import { Pergunta } from "@/components/Pergunta"
import { Recomendacao } from "@/components/Recomendacao"
import { ItemDetalhes } from "@/components/ItemDetalhes"
import { Resumo } from "@/components/Resumo"
import { Revisao } from "@/components/Revisao"
import { Personalizacao } from "@/components/Personalizacao"
import { Aparencia, APARENCIA_PADRAO, sugestoesDeAtalho, type EscolhaAparencia, type TemaPreview } from "@/components/Aparencia"
import { GanhosPorCategoria, PerfilResumo } from "@/components/Visuais"
import { Instalacao } from "@/components/Instalacao"
import { postar } from "@/lib/api"
import { LogoSpark } from "@/components/Logo"
import { Suporte } from "@/components/Suporte"
import { motion } from "motion/react"
import { Tutorial, tutorialJaVisto } from "@/components/Tutorial"
import { Avatar } from "@/lib/avatares"
import { CircleHelp } from "lucide-react"
import { coresDoTema } from "@/components/SimulacaoClaude"

const OBRIGATORIAS = ["area", "nivel", "preferencia", "economia", "sensivel"]
const MEMORIA = "boost-onboarding-v2"

type Dados = { catalogo: Catalogo; perguntas: Perguntas; marca: Marca; ambiente: Ambiente; temas: TemaPreview[] }

export default function App() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [respostas, setRespostas] = useState<Respostas>({ orcamento: 50 })
  const [ap, setAp] = useState<EscolhaAparencia>(APARENCIA_PADRAO)
  const [visual, setVisualEstado] = useState<Visual>(() => lerVisual("#E0A33B"))
  const [etapa, setEtapa] = useState(0)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [rec, setRec] = useState<Rec | null>(null)
  const [selecao, setSelecao] = useState<Set<string>>(new Set())
  const [escolhas, setEscolhas] = useState<Escolha[]>([])
  const [aberto, setAberto] = useState<Avaliado | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [instalando, setInstalando] = useState(false)
  const [tutorial, setTutorial] = useState(() => !tutorialJaVisto())

  const setVisual = (v: Visual) => setVisualEstado(v)

  // Carrega catálogo, perguntas, marca, temas, ambiente e o perfil pré-preenchido (se o consultor mandou).
  useEffect(() => {
    carregar().then(({ catalogo, perguntas, marca, ambiente, preenchidas, temas }) => {
      const { _nota, ...pre } = preenchidas as Respostas & { _nota?: string }
      void _nota
      const salvo = JSON.parse(localStorage.getItem(MEMORIA) || "null")
      setRespostas({ orcamento: 50, ...pre, ...(salvo?.respostas ?? {}) })
      if (salvo?.ap) setAp(salvo.ap)
      if (salvo?.etapa) setEtapa(Math.min(salvo.etapa, perguntas.etapas.length))
      const v = lerVisual(marca?.cor ?? "#E0A33B")
      setVisualEstado(v)
      document.title = `${marca?.nome ?? "Claude"} · Onboarding`
      setDados({ catalogo, perguntas, marca, ambiente, temas })
    })
  }, [])

  // A tela usa as cores do tema escolhido (simula o app do Claude), ou o visual próprio do assistente.
  useEffect(() => {
    const t = visual.seguirTema !== false && ap.tema ? dados?.temas.find((x) => x.id === ap.tema) : undefined
    if (t && !t.claro && visual.modo === "claro") { aplicarVisual(visual); return }
    aplicarVisual(visual, t ? { ...coresDoTema(t, visual.modo), destaque: t.destaque } : null)
  }, [visual, ap.tema, dados])

  useEffect(() => {
    if (dados && !pronto) localStorage.setItem(MEMORIA, JSON.stringify({ respostas, ap, etapa: Math.min(etapa, dados.perguntas.etapas.length) }))
  }, [respostas, ap, etapa, dados, pronto])

  // Ao trocar de etapa, volta para o topo (depois de desenhar a etapa nova).
  useEffect(() => { window.scrollTo({ top: 0 }) }, [etapa])

  const nEtapas = dados ? dados.perguntas.etapas.length : 4
  const IDX_AP = nEtapas
  const IDX_REC = nEtapas + 1
  const IDX_DESC = nEtapas + 2
  const IDX_REV = nEtapas + 3
  const titulos = dados ? [...dados.perguntas.etapas.map((e) => e.titulo), "Aparência", "Recomendação", "Personalização", "Revisão"] : []
  const porId = useMemo(() => Object.fromEntries((dados?.catalogo.itens ?? []).map((i) => [i.id, i])) as Record<string, Item>, [dados])
  const avaliados = useMemo(() => (rec ? (Object.values(rec.grupos).flat() as Avaliado[]) : []), [rec])
  const todosAvaliados = useMemo(() => {
    if (!dados || !rec) return [] as Avaliado[]
    const ja = new Set(avaliados.map((a) => a.item.id))
    const resto = dados.catalogo.itens.filter((i) => i.tipo !== "requisito" && !ja.has(i.id))
      .map((item) => ({ item, nota: 0.5, motivos: [], avisos: item.aviso ? [item.aviso] : [], instalado: false }) as Avaliado)
    return [...avaliados, ...resto]
  }, [dados, rec, avaliados])
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
    if (etapa >= nEtapas) return true
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

  // Os itens de aparência entram como "essenciais" escolhidos pela pessoa, com o motivo dito.
  function itensAparencia(): Avaliado[] {
    const ids = [ap.tema ? "boost-temas" : null, ap.painel ? "boost-painel" : null].filter(Boolean) as string[]
    return ids.map((id) => porId[id]).filter(Boolean).map((item) => ({ item, nota: 0, motivos: ["você escolheu na etapa Aparência"], avisos: [], instalado: false }))
  }

  function irPara(i: number) {
    if (i === IDX_REC && etapa < IDX_REC) {
      const r = recomendar({ ...respostas, aparencia: undefined }, dados!.catalogo, dados!.perguntas, dados!.ambiente)
      const extras = itensAparencia()
      r.grupos.essenciais = [...r.grupos.essenciais, ...extras]
      setRec(r)
      setSelecao(new Set([...r.selecao, ...extras.map((e) => e.item.id)]))
      setEscolhas([])
    }
    setEtapa(i)
  }

  function avancar() {
    if (etapa < nEtapas && !validar()) return
    if (etapa === IDX_AP && !ap.atalhos.length) setAp({ ...ap, atalhos: sugestoesDeAtalho(respostas).slice(0, 4) })
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
    const corpo = {
      respostas: { ...respostas, aparencia: ap },
      selecao: [...selecao],
      requisitos: totais.requisitos,
      desligados,
      descoberta: escolhas,
      totais: totais.totais,
      teto_tokens: rec.teto,
      sistema: dados!.ambiente.sistema || "win",
    }
    try {
      const r = await postar<{ instalar?: boolean }>("confirmar", corpo)
      localStorage.removeItem(MEMORIA)
      if (r.instalar) setInstalando(true)
      else setPronto(true)
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

  const nome = typeof respostas.nome === "string" && respostas.nome ? respostas.nome : ""
  const usuario = { nome, avatar: respostas.avatar as string | undefined }
  const orcamento = Number(respostas.orcamento ?? 0)
  const itensSelecionados = [...(totais?.requisitos ?? []), ...selecao].map((id) => porId[id]).filter(Boolean)
  const categorias = [...new Set(dados.catalogo.itens.filter((i) => i.tipo !== "requisito").map((i) => i.categoria))]
  const IconeEtapa = etapa < nEtapas ? ICONE_ETAPA[dados.perguntas.etapas[etapa].icone ?? ""] ?? Bot : [Palette, Wand2, SlidersHorizontal, ClipboardCheck][etapa - nEtapas]
  const SUBTITULOS: Record<number, string> = {
    [IDX_AP]: "Escolha a cara do seu Claude: o tema do app, a tela inicial como dashboard e o visual desta tela.",
    [IDX_REC]: "Montada a partir das suas respostas. Clique num cartão para marcar ou desmarcar, e em Detalhes para ver como é instalado.",
    [IDX_DESC]: "Filtre o catálogo inteiro e dê Spark no que quiser. O vibed aprende com cada escolha, e o inventário à direita guarda os extras.",
    [IDX_REV]: "É isto que vai acontecer. Nada é instalado sem o seu OK, e senhas e chaves nunca passam pelo chat.",
  }

  if (instalando) {
    return (
      <Casca marca={dados.marca} visual={visual} setVisual={setVisual} usuario={usuario} abrirTutorial={() => setTutorial(true)}>
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Instalação</h1>
            <p className="max-w-2xl text-muted-foreground">Comece pelos automáticos. Os itens que pedem uma chave ou um login esperam você: cada cartão diz o que fazer, com um botão para abrir a página certa.</p>
          </header>
          <Instalacao nome={nome} />
        </div>
      </Casca>
    )
  }

  if (pronto) {
    return (
      <Casca marca={dados.marca} visual={visual} setVisual={setVisual} usuario={usuario} abrirTutorial={() => setTutorial(true)}>
        <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-5">
          <CheckCircle2 className="mx-auto size-14 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">We got you{nome ? `, ${nome}` : ""}.</h1>
          <p className="text-muted-foreground">Suas escolhas foram enviadas. Pode fechar esta aba e voltar para o Claude: ele vai instalar {selecao.size} itens, um por vez, e pedir o seu OK em cada passo.</p>
          <ol className="mx-auto max-w-sm space-y-2 text-left text-sm">
            {["O Claude mostra o plano e começa pelos programas que faltam.", "Quando um item pedir login ou chave, ele explica onde clicar.", "No fim, ele aplica o seu tema, abre o painel Hoje e escreve o seu CLAUDE.md."].map((t, i) => (
              <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-medium">{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
      </Casca>
    )
  }

  const temResumo = etapa >= IDX_REC && rec && totais

  return (
    <Casca marca={dados.marca} progresso={((etapa + 1) / titulos.length) * 100} visual={visual} setVisual={setVisual} usuario={usuario} abrirTutorial={() => setTutorial(true)}>
      <div className={cn("mx-auto grid gap-8 px-4 py-8 lg:px-8", etapa === IDX_DESC ? "max-w-[1600px] py-5" : "max-w-7xl lg:grid-cols-[220px_1fr]")}>
        <nav aria-label="Etapas" className={cn("hidden", etapa !== IDX_DESC && "lg:block")}>
          <div className="sticky top-24">
            <ol className="space-y-1">
              {titulos.map((t, i) => {
                const feita = i < etapa
                const atual = i === etapa
                return (
                  <li key={t}>
                    <button
                      type="button"
                      disabled={!feita}
                      onClick={() => feita && irPara(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        atual && "bg-muted font-medium",
                        feita && "hover:bg-muted/60 cursor-pointer",
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

        <motion.main key={etapa} className="min-w-0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
          <header className={cn("flex items-start gap-4", etapa === IDX_DESC ? "mb-4" : "mb-8")}>
            <span className="hidden sm:grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <IconeEtapa className="size-7" />
            </span>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Etapa {etapa + 1} de {titulos.length}</p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {etapa === IDX_REC ? `Sua recomendação${nome ? `, ${nome}` : ""}` : etapa === IDX_REV ? "Revise antes de instalar" : etapa === IDX_DESC ? "Personalização" : titulos[etapa]}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {etapa < nEtapas ? "Responda do seu jeito: dá para mudar tudo no final. As respostas ficam salvas neste navegador." : SUBTITULOS[etapa]}
              </p>
              {etapa < nEtapas && dados.perguntas.etapas[etapa].dica && (
                <p className="text-sm text-primary">Por que perguntamos: {dados.perguntas.etapas[etapa].dica}</p>
              )}
            </div>
          </header>

          {etapa < nEtapas && (
            <div className="space-y-10 max-w-4xl">
              {dados.perguntas.etapas[etapa].perguntas.map((q) => (
                <Pergunta key={q.id} q={q} respostas={respostas} mudar={mudar} erro={erros[q.id]} />
              ))}
            </div>
          )}

          {etapa === IDX_AP && <Aparencia temas={dados.temas} ap={ap} setAp={setAp} visual={visual} setVisual={setVisual} respostas={respostas} />}

          {etapa === IDX_DESC && rec && totais && (
            <Personalizacao itens={todosAvaliados} selecao={selecao} alternar={alternar} escolhas={escolhas} setEscolhas={setEscolhas}
              detalhes={setAberto} teto={rec.teto} tokens={totais.totais.tokens_fixos} mensal={totais.totais.mensal_brl} orcamento={orcamento}
              voltar={() => irPara(IDX_REC)} revisar={() => irPara(IDX_REV)} />
          )}

          {temResumo && etapa !== IDX_DESC && (
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
                      ? { rotulo: "Personalizar", onClick: () => irPara(IDX_DESC), desativado: false }
                      : { rotulo: enviando ? "Enviando…" : "Confirmar e instalar", onClick: confirmar, desativado: enviando }
                  }
                />
              </aside>
            </div>
          )}

          {etapa !== IDX_DESC && <Separator className="my-10" />}
          <div className={cn("flex items-center justify-between gap-4 pb-10", etapa === IDX_DESC && "hidden")}>
            <Button variant="outline" onClick={() => irPara(etapa - 1)} disabled={etapa === 0}><ArrowLeft /> Voltar</Button>
            {etapa < IDX_REV && (
              <Button onClick={avancar}>
                {etapa === IDX_AP ? "Ver minha recomendação" : etapa === IDX_REC ? "Personalizar" : etapa === IDX_DESC ? "Revisar" : "Continuar"} <ArrowRight />
              </Button>
            )}
            {etapa === IDX_REV && (
              <Button onClick={confirmar} disabled={enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Check />} Confirmar e instalar</Button>
            )}
          </div>
        </motion.main>
      </div>

      <Tutorial aberto={tutorial} setAberto={setTutorial} />
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

type Usuario = { nome: string; avatar?: string }
function Casca({ marca, progresso, visual, setVisual, usuario, abrirTutorial, children }: { marca: Marca; progresso?: number; visual: Visual; setVisual: (v: Visual) => void; usuario?: Usuario; abrirTutorial?: () => void; children: React.ReactNode }) {
  const escuro = visual.modo === "escuro"
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <LogoSpark className="size-9" />
            <div className="leading-tight">
              <div className="font-medium">{marca.nome}</div>
              <div className="text-xs text-muted-foreground">{marca.subtitulo}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {progresso != null && <Progress value={progresso} className="hidden h-1.5 w-40 sm:block" aria-label="Progresso" />}
            {abrirTutorial && <Button variant="ghost" size="icon" aria-label="Abrir o tutorial" title="Tutorial" onClick={abrirTutorial}><CircleHelp /></Button>}
            <Button variant="ghost" size="icon" aria-label={escuro ? "Mudar para o modo claro" : "Mudar para o modo escuro"} onClick={() => setVisual({ ...visual, modo: escuro ? "claro" : "escuro" })}>
              {escuro ? <Sun /> : <Moon />}
            </Button>
            {usuario && (usuario.avatar || usuario.nome) && <span className="flex items-center gap-2 border-l pl-4 text-sm"><Avatar id={usuario.avatar} nome={usuario.nome} /><span className="hidden md:inline">{usuario.nome}</span></span>}
          </div>
        </div>
      </header>
      {children}
      <Suporte />
      {marca.rodape && <footer className="border-t py-6 text-center text-xs text-muted-foreground">{marca.rodape}</footer>}
    </div>
  )
}
