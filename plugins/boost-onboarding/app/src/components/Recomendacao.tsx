import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { Avaliado, Grupos } from "@/lib/tipos"
import { ItemCard } from "./ItemCard"

type Aba = "sugestao" | "opcionais" | "fora" | "selecionados" | "todos"

type Props = {
  grupos: Grupos
  selecao: Set<string>
  alternar: (id: string) => void
  detalhes: (a: Avaliado) => void
}

const SECOES: [keyof Grupos, string, string][] = [
  ["essenciais", "Essenciais", "A base que todo mundo usa."],
  ["recomendados", "Recomendados para você", "Já vêm marcados. Desmarque o que não quiser."],
  ["opcionais", "Opcionais", "Podem ser úteis. Marque se quiser."],
  ["fora_orcamento", "Fora do orçamento", "Bons para você, mas passam do valor por mês que você escolheu."],
]

export function Recomendacao({ grupos, selecao, alternar, detalhes }: Props) {
  const [aba, setAba] = useState<Aba>("sugestao")
  const [busca, setBusca] = useState("")

  const todos = useMemo(() => Object.values(grupos).flat() as Avaliado[], [grupos])
  const termo = busca.trim().toLowerCase()
  const casa = (a: Avaliado) => !termo || `${a.item.nome} ${a.item.categoria} ${a.item.resumo}`.toLowerCase().includes(termo)

  const secoes: [string, string, Avaliado[]][] = (() => {
    if (aba === "sugestao") return SECOES.slice(0, 2).map(([g, t, s]) => [t, s, grupos[g]])
    if (aba === "opcionais") return [[SECOES[2][1], SECOES[2][2], grupos.opcionais]]
    if (aba === "fora") return [[SECOES[3][1], SECOES[3][2], grupos.fora_orcamento]]
    if (aba === "selecionados") return [["Selecionados", "Tudo o que vai ser instalado.", todos.filter((a) => selecao.has(a.item.id))]]
    return SECOES.map(([g, t, s]) => [t, s, grupos[g]])
  })()

  const contar = (l: Avaliado[]) => l.filter(casa).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
          <TabsList className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="sugestao">Sugestão</TabsTrigger>
            <TabsTrigger value="opcionais">Opcionais <Badge variant="secondary" className="ml-1">{grupos.opcionais.length}</Badge></TabsTrigger>
            {grupos.fora_orcamento.length > 0 && <TabsTrigger value="fora">Fora do orçamento <Badge variant="secondary" className="ml-1">{grupos.fora_orcamento.length}</Badge></TabsTrigger>}
            <TabsTrigger value="selecionados">Selecionados <Badge className="ml-1">{selecao.size}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-xs shrink-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Buscar (ex.: vídeo, Google)" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {secoes.map(([titulo, sub, lista]) =>
        contar(lista) ? (
          <section key={titulo} className="space-y-3">
            <div className="flex items-baseline gap-3">
              <h3 className="text-lg font-medium">{titulo}</h3>
              <span className="text-sm text-muted-foreground">{sub}</span>
            </div>
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {lista.filter(casa).map((a) => (
                <ItemCard key={a.item.id} a={a} marcado={selecao.has(a.item.id)} alternar={() => alternar(a.item.id)} detalhes={() => detalhes(a)} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {secoes.every(([, , l]) => !contar(l)) && (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nada por aqui{termo ? ` com "${busca}"` : ""}.</p>
      )}
    </div>
  )
}
