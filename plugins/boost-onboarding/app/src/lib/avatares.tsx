import { Bot, Cat, Crown, Dog, Flame, Gamepad2, Ghost, Leaf, Music, Palette, Rocket, Zap, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Ícones de usuário: um desenho e um degradê. A escolha fica nas respostas ("avatar") e aparece
// no topo do assistente, na simulação do Claude e no perfil.
export const AVATARES: { id: string; nome: string; icone: LucideIcon; de: string; ate: string }[] = [
  { id: "faisca", nome: "Faísca", icone: Zap, de: "#FACE6E", ate: "#D68A1E" },
  { id: "foguete", nome: "Foguete", icone: Rocket, de: "#7DD3FC", ate: "#2563EB" },
  { id: "gato", nome: "Gato", icone: Cat, de: "#F9A8D4", ate: "#DB2777" },
  { id: "cachorro", nome: "Cachorro", icone: Dog, de: "#FCD34D", ate: "#B45309" },
  { id: "robo", nome: "Robô", icone: Bot, de: "#A5B4FC", ate: "#4F46E5" },
  { id: "fantasma", nome: "Fantasma", icone: Ghost, de: "#E9D5FF", ate: "#7C3AED" },
  { id: "coroa", nome: "Coroa", icone: Crown, de: "#FDE68A", ate: "#CA8A04" },
  { id: "fogo", nome: "Fogo", icone: Flame, de: "#FDBA74", ate: "#DC2626" },
  { id: "folha", nome: "Folha", icone: Leaf, de: "#86EFAC", ate: "#15803D" },
  { id: "controle", nome: "Controle", icone: Gamepad2, de: "#67E8F9", ate: "#0E7490" },
  { id: "musica", nome: "Música", icone: Music, de: "#FDA4AF", ate: "#BE123C" },
  { id: "arte", nome: "Arte", icone: Palette, de: "#C4B5FD", ate: "#9333EA" },
]

export const avatarPorId = (id?: unknown) => AVATARES.find((a) => a.id === id)

/** O ícone redondo do usuário. Sem avatar escolhido, mostra a inicial do nome. */
export function Avatar({ id, nome, className }: { id?: unknown; nome?: string; className?: string }) {
  const a = avatarPorId(id)
  if (!a) {
    return <span className={cn("grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground", className)}>{(nome || "?")[0]?.toUpperCase()}</span>
  }
  const Icone = a.icone
  return (
    <span className={cn("grid size-8 place-items-center rounded-full text-white shadow-md ring-2 ring-white/10", className)} style={{ background: `linear-gradient(135deg, ${a.de}, ${a.ate})` }} title={a.nome}>
      <Icone className="size-[55%] drop-shadow" />
    </span>
  )
}
