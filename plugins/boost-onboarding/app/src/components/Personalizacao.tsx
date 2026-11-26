import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Info, Package, Search, SlidersHorizontal, ThumbsDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { iconeCategoria } from "@/lib/icones"
import { num } from "@/lib/motor"
import { afinidades, notaAjustada, sparkScore, vibed, type Escolha } from "@/lib/descoberta"
import type { Avaliado } from "@/lib/tipos"
import { Faisca } from "./Logo"
import { Ajuda } from "./Ajuda"

type Ordem = "vibed" | "score" | "leves" | "gratis"
const ORDENS: [Ordem, string][] = [["vibed", "Mais vibed"], ["score", "Spark score"], ["leves", "Mais leves"], ["gratis", "Grátis primeiro"]]
const TIPOS: [string, string][] = [["conector", "Conector"], ["plugin", "Plugin"], ["mcp", "MCP"], ["app", "App"], ["cli", "Linha de comando"], ["nativo", "Nativo"]]
const NIVEIS = ["Fácil", "Médio", "Técnico"]

type Props = {
  itens: Avaliado[]
  selecao: Set<string>
  alternar: (id: string) => void
  escolhas: Escolha[]
  setEscolhas: (f: (l: Escolha[]) => Escolha[]) => void
  detalhes: (a: Avaliado) => void
  teto: number
  tokens: number
  mensal: number
  orcamento: number
  voltar: () => void
  revisar: () => void
}

