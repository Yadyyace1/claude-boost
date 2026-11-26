import { ArrowRight, Box, Coins, Gauge, ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { brl, num } from "@/lib/motor"

type Props = {
  qtd: number
  mensal: number
  orcamento: number
  tokens: number
  teto: number
  requisitos: string[]
  acao?: { rotulo: string; onClick: () => void; desativado?: boolean }
}

function Barra({ valor, limite }: { valor: number; limite: number }) {
  const pct = limite > 0 ? Math.min(100, (valor / limite) * 100) : valor > 0 ? 100 : 0
  const estoura = valor > limite
  return <Progress value={pct} className={cn("h-1.5", estoura && "[&>[data-slot=progress-indicator]]:bg-amber-400")} />
}

export function Resumo({ qtd, mensal, orcamento, tokens, teto, requisitos, acao }: Props) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4 text-primary" /> Sua seleção</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-3xl font-semibold tabular-nums">{qtd}<span className="text-sm font-normal text-muted-foreground"> itens</span></div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Coins className="size-3.5" /> Custo extra</span>
            <span className={cn("font-medium tabular-nums", mensal > orcamento && "text-amber-400")}>{brl(mensal)}/mês</span>
          </div>
          <Barra valor={mensal} limite={orcamento} />
          <div className="text-xs text-muted-foreground">Seu limite: {brl(orcamento)}/mês</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground"><Gauge className="size-3.5" /> Peso por sessão</span>
            <span className={cn("font-medium tabular-nums", tokens > teto && "text-amber-400")}>{num(tokens)} tokens</span>
          </div>
          <Barra valor={tokens} limite={teto} />
          <div className="text-xs text-muted-foreground">Seu limite: {num(teto)} tokens fixos</div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Box className="size-3.5" /> Programas que entram junto</div>
          <p className="text-sm">{requisitos.length ? requisitos.join(", ") : "Nenhum: o seu PC já tem o necessário."}</p>
        </div>

        {acao && (
          <Button className="w-full h-11" onClick={acao.onClick} disabled={acao.desativado}>
            {acao.rotulo} <ArrowRight />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
