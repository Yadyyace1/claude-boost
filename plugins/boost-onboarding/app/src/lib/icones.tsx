import {
  BookMarked, BookOpen, Bot, Box, Brush, Building, Building2, CalendarClock, CalendarDays, CircleHelp, Clapperboard, Cloud,
  Code2, Coins, CreditCard, Database, Feather, FileText, Flame, Footprints, Gamepad2, Gauge, Gem, Gift, GitBranch, Globe,
  GraduationCap, HardDrive, Hash, Image, Languages, Layers, LayoutGrid, ListChecks, Lock, LockOpen, Mail, Megaphone,
  MessageSquare, Monitor, NotebookPen, Palette, PenLine, PenTool, Radio, Receipt, Rocket, Scale, Scissors, Search, Send,
  Shapes, Share2, Sheet, Shield, ShieldCheck, Shuffle, SlidersHorizontal, Smartphone, Smile, Sprout, Star, StickyNote, Terminal,
  Triangle, Tv, User, UserRound, Users, Video, Wallet, Workflow, Wrench, Zap, Briefcase, HardDriveDownload,
  Store, Headset, HeartPulse, Presentation, Music, Cpu, Leaf, Home, Dumbbell, Sparkle, UtensilsCrossed, Ruler, Calculator, Plane, type LucideIcon,
} from "lucide-react"

// Ícone de cada opção: primeiro "pergunta:valor" (quando o mesmo valor aparece em perguntas diferentes), depois só o valor.
const ICONES: Record<string, LucideIcon> = {
  // áreas
  dev: Code2, design: Palette, marketing: Megaphone, conteudo: Clapperboard, juridico: Scale, jogos: Gamepad2,
  financas: Coins, estudos: GraduationCap, gestao: Briefcase, stream: Radio,
  ecommerce: Store, atendimento: Headset, saude: HeartPulse, educacao: Presentation, musica: Music, ia: Cpu,
  imobiliario: Home, fitness: Dumbbell, beleza: Sparkle, restaurante: UtensilsCrossed, arquitetura: Ruler, contabilidade: Calculator, rh: Users, eventos: Plane,
  // tarefas
  escrever: PenLine, planilhas: Sheet, imagens: Image, video: Clapperboard, redes: Share2, anuncios: Megaphone,
  programar: Code2, pesquisar: Search, agenda: CalendarClock, automatizar: Workflow, cobrar: Receipt, estudar: BookOpen,
  lives: Radio, cortes: Scissors,
  // ferramentas
  gmail: Mail, gcal: CalendarDays, gdrive: HardDrive, notion: NotebookPen, obsidian: Gem, slack: Hash, telegram: Send,
  figma: PenTool, canva: Brush, miro: StickyNote, metaads: Megaphone, github: GitBranch, supabase: Database, vercel: Triangle,
  stripe: CreditCard, mercadopago: Wallet, zotero: BookMarked, unity: Box, obs: Video, twitch: Tv, vtuber: Smile, blender: Shapes,
  // seu Claude hoje
  app: Monitor, terminal: Terminal, web: Globe, celular: Smartphone,
  free: Gift, pro: Star, max: Rocket, team: Building2, naosei: CircleHelp,
  nunca: Sprout, pouco: Footprints, diario: Flame,
  solo: User, pequena: Users, empresa: Building,
  pt: Languages, en: Languages, es: Languages,
  cauteloso: ShieldCheck, equilibrado: Scale, solto: Zap,
  // preferências
  "nivel:1": Sprout, "nivel:2": Wrench, "nivel:3": Terminal,
  local: HardDriveDownload, misto: Shuffle, nuvem: Cloud,
  maxima: Leaf, alta: Gauge, media: Layers, baixa: Zap, extremo: Flame,
  "sensivel:sim": Lock, "sensivel:nao": LockOpen,
  "remoto:sim": Smartphone, "remoto:nao": Monitor,
  curtas: Feather, explicadas: ListChecks,
}

export const iconeOpcao = (pergunta: string, valor: string): LucideIcon | undefined => ICONES[`${pergunta}:${valor}`] ?? ICONES[valor]

export const ICONE_ETAPA: Record<string, LucideIcon> = {
  user: UserRound, calendar: CalendarDays, bot: Bot, sliders: SlidersHorizontal,
}

export const ICONE_CATEGORIA: Record<string, LucideIcon> = {
  "Economia e base": Gauge, Produtividade: LayoutGrid, Comunicação: MessageSquare, Design: Palette, "Arte e jogos": Gamepad2,
  Vídeo: Clapperboard, Marketing: Megaphone, Pesquisa: Search, Documentos: FileText, Desenvolvimento: Code2,
  Pagamentos: CreditCard, Finanças: Coins, Automação: Workflow, Streaming: Radio, Requisitos: Box, Segurança: Shield,
  "Vendas e atendimento": Headset, "E-commerce": Store, "IA e automação": Cpu, Aparência: Palette,
  "Música e áudio": Music, "Arquitetura e 3D": Ruler,
}

export const iconeCategoria = (c: string): LucideIcon => ICONE_CATEGORIA[c] ?? BookOpen
