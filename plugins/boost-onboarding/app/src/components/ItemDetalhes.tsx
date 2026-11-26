import { AlertTriangle, KeyRound, LogIn, MousePointerClick, Sparkles, SquareTerminal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { num } from "@/lib/motor"
import type { Avaliado, Item, Passo } from "@/lib/tipos"
import { SeloCusto, SeloOrigem } from "./ItemCard"

const ICONE_PASSO = { cmd: SquareTerminal, segredo: KeyRound, login: LogIn, manual: MousePointerClick }
const ROTULO_PASSO = { cmd: "O Claude roda", segredo: "Você cola uma chave (fora do chat)", login: "Você faz login", manual: "Você faz" }

export function LinhaPasso({ p, sistema }: { p: Passo; sistema: "win" | "mac" | "linux" }) {
  const Icone = ICONE_PASSO[p.tipo]
  const comando = p.tipo === "cmd" ? (sistema === "mac" ? p.mac : p.win) ?? p.win : null
  return (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><Icone className="size-3.5" /></span>
      <div className="min-w-0 space-y-1 text-sm">
        <div className="text-xs font-medium text-muted-foreground">{ROTULO_PASSO[p.tipo]}</div>
        {comando && <code className="block rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs break-all">{comando}</code>}
        {p.tipo === "segredo" && <div>Variável <code className="font-mono text-xs">{p.var}</code>. {p.texto}</div>}
        {p.tipo !== "cmd" && p.tipo !== "segredo" && <div>{p.texto}</div>}
        {p.nota && <div className="text-xs text-muted-foreground">{p.nota}</div>}
      </div>
    </li>
  )
}

type Props = {
  a: Avaliado | null
  aberto: boolean
  fechar: () => void
  marcado: boolean
  alternar: () => void
  porId: Record<string, Item>
  sistema: "win" | "mac" | "linux"
}

export function ItemDetalhes({ a, aberto, fechar, marcado, alternar, porId, sistema }: Props) {
  if (!a) return null
  const it = a.item
  const reqs = (it.requisitos ?? []).map((r) => porId[r]?.nome).filter(Boolean)
  return (
    <Sheet open={aberto} onOpenChange={(o) => !o && fechar()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-xl">{it.nome}</SheetTitle>
          <SheetDescription>{it.resumo}</SheetDescription>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <SeloCusto a={a} />
            <Badge variant="outline">{it.tokens_fixos ? `${num(it.tokens_fixos)} tokens por sessão${it.estimado ? " (estimado)" : ""}` : "não pesa no uso"}</Badge>
            <SeloOrigem a={a} />
            <Badge variant="outline">{it.categoria}</Badge>
          </div>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 p-6">
            {a.motivos.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1.5"><Sparkles className="size-4 text-primary" /> Por que recomendamos</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">{a.motivos.map((m) => <li key={m}>{m}</li>)}</ul>
              </section>
            )}
            {a.avisos.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-1.5"><AlertTriangle className="size-4 text-amber-400" /> Bom saber</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">{a.avisos.map((m) => <li key={m}>{m}</li>)}</ul>
              </section>
            )}
            {it.custo?.nota && <p className="text-sm text-muted-foreground">Custo: {it.custo.nota}.</p>}
            {reqs.length > 0 && <p className="text-sm text-muted-foreground">Precisa de: <span className="text-foreground">{reqs.join(", ")}</span> (o Claude instala antes, se faltar).</p>}
            <section className="space-y-3">
              <h3 className="text-sm font-medium">Como vai ser instalado</h3>
              <ol className="space-y-3">{(it.passos ?? []).map((p, i) => <LinhaPasso key={i} p={p} sistema={sistema} />)}</ol>
            </section>
          </div>
        </ScrollArea>
        <Separator />
        <div className="flex justify-end gap-2 p-4">
          <Button variant="outline" onClick={fechar}>Fechar</Button>
          <Button variant={marcado ? "secondary" : "default"} onClick={alternar}>{marcado ? "Tirar da seleção" : "Adicionar à seleção"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