export function Personalizacao({ itens, selecao, alternar, escolhas, setEscolhas, detalhes, teto, tokens, mensal, orcamento, voltar, revisar }: Props) {
  const [busca, setBusca] = useState("")
  const [ordem, setOrdem] = useState<Ordem>("vibed")
  const [cats, setCats] = useState<Set<string>>(new Set())
  const [tipos, setTipos] = useState<Set<string>>(new Set())
  const [origem, setOrigem] = useState<"todos" | "oficial" | "comunidade">("todos")
  const [soGratis, setSoGratis] = useState(false)
  const [nivelMax, setNivelMax] = useState(3)
  const [esconderSelecionados, setEsconderSelecionados] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [porPagina, setPorPagina] = useState(6)
  const grade = useRef<HTMLDivElement>(null)

  // Quantos cartões cabem na tela sem rolar: mede a área da grade.
  useEffect(() => {
    const el = grade.current
    if (!el) return
    const medir = () => {
      const { width, height } = el.getBoundingClientRect()
      const colunas = Math.max(1, Math.floor((width + 16) / 236))
      const linhas = Math.max(1, Math.floor((height + 16) / 226))
      setPorPagina(colunas * linhas)
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const naoCurti = useMemo(() => new Set(escolhas.filter((e) => !e.quer).map((e) => e.id)), [escolhas])
  const af = useMemo(() => afinidades(itens, escolhas), [itens, escolhas])
  const notas = useMemo(() => Object.fromEntries(itens.map((a) => [a.item.id, notaAjustada(a, af)])), [itens, af])
  const melhor = useMemo(() => Math.max(1, ...Object.values(notas)), [notas])
  const categorias = useMemo(() => [...new Set(itens.map((a) => a.item.categoria))].sort(), [itens])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = itens.filter((a) => {
      const it = a.item
      if (naoCurti.has(it.id)) return false
      if (esconderSelecionados && selecao.has(it.id)) return false
      if (q && !`${it.nome} ${it.resumo} ${it.categoria}`.toLowerCase().includes(q)) return false
      if (cats.size && !cats.has(it.categoria)) return false
      if (tipos.size && !tipos.has(it.tipo)) return false
      if (origem === "oficial" && !it.oficial && !it.kit) return false
      if (origem === "comunidade" && (it.oficial || it.kit)) return false
      if (soGratis && (it.custo?.mensal_brl ?? 0) > 0) return false
      if ((it.dificuldade ?? 1) > nivelMax) return false
      return true
    })
    const chave: Record<Ordem, (a: Avaliado) => number> = {
      vibed: (a) => -notas[a.item.id],
      score: (a) => -sparkScore(a.item),
      leves: (a) => a.item.tokens_fixos ?? 0,
      gratis: (a) => (a.item.custo?.mensal_brl ?? 0) * 100 - notas[a.item.id],
    }
    return lista.sort((a, b) => chave[ordem](a) - chave[ordem](b))
  }, [itens, busca, cats, tipos, origem, soGratis, nivelMax, esconderSelecionados, selecao, naoCurti, ordem, notas])

  const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const pag = Math.min(pagina, paginas - 1)
  const visiveis = filtrados.slice(pag * porPagina, pag * porPagina + porPagina)
  useEffect(() => setPagina(0), [busca, cats, tipos, origem, soGratis, nivelMax, ordem, esconderSelecionados])

  const extras = escolhas.filter((e) => e.quer && selecao.has(e.id)).map((e) => itens.find((a) => a.item.id === e.id)).filter(Boolean) as Avaliado[]
  const daRecomendacao = selecao.size - extras.length

  function adicionar(id: string) {
    if (selecao.has(id)) {
      alternar(id)
      setEscolhas((l) => l.filter((e) => e.id !== id))
    } else {
      alternar(id)
      setEscolhas((l) => [...l.filter((e) => e.id !== id), { id, quer: true }])
    }
  }
  const dispensar = (id: string) => setEscolhas((l) => [...l.filter((e) => e.id !== id), { id, quer: false }])
  const alternarEm = (s: Set<string>, set: (x: Set<string>) => void, v: string) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); set(n) }
  const filtrosAtivos = cats.size + tipos.size + (origem !== "todos" ? 1 : 0) + (soGratis ? 1 : 0) + (nivelMax < 3 ? 1 : 0) + (busca ? 1 : 0)

  return (
    <div className="grid h-[calc(100dvh-16.5rem)] min-h-[480px] gap-5 lg:grid-cols-[210px_1fr_270px]">
      {/* filtros */}
      <aside className="hidden min-h-0 flex-col gap-4 overflow-y-auto pr-1 lg:flex">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium"><SlidersHorizontal className="size-4 text-primary" /> Filtros</span>
          {filtrosAtivos > 0 && (
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setBusca(""); setCats(new Set()); setTipos(new Set()); setOrigem("todos"); setSoGratis(false); setNivelMax(3) }}>limpar ({filtrosAtivos})</button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" className="h-9 pl-8" aria-label="Buscar no catálogo" />
        </div>
        <Grupo titulo="Ordenar por">
          {ORDENS.map(([v, r]) => <Chip key={v} on={ordem === v} onClick={() => setOrdem(v)}>{r}</Chip>)}
        </Grupo>
        <Grupo titulo="Origem" ajuda="Oficial: feito pela própria empresa do serviço ou pela Anthropic. Comunidade: feito por outras pessoas (código aberto); vale conferir antes de usar com dados sigilosos.">
          {([["todos", "Todos"], ["oficial", "Oficial"], ["comunidade", "Comunidade"]] as const).map(([v, r]) => <Chip key={v} on={origem === v} onClick={() => setOrigem(v)}>{r}</Chip>)}
        </Grupo>
        <Grupo titulo="Tipo" ajuda="Conector: liga com um clique no app do Claude. Plugin: pacote de habilidades. MCP: um servidor que dá ferramentas novas ao Claude. App e linha de comando: programas no seu PC.">
          {TIPOS.map(([v, r]) => <Chip key={v} on={tipos.has(v)} onClick={() => alternarEm(tipos, setTipos, v)}>{r}</Chip>)}
        </Grupo>
        <Grupo titulo="Custo e dificuldade">
          <Chip on={soGratis} onClick={() => setSoGratis(!soGratis)}>Só grátis</Chip>
          {NIVEIS.map((n, i) => <Chip key={n} on={nivelMax === i + 1} onClick={() => setNivelMax(i + 1)}>até {n.toLowerCase()}</Chip>)}
        </Grupo>
        <Grupo titulo="Categoria">
          {categorias.map((c) => <Chip key={c} on={cats.has(c)} onClick={() => alternarEm(cats, setCats, c)}>{c}</Chip>)}
        </Grupo>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="accent-[var(--primary)]" checked={esconderSelecionados} onChange={(e) => setEsconderSelecionados(e.target.checked)} />
          Esconder o que já está na seleção
        </label>
      </aside>

      {/* cartões lado a lado */}
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{filtrados.length} itens{filtrosAtivos ? " com estes filtros" : " no catálogo"}</span>
          <span className="flex items-center gap-1">
            <Ajuda titulo="Vibed e Spark score">
              <b>Vibed</b> é o quanto o item combina com você: começa pelas suas respostas e aprende com cada item que você adiciona ou dispensa. O <b>Spark score</b> é a nota geral do item, igual para todo mundo: oficial, grátis, fácil de instalar e leve no seu limite sobem a nota.
            </Ajuda>
            <Button size="icon" variant="ghost" disabled={pag === 0} onClick={() => setPagina(pag - 1)} aria-label="Página anterior"><ChevronLeft /></Button>
            <span className="tabular-nums">{pag + 1}/{paginas}</span>
            <Button size="icon" variant="ghost" disabled={pag >= paginas - 1} onClick={() => setPagina(pag + 1)} aria-label="Próxima página"><ChevronRight /></Button>
          </span>
        </div>
        <div ref={grade} className="relative min-h-0 flex-1">
          <motion.div layout className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            <AnimatePresence mode="popLayout">
              {visiveis.map((a, i) => (
                <Cartao key={a.item.id} a={a} i={i} vibe={vibed(notas[a.item.id], melhor)} on={selecao.has(a.item.id)}
                  adicionar={() => adicionar(a.item.id)} dispensar={() => dispensar(a.item.id)} detalhes={() => detalhes(a)} />
              ))}
            </AnimatePresence>
          </motion.div>
          {!visiveis.length && (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed text-center text-sm text-muted-foreground">
              <div className="space-y-2"><Search className="mx-auto size-6" /><p>Nada com estes filtros.</p></div>
            </div>
          )}
        </div>
      </section>

      {/* inventário */}
      <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border bg-card/80 p-4 pb-20 backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium"><Package className="size-4 text-primary" /> Seu inventário</span>
          <Badge variant="secondary" className="tabular-nums">{selecao.size}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{daRecomendacao} da sua recomendação{extras.length ? ` + ${extras.length} extras que você escolheu` : ""}.</p>
        <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {extras.map((a) => {
              const Icone = iconeCategoria(a.item.categoria)
              return (
                <motion.li key={a.item.id} layout initial={{ opacity: 0, x: 40, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="group flex items-center gap-2 rounded-lg border bg-background/60 px-2.5 py-2 text-sm">
                  <Icone className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{a.item.nome}</span>
                  <button type="button" onClick={() => adicionar(a.item.id)} className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100" aria-label={`Tirar ${a.item.nome}`}><X className="size-3.5" /></button>
                </motion.li>
              )
            })}
          </AnimatePresence>
          {!extras.length && (
            <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              <Faisca className="mx-auto mb-2 size-5 text-primary" />
              Clique em <b>Spark</b> num cartão para adicionar extras. Eles aparecem aqui.
            </li>
          )}
        </ul>
        <div className="space-y-2 border-t pt-3 text-xs">
          <Medidor rotulo="Peso no seu limite" valor={tokens} max={teto} texto={`${num(tokens)} de ${num(teto)} tokens`} ajuda="Tokens que os itens ligados ocupam em toda conversa, antes de você digitar. Passou do teto da sua economia? Os de menor nota ficam desligados até você precisar." />
          <Medidor rotulo="Custo por mês" valor={mensal} max={Math.max(orcamento, 1)} texto={`R$ ${num(mensal)} de R$ ${num(orcamento)}`} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={voltar}><ArrowLeft /> Voltar</Button>
          <Button size="sm" className="flex-1" onClick={revisar}>Revisar <ArrowRight /></Button>
        </div>
      </aside>
    </div>
  )
}

function Cartao({ a, i, vibe, on, adicionar, dispensar, detalhes }: { a: Avaliado; i: number; vibe: number; on: boolean; adicionar: () => void; dispensar: () => void; detalhes: () => void }) {
  const it = a.item
  const Icone = iconeCategoria(it.categoria)
  const score = sparkScore(it)
  const [faiscas, setFaiscas] = useState(0)
  return (
    <motion.article layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30, delay: i * 0.03 }} whileHover={{ y: -3 }}
      className={cn("relative flex h-[210px] flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-4 shadow-lg shadow-black/10 transition-colors", on && "border-primary/70 shadow-primary/15")}>
      {on && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />}
      <div className="relative flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><Icone className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium leading-tight" title={it.nome}>{it.nome}</h3>
          <p className="truncate text-xs text-muted-foreground">{it.categoria}</p>
        </div>
        <Anel valor={vibe} />
      </div>
      <p className="relative line-clamp-2 text-[13px] leading-snug text-foreground/85">{it.resumo}</p>
      <div className="relative flex flex-wrap gap-1">
        <Badge variant="outline" className={cn("text-[10px]", it.oficial ? "border-sky-500/40 text-sky-300" : it.kit ? "border-primary/40 text-primary" : "text-muted-foreground")}>{it.oficial ? "oficial" : it.kit ? "do Spark" : "comunidade"}</Badge>
        <Badge variant="outline" className="text-[10px]">{(it.custo?.mensal_brl ?? 0) > 0 ? `R$ ${it.custo!.mensal_brl}/mês` : it.custo?.tipo === "freemium" ? "grátis + pago" : "grátis"}</Badge>
        <Badge variant="outline" className="text-[10px]">{it.tokens_fixos ? `${num(it.tokens_fixos)} tokens` : "leve"}</Badge>
        <Badge variant="outline" className="border-primary/40 text-[10px] text-primary" title="Spark score: a nota geral do item">★ {score}</Badge>
      </div>
      <div className="relative mt-auto flex items-center gap-1.5">
        <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
          <Button size="sm" variant={on ? "secondary" : "default"} className="relative w-full" onClick={() => { if (!on) setFaiscas((n) => n + 1); adicionar() }}>
            {on ? <><Check /> Na seleção</> : <><Faisca className="size-4" /> Spark</>}
          </Button>
        </motion.div>
        <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" onClick={detalhes} aria-label={`Detalhes de ${it.nome}`}><Info /></Button>
        {!on && <Button size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-rose-400" onClick={dispensar} aria-label={`Não curti ${it.nome}`} title="Não curti (o vibed aprende)"><ThumbsDown /></Button>}
      </div>
      <AnimatePresence>{faiscas > 0 && <Explosao key={faiscas} />}</AnimatePresence>
    </motion.article>
  )
}

