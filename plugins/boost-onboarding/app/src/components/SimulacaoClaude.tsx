import { ArrowUp, Plus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export type CoresTema = { fundo: string; lateral: string; cartao: string; elevado: string; texto: string; secundario: string; suave: string }

export type TemaPreview = {
  id: string
  nome: string
  descricao: string
  cena: string | null
  cenaSvg: string | null
  soEscuro: boolean
  escuro: CoresTema
  claro: CoresTema | null
  destaque: string
  extras: string[]
}

/** As cores do tema no modo pedido (o Synthwave só tem escuro). */
export function coresDoTema(t: TemaPreview, modo: "escuro" | "claro") {
  return modo === "claro" && t.claro ? t.claro : t.escuro
}

const svgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`

const CONVERSAS = ["Roteiro da live de hoje", "Revisar o contrato", "Ideias de posts", "Organizar a semana"]

export type FundoEscolhido = { tipo: "tema" | "cor" | "degrade" | "foto" | "nenhum"; cor?: string; degrade?: string[]; fotoSvg?: string }
type Props = { t: TemaPreview; modo: "escuro" | "claro"; grande?: boolean; nome?: string; cenario?: boolean; className?: string; fundo?: FundoEscolhido; estilo?: string }

/**
 * O app do Claude em miniatura, nas cores reais do tema: barra lateral com as conversas,
 * a conversa no meio (com o cenário animado ao fundo, quando o tema tem) e a caixa de mensagem.
 */
export function SimulacaoClaude({ t, modo, grande = false, nome = "você", cenario = true, className, fundo, estilo = "padrao" }: Props) {
  const c = coresDoTema(t, modo)
  const tipo = fundo?.tipo ?? "tema"
  const comCena = tipo === "tema" && cenario && t.cenaSvg && modo === "escuro"
  const imagem = comCena ? svgUrl(t.cenaSvg!)
    : tipo === "foto" && fundo?.fotoSvg ? svgUrl(fundo.fotoSvg)
    : tipo === "degrade" && (fundo?.degrade?.length ?? 0) >= 2 ? `linear-gradient(160deg, ${fundo!.degrade!.join(", ")})`
    : undefined
  const corFundo = tipo === "cor" && fundo?.cor ? fundo.cor : undefined
  const temVeu = !!imagem || !!corFundo
  const bolhaPessoa = estilo === "bolhas" ? "rounded-3xl" : estilo === "cartoes" ? "rounded-lg border" : "rounded-2xl"
  const caixaClaude = estilo === "bolhas" ? "rounded-3xl p-3" : estilo === "cartoes" ? "rounded-lg border p-3" : ""
  const linha = (w: string, cor: string, op = 1) => <div className="h-1.5 rounded-full" style={{ width: w, background: cor, opacity: op }} />

  return (
    <div className={cn("flex overflow-hidden text-left", grande ? "h-[380px] rounded-xl border" : "h-36", className)}
      style={{ background: c.fundo, color: c.texto, borderColor: `${c.suave}40` }} aria-hidden={!grande}>
      {/* barra lateral */}
      <div className={cn("flex shrink-0 flex-col border-r", grande ? "w-52 gap-1 p-3" : "w-[30%] gap-1 p-2")} style={{ background: c.lateral, borderColor: `${c.suave}26` }}>
        <div className={cn("flex items-center gap-1.5 rounded-lg font-medium", grande ? "mb-2 px-2 py-1.5 text-sm" : "mb-1 px-1 py-1")}
          style={{ border: `1px solid ${t.destaque}66`, color: t.destaque }}>
          <Plus className={grande ? "size-4" : "size-2.5"} />
          {grande ? "Nova conversa" : linha("60%", t.destaque, 0.8)}
        </div>
        {grande && <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-wide" style={{ color: c.suave }}>Recentes</div>}
        {CONVERSAS.map((x, i) => (
          <div key={x} className={cn("truncate rounded-md", grande ? "px-2 py-1.5 text-[13px]" : "px-1 py-1")}
            style={{ background: i === 0 ? c.cartao : "transparent", color: i === 0 ? c.texto : c.secundario }}>
            {grande ? x : linha(`${85 - i * 12}%`, i === 0 ? c.texto : c.suave, i === 0 ? 0.85 : 0.6)}
          </div>
        ))}
        {grande && (
          <div className="mt-auto flex items-center gap-2 px-2 pt-2 text-[13px]" style={{ color: c.secundario }}>
            <span className="grid size-6 place-items-center rounded-full text-[11px] font-semibold" style={{ background: t.destaque, color: "#fff" }}>{nome[0]?.toUpperCase()}</span>
            {nome}
          </div>
        )}
      </div>

      {/* conversa */}
      <div className="relative flex min-w-0 flex-1 flex-col" style={{ backgroundImage: imagem, backgroundColor: corFundo, backgroundSize: "cover", backgroundPosition: "center" }}>
        {temVeu && <div className="absolute inset-0" style={{ background: `${c.fundo}${tipo === "tema" ? "99" : "66"}` }} />}
        <div className={cn("relative flex flex-1 flex-col", grande ? "gap-4 px-8 pt-6" : "gap-2 px-2.5 pt-2.5")}>
          {/* mensagem da pessoa */}
          <div className={cn("ml-auto max-w-[80%]", bolhaPessoa, grande ? "px-4 py-2.5 text-sm" : "w-3/5 px-2 py-1.5")} style={{ background: c.elevado, borderColor: t.destaque }}>
            {grande ? "Monta o roteiro da live de hoje, com os horários de cada bloco." : linha("100%", c.texto, 0.8)}
          </div>
          {/* resposta do Claude */}
          <div className={cn("flex", grande ? "gap-3" : "gap-1.5", caixaClaude)} style={caixaClaude ? { background: c.lateral, borderColor: `${c.suave}55` } : undefined}>
            <Sparkles className={cn("shrink-0", grande ? "mt-0.5 size-5" : "size-3")} style={{ color: t.destaque }} />
            {grande ? (
              <div className="space-y-2 text-sm leading-relaxed">
                <p>Claro! Aqui vai o roteiro de 2 horas:</p>
                <ul className="space-y-1" style={{ color: c.secundario }}>
                  <li><b style={{ color: c.texto }}>20:00</b> · abertura e recados do chat</li>
                  <li><b style={{ color: c.texto }}>20:15</b> · jogo principal, com pausa às 21:00</li>
                  <li><b style={{ color: c.texto }}>21:45</b> · melhores momentos e encerramento</li>
                </ul>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[["Pronto", t.extras[0]], ["Lembrete às 19:30", t.extras[1]], ["Plugin OBS", t.extras[2]]].map(([r, cor]) => (
                    <span key={r} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${cor}26`, color: cor }}>{r}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-1">
                {linha("90%", c.texto, 0.75)}
                {linha("70%", c.suave, 0.7)}
                <div className="flex gap-1 pt-0.5">{t.extras.map((x) => <span key={x} className="h-1.5 w-3 rounded-full" style={{ background: x }} />)}</div>
              </div>
            )}
          </div>
        </div>
        {/* caixa de mensagem */}
        <div className={cn("relative", grande ? "p-5 pt-2" : "p-2 pt-1")}>
          <div className={cn("flex items-center justify-between rounded-2xl border", grande ? "px-4 py-3 text-sm" : "px-2 py-1")}
            style={{ background: c.cartao, borderColor: `${c.suave}55`, color: c.suave }}>
            {grande ? "Responder ao Claude…" : linha("45%", c.suave, 0.5)}
            <span className={cn("grid place-items-center rounded-full", grande ? "size-8" : "size-3.5")} style={{ background: t.destaque, color: "#fff" }}>
              <ArrowUp className={grande ? "size-4" : "size-2.5"} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
