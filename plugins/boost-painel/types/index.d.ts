export type Uso = { contexto: number | null; cincoHoras: number | null; semana: number | null; reset5h: string | null }
export type Lembrete = { id: string; texto: string; feito: boolean }
export type Projeto = { caminho: string; nome: string; ultimo: number; vezes: number }
export type Arquivo = { nome: string; tamanho: number; quando: number }
export type Caixa = { pasta: string; arquivos: Arquivo[] }
export type Contagem = { dia: string; conversas: number }
export type Inicio = { mensagens: number; oculto: boolean }
export type Aba = 'hoje' | 'comandos' | 'arquivos' | 'visual'

declare module 'claude-code' {
  interface PluginState {
    'boost-painel': {
      uso: Shaped<Uso>
      lembretes: Shaped<Lembrete[]>
      projetos: Shaped<Projeto[]>
      caixa: Shaped<Caixa>
      contagem: Shaped<Contagem>
      inicio: Shaped<Inicio>
      aba: Shaped<Aba>
    }
  }
}