/** Faíscas que saem do botão ao adicionar. */
function Explosao() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-1/3">
      {Array.from({ length: 8 }).map((_, k) => {
        const ang = (k / 8) * Math.PI * 2
        return (
          <motion.span key={k} className="absolute text-primary" initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
            animate={{ x: Math.cos(ang) * 46, y: Math.sin(ang) * 30 - 18, opacity: 0, scale: 1.1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <Faisca className="size-3" />
          </motion.span>
        )
      })}
    </div>
  )
}

/** Anel com o vibed (%), animado quando muda. */
function Anel({ valor }: { valor: number }) {
  const r = 17, c = 2 * Math.PI * r
  return (
    <div className="relative grid size-12 shrink-0 place-items-center" title="Vibed: o quanto combina com você">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="3.5" />
        <motion.circle cx="20" cy="20" r={r} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={c}
          initial={false} animate={{ strokeDashoffset: c * (1 - valor / 100) }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
      </svg>
      <div className="text-center leading-none">
        <motion.div key={valor} initial={{ scale: 1.3, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="text-[13px] font-semibold tabular-nums">{valor}</motion.div>
        <div className="text-[8px] uppercase tracking-wide text-muted-foreground">vibed</div>
      </div>
    </div>
  )
}

function Grupo({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">{titulo}{ajuda && <Ajuda titulo={titulo}>{ajuda}</Ajuda>}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors", on ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>
      {children}
    </button>
  )
}

function Medidor({ rotulo, valor, max, texto, ajuda }: { rotulo: string; valor: number; max: number; texto: string; ajuda?: string }) {
  const pct = Math.min(100, (valor / Math.max(max, 1)) * 100)
  const passou = valor > max
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between"><span className="flex items-center gap-1">{rotulo}{ajuda && <Ajuda titulo={rotulo}>{ajuda}</Ajuda>}</span><span className={cn("tabular-nums text-muted-foreground", passou && "text-amber-400")}>{texto}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className={cn("h-full rounded-full", passou ? "bg-amber-400" : "bg-primary")} initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 160, damping: 24 }} />
      </div>
    </div>
  )
}
