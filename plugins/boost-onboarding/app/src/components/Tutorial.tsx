import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, MessageCircleQuestion, MousePointerClick, Package, Palette, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Faisca } from "./Logo"

const CHAVE = "spark-tutorial-visto-v1"

const PASSOS = [
  { icone: Faisca, titulo: "Bem-vindo ao Spark", texto: "Em poucos minutos o seu Claude fica pronto do seu jeito: as ferramentas certas para o seu trabalho, um visual novo e um painel de início. Nada é instalado sem o seu OK." },
  { icone: MousePointerClick, titulo: "1. Conte como você trabalha", texto: "Responda as perguntas do seu jeito. Marque quantas áreas quiser. As respostas ficam salvas neste navegador, e dá para voltar e mudar tudo." },
  { icone: Palette, titulo: "2. Escolha o visual", texto: "Veja o app do Claude simulado com cada tema, no claro e no escuro. Esta tela muda junto para você sentir como vai ficar." },
  { icone: Package, titulo: "3. Recomendação e Personalização", texto: "O Spark recomenda o que combina com você. Na Personalização, filtre o catálogo inteiro, veja o vibed e o Spark score, e dê Spark no que quiser: vai para o seu inventário." },
  { icone: Rocket, titulo: "4. Instalação", texto: "Clique em \"Instalar os automáticos\". Itens com chave ou login mostram o que fazer, com botão para a página certa. Ficou com dúvida? Os botões ? explicam, e o Suporte no canto responde." },
  { icone: MessageCircleQuestion, titulo: "Pronto para começar", texto: "Se travar em algo, abra o Suporte no canto da tela. E este tutorial volta pelo botão ? no topo. We got you." },
]

/** Tutorial de boas-vindas: abre sozinho na primeira visita e volta pelo botão "?" do topo. */
export function Tutorial({ aberto, setAberto }: { aberto: boolean; setAberto: (v: boolean) => void }) {
  const [i, setI] = useState(0)
  const [direcao, setDirecao] = useState(1)
  useEffect(() => { if (aberto) setI(0) }, [aberto])

  function fechar() {
    localStorage.setItem(CHAVE, "1")
    setAberto(false)
  }
  const ir = (n: number) => { setDirecao(n > i ? 1 : -1); setI(n) }
  const p = PASSOS[i]
  const Icone = p.icone
  const ultimo = i === PASSOS.length - 1

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <div className="relative h-56">
          <AnimatePresence mode="wait" custom={direcao}>
            <motion.div key={i} custom={direcao} className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
              initial={{ opacity: 0, x: direcao * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direcao * -40 }} transition={{ duration: 0.22 }}>
              <motion.span className="grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30"
                initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}>
                <Icone className="size-8" />
              </motion.span>
              <DialogTitle className="text-xl">{p.titulo}</DialogTitle>
              <DialogDescription className="leading-relaxed">{p.texto}</DialogDescription>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Passos do tutorial">
          {PASSOS.map((_, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === i} aria-label={`Passo ${k + 1}`} onClick={() => ir(k)}
              className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={fechar}>Pular</Button>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="icon" onClick={() => ir(i - 1)} aria-label="Voltar"><ArrowLeft /></Button>}
            <Button onClick={() => (ultimo ? fechar() : ir(i + 1))}>{ultimo ? "Começar" : "Próximo"} {!ultimo && <ArrowRight />}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const tutorialJaVisto = () => localStorage.getItem(CHAVE) === "1"
