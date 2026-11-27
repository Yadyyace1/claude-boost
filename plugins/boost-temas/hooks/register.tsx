import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { PALETAS, type Paleta } from './paletas'
import { AURORA, ESTRELAS, FAISCAS, OCEANO, SYNTHWAVE } from './cenas'

const CENAS: Record<string, { svg: string; alt: string }> = {
  synthwave: { svg: SYNTHWAVE, alt: 'Pôr do sol neon com uma grade andando devagar' },
  oceano: { svg: OCEANO, alt: 'Ondas lentas no pé da tela' },
  aurora: { svg: AURORA, alt: 'Luzes do norte ondulando devagar' },
  estrelas: { svg: ESTRELAS, alt: 'Céu com estrelas piscando devagar' },
  faiscas: { svg: FAISCAS, alt: 'Faíscas âmbar subindo devagar' },
}

type Fundo = 'tema' | 'cor' | 'degrade' | 'foto' | 'nenhum'
type Opcoes = { tema: string; cenario: boolean; fundo: Fundo; cor: string; degrade: string[]; foto: string; estilo: string }

const HEX = /^#[0-9a-fA-F]{6}$/
// O fundo com foto é um mosaico em SVG feito pelo assistente do Spark (só retângulos coloridos).
const SO_RETANGULOS = /^<svg [^>]*>(\s*<rect [^<>]*\/>)+\s*<\/svg>\s*$/
let fotoSvg: string | null = null

function lerOpcoes(o: Record<string, unknown>): Opcoes {
  const fundo = (['tema', 'cor', 'degrade', 'foto', 'nenhum'] as const).find(f => f === o.fundo) ?? 'tema'
  const degrade = String(o.degrade ?? '').split(',').map(s => s.trim()).filter(c => HEX.test(c)).slice(0, 4)
  return {
    tema: String(o.tema ?? 'ambar'), cenario: o.cenario !== false, fundo,
    cor: HEX.test(String(o.cor ?? '')) ? String(o.cor) : '#141210', degrade, foto: String(o.foto ?? ''), estilo: String(o.estilo ?? 'padrao'),
  }
}

// Estilo das mensagens (só no app do desktop): bolhas arredondadas ou cartões com borda.
function estiloDas(estilo: string): ThemeSetArgs['style'] | undefined {
  if (estilo === 'bolhas') return {
    UserMessage: { radius: 20, backgroundColor: 'bg-user-message' },
    AssistantMessage: { radius: 20, backgroundColor: 'surface-1' },
  }
  if (estilo === 'cartoes') return {
    UserMessage: { radius: 10, backgroundColor: 'surface-2', borderColor: 'border-accent' },
    AssistantMessage: { radius: 10, backgroundColor: 'surface-1', borderColor: 'border' },
  }
  return undefined
}

function montar(p: Paleta, o: Opcoes, comExtras: boolean): ThemeSetArgs {
  const definicao: Parameters<typeof makeColors>[0] = { label: `Spark: ${p.nome}`, roles: p.roles, dark: { gray: { anchors: p.dark as never } } }
  if (p.light) definicao.light = { gray: { anchors: p.light as never } }
  else (definicao as { only?: 'dark' }).only = 'dark'
  const { theme } = makeColors(definicao)
  const look: ThemeSetArgs = { colors: theme }
  if (!comExtras) return look
  if (o.fundo === 'tema' && o.cenario && p.cena) look.backdrop = { scene: p.cena, glass: { blur: 18, opacity: 0.7 } }
  else if (o.fundo === 'cor') look.backdrop = { color: o.cor as `#${string}` }
  else if (o.fundo === 'degrade' && o.degrade.length >= 2) look.backdrop = { gradient: { stops: o.degrade as `#${string}`[] } } as ThemeSetArgs['backdrop']
  else if (o.fundo === 'foto' && fotoSvg) look.backdrop = { scene: 'foto', glass: { blur: 22, opacity: 0.72 } }
  const estilo = estiloDas(o.estilo)
  if (estilo) look.style = estilo
  return look
}

function porId(id: string): Paleta {
  return PALETAS.find(p => p.id === id) ?? (PALETAS[0] as Paleta)
}

// Lê o mosaico da foto, se a pessoa escolheu um: só aceita o formato que o assistente gera.
async function carregarFoto($: EngineInterface, o: Opcoes) {
  fotoSvg = null
  if (o.fundo !== 'foto' || !o.foto.toLowerCase().endsWith('.svg')) return
  try {
    const texto = String(await $.fs.read(o.foto))
    if (texto.length < 131_000 && SO_RETANGULOS.test(texto)) fotoSvg = texto
    else $.ui.log('boost-temas: o fundo com foto não está no formato do Spark; usando o fundo do tema')
  } catch {
    $.ui.log(`boost-temas: não achei o fundo com foto em ${o.foto}`)
  }
}

async function aplicar($: EngineInterface, id: string, o: Opcoes) {
  const p = porId(id)
  try {
    return await $.theme.set(montar(p, o, true))
  } catch (erro) {
    // Uma versão do app que não aceite algo do look (cenário, estilo): tenta só com as cores.
    $.ui.log(`boost-temas: ${String(erro)}`)
    return await $.theme.set(montar(p, o, false))
  }
}

export const register: Register = (on, options) => {
  const o = lerOpcoes(options as Record<string, unknown>)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tema', description: 'Troca o tema do Spark (ex.: /tema aurora). Sem nome, lista os temas.' })
    await carregarFoto($, o)
    await aplicar($, o.tema, o)
    return next(e)
  })

  on('command.run', { command: 'tema' }, async ($, e) => {
    const pedido = e.args.trim().toLowerCase()
    const lista = PALETAS.map(p => `- **${p.id}**: ${p.nome}. ${p.descricao}${p.cena ? ' (fundo animado)' : ''}`).join('\n')
    if (!pedido) return { text: `Temas disponíveis (use /tema <nome>):\n${lista}\n\nFundo, cores e estilo das mensagens: /config → boost-temas.` }
    const p = PALETAS.find(x => x.id === pedido || x.nome.toLowerCase() === pedido)
    if (!p) return { text: `Não conheço o tema "${pedido}". Temas:\n${lista}` }
    // Grava na configuração do plugin: vale para as próximas sessões também.
    const gravado = await $.config.set({ key: 'boost-temas.tema', value: p.id })
    const r = await aplicar($, p.id, o)
    const aviso = 'deny' in gravado ? ' (só nesta sessão: não consegui salvar a escolha)' : ''
    return { text: r.isDrawn ? `Tema **${p.nome}** aplicado${aviso}.` : `Tema ${p.nome} escolhido${aviso}. Ele aparece no app do Claude (o terminal não desenha temas).` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const cena = (e.props as { scene?: string }).scene
    const { Svg } = $.ui.resolve(e)
    if (cena === 'foto' && fotoSvg) return <Svg source={fotoSvg} alt="Fundo com a foto escolhida, em mosaico" />
    const c = cena ? CENAS[cena] : undefined
    if (!c) return next(e)
    return <Svg source={c.svg} alt={c.alt} />
  })
}
