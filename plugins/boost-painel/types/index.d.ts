export type Uso = { contexto: number | null; cincoHoras: number | null; semana: number | null; reset5h: string | null }
export type Lembrete = { id: string; texto: string; feito: boolean }

declare module 'claude-code' {
  interface PluginState {
    'boost-painel': { uso: Shaped<Uso>; lembretes: Shaped<Lembrete[]> }
  }
}
