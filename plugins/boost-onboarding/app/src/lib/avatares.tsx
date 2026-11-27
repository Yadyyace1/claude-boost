import { cn } from "@/lib/utils"

// Avatares do Spark: personagens desenhados em SVG (rosto, olhos com brilho, bochechas), cada um num fundo em degradê.
// A escolha fica nas respostas ("avatar") e aparece no topo do assistente e na simulação do Claude.

type Def = { id: string; nome: string; de: string; ate: string; corpo: (k: string) => React.ReactNode }

// Olhos com brilho e bochechas, iguais em todos para dar a mesma família.
const olhos = (x1: number, x2: number, y: number, r = 3.6) => (
  <g>
    <circle cx={x1} cy={y} r={r} fill="#1d1b22" /><circle cx={x2} cy={y} r={r} fill="#1d1b22" />
    <circle cx={x1 + r * 0.35} cy={y - r * 0.35} r={r * 0.38} fill="#fff" /><circle cx={x2 + r * 0.35} cy={y - r * 0.35} r={r * 0.38} fill="#fff" />
  </g>
)
const bochechas = (x1: number, x2: number, y: number) => (
  <g fill="#ff8fa3" opacity=".55"><ellipse cx={x1} cy={y} rx="3.4" ry="2.2" /><ellipse cx={x2} cy={y} rx="3.4" ry="2.2" /></g>
)
const sorriso = (x: number, y: number, l = 5) => <path d={`M${x - l} ${y} Q${x} ${y + l * 0.9} ${x + l} ${y}`} stroke="#1d1b22" strokeWidth="2.2" fill="none" strokeLinecap="round" />

