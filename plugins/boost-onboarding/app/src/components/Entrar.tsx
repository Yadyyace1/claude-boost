import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Loader2, LogIn, ShieldCheck, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { LogoSpark } from "./Logo"
import { SeletorIdioma } from "./SeletorIdioma"

export type Conta = { id: string; email: string; nome: string; avatar: string; idioma: string; criado_em: string }
export type Sessao = { token: string; conta: Conta }

const CHAVE = "spark-sessao"

/** Chamada à API de contas do Spark (no servidor). Devolve os dados ou lança o erro já em português. */
export async function contaApi<T>(api: string, caminho: string, metodo = "GET", corpo?: unknown, token?: string): Promise<T> {
  let r: Response
  try {
    r = await fetch(`${api}${caminho}`, {
      method: metodo,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new Error("Não consegui falar com o servidor do Spark. Confira a internet e tente de novo.")
  }
  const dados = r.status === 204 ? {} : await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((dados as { erro?: string }).erro ?? `erro ${r.status}`)
  return dados as T
}

export function lerSessao(): Sessao | null {
  try { return JSON.parse(sessionStorage.getItem(CHAVE) || "null") } catch { return null }
}
export function guardarSessao(s: Sessao | null) {
  if (s) sessionStorage.setItem(CHAVE, JSON.stringify(s))
  else sessionStorage.removeItem(CHAVE)
}

/** Tela de entrada: aparece antes das configurações quando o Spark tem um servidor de contas. */
export function Entrar({ api, entrou }: { api: string; entrou: (s: Sessao) => void }) {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [nome, setNome] = useState("")
  const [erro, setErro] = useState("")
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setEnviando(true)
    try {
      const idioma = localStorage.getItem("spark-idioma") ?? "pt"
      const s = modo === "entrar"
        ? await contaApi<Sessao>(api, "/v1/sessoes", "POST", { email, senha })
        : await contaApi<Sessao>(api, "/v1/contas", "POST", { email, senha, nome, idioma })
      guardarSessao(s)
      entrou(s)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="relative w-full max-w-sm space-y-6 rounded-3xl border bg-card/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <SeletorIdioma className="absolute right-3 top-3" />
        <div className="space-y-3 text-center">
          <LogoSpark className="mx-auto size-14" />
          <h1 className="text-2xl font-semibold tracking-tight">{modo === "entrar" ? "Entrar no Spark" : "Criar sua conta"}</h1>
          <p className="text-sm text-muted-foreground">{modo === "entrar" ? "Entre para configurar o seu Claude." : "Leva um minuto. Depois é só configurar."}</p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-xl border p-1" role="tablist">
          {(["entrar", "criar"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setErro("") }}
              className={cn("flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm transition-colors", modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {m === "entrar" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />} {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={enviar}>
          <AnimatePresence initial={false}>
            {modo === "criar" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" autoComplete="nickname" maxLength={60} className="h-11" aria-label="Nome" />
              </motion.div>
            )}
          </AnimatePresence>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" className="h-11" aria-label="E-mail" />
          <Input type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder={modo === "criar" ? "Senha (8 ou mais caracteres)" : "Senha"}
            autoComplete={modo === "criar" ? "new-password" : "current-password"} className="h-11" aria-label="Senha" />
          {erro && <p className="text-sm text-destructive" role="alert">{erro}</p>}
          <Button type="submit" className="h-11 w-full" disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : modo === "entrar" ? <LogIn /> : <UserPlus />} {modo === "entrar" ? "Entrar" : "Criar conta e continuar"}
          </Button>
        </form>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          A senha vai protegida (HTTPS) e é guardada só como código embaralhado. As chaves dos seus conectores nunca saem do seu computador.
        </p>
      </motion.div>
    </div>
  )
}
