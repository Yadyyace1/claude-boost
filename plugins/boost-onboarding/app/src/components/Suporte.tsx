import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2, MessageCircleQuestion, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { postar } from "@/lib/api"
import { Faisca } from "./Logo"

type Msg = { quem: "eu" | "suporte"; texto: string }

// Dúvidas comuns respondidas na hora, sem gastar o limite do Claude.
const COMUNS: [string, string][] = [
  ["Onde colo a minha chave?", "No cartão do item, no campo \"Cole a chave aqui\", e clique em Salvar. A chave fica só no seu computador: nunca cole chaves ou senhas neste chat."],
  ["Deu erro, e agora?", "Abra \"Ver o que aconteceu\" no cartão para ver a mensagem. Muitas vezes é só internet ou um programa que ainda está terminando: clique em \"Tentar de novo\". Se continuar, me conte o que apareceu (sem chaves) ou fale com o seu consultor."],
  ["Preciso reiniciar o Claude?", "Sim, no fim. Depois de clicar em Concluir, feche e abra de novo o app do Claude: é aí que os plugins, o tema e o painel Hoje carregam."],
  ["Isso apaga as minhas configurações?", "Não. Tudo é acrescentado: plugins e conectores novos entram ao lado dos seus, e o CLAUDE.md recebe um texto no fim, com uma cópia de segurança antes."],
  ["O que é um conector?", "Um jeito de ligar o Claude a um serviço (Gmail, Notion, Canva...). Os conectores oficiais você liga com um clique no app do Claude: Configurações → Conectores."],
]

let contextoAtual = ""
/** As telas dizem ao suporte o que está acontecendo (ex.: quais itens deram erro), para a resposta vir certa. */
export const definirContextoSuporte = (texto: string) => { contextoAtual = texto.slice(0, 3000) }

/** Botão flutuante na lateral com um chat de suporte. Perguntas livres vão para o Claude da própria pessoa. */
export function Suporte() {
  const [aberto, setAberto] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([{ quem: "suporte", texto: "Oi! Sou o suporte do Spark. Pergunte o que quiser sobre a instalação, ou toque numa dúvida comum abaixo." }])
  const [texto, setTexto] = useState("")
  const [esperando, setEsperando] = useState(false)
  const fim = useRef<HTMLDivElement>(null)

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }) }, [msgs, esperando, aberto])

  async function perguntar(p: string) {
    const pergunta = p.trim()
    if (!pergunta || esperando) return
    const comum = COMUNS.find(([q]) => q === pergunta)
    setMsgs((m) => [...m, { quem: "eu", texto: pergunta }])
    setTexto("")
    if (comum) { setMsgs((m) => [...m, { quem: "suporte", texto: comum[1] }]); return }
    setEsperando(true)
    try {
      const r = await postar<{ ok: boolean; resposta?: string; erro?: string }>("ajuda", { pergunta, historico: msgs.slice(-6), contexto: contextoAtual })
      setMsgs((m) => [...m, { quem: "suporte", texto: r.ok && r.resposta ? r.resposta : explicarErro(r.erro) }])
    } catch (e) {
      setMsgs((m) => [...m, { quem: "suporte", texto: explicarErro((e as Error).message) }])
    } finally {
      setEsperando(false)
    }
  }

  return (
    <>
      <motion.button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-label={aberto ? "Fechar o suporte" : "Abrir o suporte"}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground shadow-xl shadow-primary/25"
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.4 }}>
        {aberto ? <X className="size-5" /> : <MessageCircleQuestion className="size-5" />}
        <span className="hidden sm:inline">{aberto ? "Fechar" : "Suporte"}</span>
      </motion.button>

      <AnimatePresence>
        {aberto && (
          <motion.aside role="dialog" aria-label="Suporte do Spark"
            className="fixed bottom-24 right-6 z-40 flex h-[min(560px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border bg-popover shadow-2xl shadow-black/40"
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.96 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
            <header className="flex items-center gap-3 border-b bg-gradient-to-r from-primary/15 to-transparent px-4 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary/20 text-primary"><Faisca className="size-5" /></span>
              <div className="leading-tight">
                <div className="font-medium">Suporte do Spark</div>
                <div className="text-xs text-muted-foreground">Respostas do seu Claude, sem acesso ao seu computador</div>
              </div>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 leading-relaxed", m.quem === "eu" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted")}>
                  {formatar(m.texto)}
                </motion.div>
              ))}
              {esperando && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> pensando…</div>}
              <div ref={fim} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto border-t px-3 pt-3 [scrollbar-width:none]">
              {COMUNS.map(([q]) => (
                <button key={q} type="button" onClick={() => perguntar(q)} className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground">{q}</button>
              ))}
            </div>
            <form className="flex gap-2 p-3" onSubmit={(e) => { e.preventDefault(); perguntar(texto) }}>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={2000} placeholder="Escreva sua dúvida (sem chaves ou senhas)"
                className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Sua dúvida" />
              <Button type="submit" size="icon" className="size-10 rounded-xl" disabled={!texto.trim() || esperando} aria-label="Enviar"><Send /></Button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

/** Negrito do markdown (**assim**) vira <b>, sem innerHTML. */
function formatar(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p))
}

function explicarErro(erro?: string) {
  const e = (erro ?? "").toLowerCase()
  if (e.includes("limit")) return "O seu limite de uso do Claude acabou por agora, então não consigo responder com IA. As dúvidas comuns abaixo continuam funcionando, e o limite volta sozinho em algumas horas."
  if (e.includes("login") || e.includes("auth")) return "O Claude Code ainda não está logado neste computador. Termine o login (o instalador abre a janela) e pergunte de novo."
  return "Não consegui falar com o Claude agora. Tente de novo em instantes, ou use as dúvidas comuns abaixo."
}
