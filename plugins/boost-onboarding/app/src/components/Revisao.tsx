import { KeyRound, LogIn, Package, PartyPopper, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { iconeCategoria } from "@/lib/icones"
import type { Item } from "@/lib/tipos"

type Props = { itens: Item[] }

// Mesma ideia do scripts/plano.mjs: separa pelo tipo de esforço que cada item pede da pessoa.
function classificar(it: Item) {
  const passos = it.passos ?? []
  if (it.tipo === "nativo") return "nativo"
  if (passos.some((p) => p.tipo === "segredo")) return "segredo"
  if (it.tipo === "conector" || passos.some((p) => p.tipo === "login" || p.tipo === "manual")) return "login"
  return "auto"
}

const BLOCOS = [
  { id: "auto", titulo: "O Claude instala", sub: "Ele roda os comandos e pede o seu OK antes de cada um.", Icone: Package, quem: "Claude" },
  { id: "login", titulo: "Você entra com a sua conta", sub: "Um clique para autorizar: login ou conector no app do Claude.", Icone: LogIn, quem: "Você" },
  { id: "segredo", titulo: "Você cola uma chave", sub: "Copie a chave no site do serviço e cole no seu terminal. Ela nunca passa pelo chat.", Icone: KeyRound, quem: "Você" },
  { id: "nativo", titulo: "Já vem no Claude", sub: "Nada a instalar: é só pedir.", Icone: Sparkles, quem: "Pronto" },
] as const

export function Revisao({ itens }: Props) {
  const etapas = BLOCOS.map((b) => ({ ...b, lista: itens.filter((it) => classificar(it) === b.id) })).filter((b) => b.lista.length)
  return (
    <ol className="relative space-y-6">
      {etapas.map(({ id, titulo, sub, Icone, quem, lista }, i) => (
        <li key={id} className="relative grid grid-cols-[44px_1fr] gap-4">
          {i < etapas.length && <span aria-hidden className="absolute left-[21px] top-11 bottom-[-24px] w-px bg-border" />}
          <span className="relative z-10 grid size-11 place-items-center rounded-full border-2 border-primary bg-background text-primary">
            <Icone className="size-5" />
          </span>
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Passo {i + 1}</span>
              <h3 className="font-medium">{titulo}</h3>
              <Badge variant="secondary">{lista.length}</Badge>
              <Badge variant="outline" className="ml-auto">{quem}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{sub}</p>
            <div className="flex flex-wrap gap-2">
              {lista.map((it) => {
                const Ic = iconeCategoria(it.categoria)
                return (
                  <span key={it.id} className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-sm">
                    <Ic className="size-3.5 text-primary" />{it.nome}
                    {it.tipo === "requisito" && <span className="text-xs text-muted-foreground">(antes)</span>}
                  </span>
                )
              })}
            </div>
          </div>
        </li>
      ))}
      <li className="relative grid grid-cols-[44px_1fr] gap-4">
        <span className="relative z-10 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><PartyPopper className="size-5" /></span>
        <div className="self-center text-sm text-muted-foreground">No fim: o Claude escreve o seu <span className="text-foreground">CLAUDE.md</span> pessoal e um resumo do que ficou pronto.</div>
      </li>
    </ol>
  )
}