export const AVATARES: Def[] = [
  { id: "faisca", nome: "Faísca", de: "#3a2a12", ate: "#1a140c", corpo: () => (
    <g>
      <path d="M32 10 Q35 29 54 32 Q35 35 32 54 Q29 35 10 32 Q29 29 32 10Z" fill="#f2b544" />
      <path d="M48 12 Q49 17 54 18 Q49 19 48 24 Q47 19 42 18 Q47 17 48 12Z" fill="#ffd98a" />
      {olhos(28, 36, 31, 2.6)}{sorriso(32, 36, 3.2)}
    </g>) },
  { id: "gato", nome: "Gato", de: "#f7a8c8", ate: "#c2447a", corpo: () => (
    <g>
      <path d="M15 26 L17 11 L28 20Z M49 26 L47 11 L36 20Z" fill="#ffd9a8" stroke="#e8a874" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="32" cy="36" rx="19" ry="16" fill="#ffd9a8" />
      {olhos(25, 39, 34)}{bochechas(20, 44, 40)}
      <path d="M30.5 39 L33.5 39 L32 41Z" fill="#e0607e" />
      <path d="M32 41 Q29 44 27 42 M32 41 Q35 44 37 42" stroke="#1d1b22" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>) },
  { id: "raposa", nome: "Raposa", de: "#ffcf8a", ate: "#d9622b", corpo: () => (
    <g>
      <path d="M13 28 L15 10 L28 21Z M51 28 L49 10 L36 21Z" fill="#f07a35" />
      <path d="M13 28 Q14 50 32 52 Q50 50 51 28 Q42 18 32 18 Q22 18 13 28Z" fill="#f07a35" />
      <path d="M20 38 Q32 30 44 38 Q40 51 32 52 Q24 51 20 38Z" fill="#fff4e6" />
      {olhos(25, 39, 33)}<ellipse cx="32" cy="42" rx="2.6" ry="2" fill="#1d1b22" />
    </g>) },
  { id: "panda", nome: "Panda", de: "#b9f0d0", ate: "#3e9b6a", corpo: () => (
    <g>
      <circle cx="17" cy="20" r="6.5" fill="#1d1b22" /><circle cx="47" cy="20" r="6.5" fill="#1d1b22" />
      <circle cx="32" cy="35" r="19" fill="#fbfbf7" />
      <ellipse cx="24.5" cy="33" rx="5" ry="6" fill="#1d1b22" transform="rotate(-20 24.5 33)" /><ellipse cx="39.5" cy="33" rx="5" ry="6" fill="#1d1b22" transform="rotate(20 39.5 33)" />
      <circle cx="25.5" cy="32" r="1.6" fill="#fff" /><circle cx="40.5" cy="32" r="1.6" fill="#fff" />
      <ellipse cx="32" cy="41" rx="2.6" ry="1.9" fill="#1d1b22" />{sorriso(32, 43, 3)}{bochechas(20, 44, 41)}
    </g>) },
  { id: "robo", nome: "Robô", de: "#a9b8ff", ate: "#4b4fd6", corpo: () => (
    <g>
      <line x1="32" y1="12" x2="32" y2="19" stroke="#dfe4ff" strokeWidth="2.5" /><circle cx="32" cy="11" r="3" fill="#ffcf5a" />
      <rect x="14" y="19" width="36" height="30" rx="9" fill="#dfe4ff" />
      <rect x="18" y="25" width="28" height="14" rx="6" fill="#1d2140" />
      <circle cx="25.5" cy="32" r="3" fill="#6ff0d0" /><circle cx="38.5" cy="32" r="3" fill="#6ff0d0" />
      <rect x="26" y="42" width="12" height="3" rx="1.5" fill="#8d97d6" />
      <rect x="9" y="29" width="5" height="10" rx="2.5" fill="#b8c1f0" /><rect x="50" y="29" width="5" height="10" rx="2.5" fill="#b8c1f0" />
    </g>) },
  { id: "fantasma", nome: "Fantasma", de: "#d9c4ff", ate: "#6a3fc4", corpo: () => (
    <g>
      <path d="M16 50 L16 30 Q16 14 32 14 Q48 14 48 30 L48 50 Q44 46 40 50 Q36 54 32 50 Q28 46 24 50 Q20 54 16 50Z" fill="#fbf8ff" />
      {olhos(26, 38, 30)}<ellipse cx="32" cy="38" rx="3" ry="3.6" fill="#1d1b22" />{bochechas(21, 43, 36)}
    </g>) },
  { id: "astronauta", nome: "Astronauta", de: "#0d1b3d", ate: "#24396e", corpo: () => (
    <g>
      <circle cx="12" cy="14" r="1" fill="#fff" /><circle cx="53" cy="12" r="1.3" fill="#fff" /><circle cx="50" cy="50" r="1" fill="#fff" />
      <circle cx="32" cy="33" r="19" fill="#eef1f8" />
      <rect x="17" y="24" width="30" height="20" rx="10" fill="#1f2a4d" />
      <path d="M21 29 Q26 26 30 28" stroke="#8fb6ff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
      <circle cx="27" cy="35" r="2.6" fill="#fff" /><circle cx="37" cy="35" r="2.6" fill="#fff" />
      <rect x="45" y="28" width="5" height="9" rx="2" fill="#f2b544" />
    </g>) },
  { id: "alien", nome: "Alien", de: "#c8ff9e", ate: "#3c9a2e", corpo: () => (
    <g>
      <line x1="24" y1="17" x2="20" y2="9" stroke="#7fe36a" strokeWidth="2.5" strokeLinecap="round" /><circle cx="20" cy="9" r="3" fill="#b8ff8f" />
      <line x1="40" y1="17" x2="44" y2="9" stroke="#7fe36a" strokeWidth="2.5" strokeLinecap="round" /><circle cx="44" cy="9" r="3" fill="#b8ff8f" />
      <path d="M32 15 Q50 15 50 32 Q50 52 32 52 Q14 52 14 32 Q14 15 32 15Z" fill="#7fe36a" />
      <ellipse cx="24.5" cy="31" rx="5.5" ry="7" fill="#1d1b22" transform="rotate(-15 24.5 31)" /><ellipse cx="39.5" cy="31" rx="5.5" ry="7" fill="#1d1b22" transform="rotate(15 39.5 31)" />
      <circle cx="26" cy="28.5" r="1.8" fill="#fff" /><circle cx="41" cy="28.5" r="1.8" fill="#fff" />{sorriso(32, 42, 4)}
    </g>) },
  { id: "sapo", nome: "Sapo", de: "#a8f0e0", ate: "#178a7a", corpo: () => (
    <g>
      <circle cx="22" cy="21" r="8" fill="#5fce6a" /><circle cx="42" cy="21" r="8" fill="#5fce6a" />
      <ellipse cx="32" cy="38" rx="21" ry="15" fill="#5fce6a" />
      <circle cx="22" cy="21" r="5" fill="#fff" /><circle cx="42" cy="21" r="5" fill="#fff" />
      {olhos(22, 42, 21, 2.8)}
      <path d="M20 40 Q32 49 44 40" stroke="#1d1b22" strokeWidth="2.2" fill="none" strokeLinecap="round" />{bochechas(17, 47, 38)}
    </g>) },
  { id: "coruja", nome: "Coruja", de: "#e8c79a", ate: "#7a4b25", corpo: () => (
    <g>
      <path d="M16 20 L20 12 L25 19Z M48 20 L44 12 L39 19Z" fill="#8a5a33" />
      <path d="M14 34 Q14 16 32 16 Q50 16 50 34 Q50 52 32 52 Q14 52 14 34Z" fill="#a8703f" />
      <ellipse cx="32" cy="42" rx="11" ry="9" fill="#f1d9b5" />
      <circle cx="24.5" cy="30" r="7.5" fill="#fff6e8" /><circle cx="39.5" cy="30" r="7.5" fill="#fff6e8" />
      {olhos(24.5, 39.5, 30, 3.8)}<path d="M29.5 35 L34.5 35 L32 39Z" fill="#f2a33a" />
    </g>) },
  { id: "dragao", nome: "Dragão", de: "#ffb38a", ate: "#c22d45", corpo: () => (
    <g>
      <path d="M20 22 L16 9 L27 18Z M44 22 L48 9 L37 18Z" fill="#ffd36b" />
      <path d="M14 34 Q14 17 32 17 Q50 17 50 34 Q50 52 32 52 Q14 52 14 34Z" fill="#4fc28a" />
      <path d="M22 41 Q32 36 42 41 Q42 51 32 51 Q22 51 22 41Z" fill="#a6efc6" />
      {olhos(25, 39, 31)}<circle cx="29" cy="43" r="1.4" fill="#1d1b22" /><circle cx="35" cy="43" r="1.4" fill="#1d1b22" />
      <path d="M32 17 L29 12 L32 14 L35 12Z" fill="#ffd36b" />
    </g>) },
  { id: "unicornio", nome: "Unicórnio", de: "#ffd6f5", ate: "#8a6cf0", corpo: () => (
    <g>
      <path d="M32 6 L28 20 L36 20Z" fill="#ffd36b" stroke="#f2b544" strokeWidth="1" />
      <path d="M14 22 Q10 12 20 14 Q22 8 30 14 L16 30Z" fill="#ff8fd0" /><path d="M50 22 Q54 12 44 14 Q42 8 34 14 L48 30Z" fill="#8fd8ff" />
      <ellipse cx="32" cy="36" rx="18" ry="16" fill="#fffafd" />
      {olhos(25, 39, 34)}{bochechas(20, 44, 40)}{sorriso(32, 42, 3.4)}
    </g>) },
]

export const avatarPorId = (id?: unknown) => AVATARES.find((a) => a.id === id)

/** O avatar redondo do usuário. Sem avatar escolhido, mostra a inicial do nome. */
export function Avatar({ id, nome, className }: { id?: unknown; nome?: string; className?: string }) {
  const a = avatarPorId(id)
  if (!a) {
    return <span className={cn("grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground", className)}>{(nome || "?")[0]?.toUpperCase()}</span>
  }
  const k = `av-${a.id}`
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8 shrink-0 rounded-full shadow-md ring-2 ring-white/10", className)} role="img" aria-label={a.nome}>
      <defs>
        <linearGradient id={`${k}-fundo`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a.de} /><stop offset="1" stopColor={a.ate} /></linearGradient>
        <clipPath id={`${k}-corte`}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath={`url(#${k}-corte)`}>
        <rect width="64" height="64" fill={`url(#${k}-fundo)`} />
        <circle cx="18" cy="12" r="22" fill="#fff" opacity=".12" />
        {a.corpo(k)}
      </g>
    </svg>
  )
}
