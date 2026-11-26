// As paletas dos temas do Claude Boost. Cada uma vira um tema completo com makeColors (claro e escuro).
export type Paleta = {
  id: string
  nome: string
  descricao: string
  roles: Record<'accent' | 'danger' | 'success' | 'warning' | 'pro', string>
  light?: Record<string, string>
  dark: Record<string, string>
  cena?: 'synthwave' | 'oceano'
  fundo?: { claro: [string, string]; escuro: [string, string] }
}

export const PALETAS: Paleta[] = [
  {
    id: 'ambar', nome: 'Âmbar', descricao: 'Quente e acolhedor: madeira, cobre e luz de abajur.',
    roles: { accent: '#d98a1c', danger: '#c2412d', success: '#4f8a3c', warning: '#b7791f', pro: '#8a5cc2' },
    light: { 'surface-0': '#f3ece1', 'surface-1': '#f7f1e7', 'surface-2': '#fbf7f0', 'text-primary': '#2a2016', 'text-secondary': '#574634', 'text-muted': '#6e5c48' },
    dark: { 'surface-0': '#17130e', 'surface-1': '#1e1913', 'surface-2': '#252019', 'surface-3': '#2c261e', 'text-primary': '#f3e9da', 'text-secondary': '#d3c6b1', 'text-muted': '#a99a84' },
  },
  {
    id: 'synthwave', nome: 'Synthwave', descricao: 'Neon dos anos 80: pôr do sol roxo e grade em movimento.',
    roles: { accent: '#ff4fd8', danger: '#ff5a6e', success: '#3ddc97', warning: '#ffb347', pro: '#9d7bff' },
    dark: { 'surface-0': '#120b1f', 'surface-1': '#181029', 'surface-2': '#1f1533', 'surface-3': '#241939', 'text-primary': '#f6ecff', 'text-secondary': '#d6c3f0', 'text-muted': '#a993c9' },
    cena: 'synthwave',
  },
  {
    id: 'floresta', nome: 'Floresta', descricao: 'Verdes calmos de mata e musgo, bom para longas sessões.',
    roles: { accent: '#3f8f5a', danger: '#c0473a', success: '#4e9a3e', warning: '#b9852a', pro: '#7a6bb5' },
    light: { 'surface-0': '#eef3ec', 'surface-1': '#f3f7f1', 'surface-2': '#f9fbf7', 'text-primary': '#1c2a20', 'text-secondary': '#3f5446', 'text-muted': '#55695b' },
    dark: { 'surface-0': '#0f1712', 'surface-1': '#141f18', 'surface-2': '#19261e', 'surface-3': '#1d2b22', 'text-primary': '#e6f1e9', 'text-secondary': '#bdd1c3', 'text-muted': '#93aa9a' },
    fundo: { escuro: ['#0f1712', '#132219'], claro: ['#eef3ec', '#e3ede0'] },
  },
  {
    id: 'oceano', nome: 'Oceano', descricao: 'Azuis profundos com ondas lentas ao fundo.',
    roles: { accent: '#2b8fd6', danger: '#d0503f', success: '#2f9e7a', warning: '#c28a2c', pro: '#7b6fd6' },
    light: { 'surface-0': '#eaf2f8', 'surface-1': '#f0f6fb', 'surface-2': '#f7fbfe', 'text-primary': '#10263a', 'text-secondary': '#33506b', 'text-muted': '#4a6680' },
    dark: { 'surface-0': '#0b1520', 'surface-1': '#0f1c29', 'surface-2': '#132331', 'surface-3': '#172838', 'text-primary': '#e4f0fa', 'text-secondary': '#b8cde0', 'text-muted': '#8ea7bd' },
    cena: 'oceano',
  },
  {
    id: 'caderno', nome: 'Caderno', descricao: 'Papel de dia e papel à luz de abajur à noite.',
    roles: { accent: '#2f5d8c', danger: '#b3392f', success: '#4e7d3a', warning: '#a86f14', pro: '#6d4f94' },
    light: { 'surface-0': '#efe6d3', 'surface-1': '#f4ecdc', 'surface-2': '#faf5e9', 'text-primary': '#2a241d', 'text-secondary': '#544a3d', 'text-muted': '#6a5f50' },
    dark: { 'surface-0': '#1f1a15', 'surface-1': '#28221b', 'surface-2': '#312a22', 'surface-3': '#3a3229', 'text-primary': '#f0e7d7', 'text-secondary': '#cfc4b2', 'text-muted': '#aca08d' },
  },
  {
    id: 'grafite', nome: 'Grafite', descricao: 'Neutro e minimalista: cinzas limpos e um azul discreto.',
    roles: { accent: '#6e8efb', danger: '#e5534b', success: '#57ab5a', warning: '#c69026', pro: '#986ee2' },
    light: { 'surface-0': '#f2f2f2', 'surface-1': '#f7f7f7', 'surface-2': '#fcfcfc', 'text-primary': '#1a1a1a', 'text-secondary': '#444444', 'text-muted': '#5c5c5c' },
    dark: { 'surface-0': '#141414', 'surface-1': '#1b1b1b', 'surface-2': '#222222', 'surface-3': '#272727', 'text-primary': '#ededed', 'text-secondary': '#c4c4c4', 'text-muted': '#9a9a9a' },
  },
  {
    id: 'royal', nome: 'Azul Royal', descricao: 'Azul royal com pêssego: forte, divertido e com personalidade.',
    roles: { accent: '#2b4bc7', danger: '#c2412d', success: '#3f8f5a', warning: '#c58a1d', pro: '#8a5cc2' },
    light: { 'surface-0': '#fbeee2', 'surface-1': '#fdf3ea', 'surface-2': '#fffaf5', 'text-primary': '#1a1f3d', 'text-secondary': '#3b4470', 'text-muted': '#555e8a' },
    dark: { 'surface-0': '#0e1230', 'surface-1': '#131840', 'surface-2': '#181e4c', 'surface-3': '#1c2353', 'text-primary': '#eef1ff', 'text-secondary': '#c5ccef', 'text-muted': '#9aa3d6' },
  },
]
