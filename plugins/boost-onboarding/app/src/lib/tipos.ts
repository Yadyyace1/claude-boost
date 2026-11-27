export type Passo = { tipo: "cmd" | "segredo" | "login" | "manual"; win?: string; mac?: string; texto?: string; var?: string; nota?: string }

export type Item = {
  id: string
  nome: string
  categoria: string
  tipo: "requisito" | "plugin" | "mcp" | "cli" | "app" | "conector" | "nativo"
  resumo: string
  oficial?: boolean
  kit?: boolean
  local?: boolean
  dificuldade?: number
  essencial?: boolean
  custo?: { tipo: "gratis" | "freemium" | "pago"; mensal_brl?: number; nota?: string; estimado?: boolean }
  tokens_fixos?: number
  estimado?: boolean
  sinais?: Record<string, number>
  requisitos?: string[]
  aviso?: string
  verificar?: boolean
  detectar?: { plugin?: string; mcp?: string; cmd?: string }
  passos?: Passo[]
}

export type Catalogo = { versao: string; itens: Item[] }

export type Opcao = { valor: string; rotulo: string; descricao?: string; icone?: string; sinais?: Record<string, number>; itens?: string[]; flags?: Record<string, boolean> }
export type Pergunta = {
  id: string
  tipo: "texto" | "multi" | "unico" | "faixa" | "avatar"
  titulo: string
  placeholder?: string
  max?: number
  min?: number
  passo?: number
  padrao?: number
  prefixo?: string
  sufixo?: string
  atalhos?: number[]
  opcoes?: Opcao[]
}
export type Etapa = { titulo: string; icone?: string; dica?: string; perguntas: Pergunta[] }
export type Perguntas = { etapas: Etapa[] }

export type Skill = { id: string; nome: string; categoria: string; resumo: string; exemplo: string; areas: string[]; tarefas: string[]; todos: boolean }

export type Marca = { nome: string; subtitulo: string; cor?: string; consultor?: string; rodape?: string }
export type Ambiente = { sistema?: "win" | "mac" | "linux"; comandos?: Record<string, boolean>; plugins?: string[]; mcps?: string[] }
export type Respostas = Record<string, string | string[] | number | undefined>

export type Avaliado = { item: Item; nota: number; motivos: string[]; avisos: string[]; instalado: boolean; desligado?: boolean; jaUsa?: boolean }
export type Grupos = { essenciais: Avaliado[]; recomendados: Avaliado[]; opcionais: Avaliado[]; fora_orcamento: Avaliado[] }
export type Perfil = { economia: string; economiaAjustada?: boolean; nivel: number; preferencia: string; orcamento: number; sensivel: boolean; impulsos: string[] }
export type Recomendacao = { perfil: Perfil; teto: number; grupos: Grupos; selecao: string[]; totais: { mensal_brl: number; tokens_fixos: number }; requisitos: string[] }
