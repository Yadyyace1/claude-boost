import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { IDIOMAS, idiomaAtual, trocarIdioma } from "@/lib/i18n"

/** Botão com o idioma atual que abre a lista dos 10 idiomas. Os nomes ficam na própria língua (não são traduzidos). */
export function SeletorIdioma({ className }: { className?: string }) {
  const [aberto, setAberto] = useState(false)
  const atual = IDIOMAS.find((i) => i.id === idiomaAtual()) ?? IDIOMAS[0]
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false) }
    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc) }
  }, [aberto])

  return (
    <div ref={caixa} className={cn("relative", className)} data-sem-traducao>
      <button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Globe className="size-4" /> <span>{atual.bandeira}</span> <span className="hidden sm:inline">{atual.id.toUpperCase()}</span>
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.ul role="listbox" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border bg-popover p-1 shadow-xl shadow-black/30">
            {IDIOMAS.map((i) => (
              <li key={i.id}>
                <button type="button" role="option" aria-selected={i.id === atual.id} onClick={() => trocarIdioma(i.id)}
                  className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted", i.id === atual.id && "bg-primary/10")}>
                  <span className="text-base">{i.bandeira}</span><span className="flex-1">{i.nome}</span>{i.id === atual.id && <Check className="size-4 text-primary" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
