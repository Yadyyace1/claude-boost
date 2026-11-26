import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { PALETAS, type Paleta } from './paletas'
import { OCEANO, SYNTHWAVE } from './cenas'

const CENAS = {
  synthwave: { svg: SYNTHWAVE, alt: 'Pôr do sol neon com uma grade andando devagar' },
  oceano: { svg: OCEANO, alt: 'Ondas lentas no pé da tela' },
}

function montar(p: Paleta, comCena: boolean): ThemeSetArgs {
  const definicao: Parameters<typeof makeColors>[0] = { label: `Claude Boost: ${p.nome}`, roles: p.roles, dark: { gray: { anchors: p.dark as never } } }
  if (p.light) definicao.light = { gray: { anchors: p.light as never } }
  else (definicao as { only?: 'dark' }).only = 'dark'
  const { theme } = makeColors(definicao)
  const look: ThemeSetArgs = { colors: theme }
  if (comCena && p.cena) look.backdrop = { scene: p.cena, glass: { blur: 18, opacity: 0.7 } }
  return look
}

function porId(id: string): Paleta {
  return PALETAS.find(p => p.id === id) ?? (PALETAS[0] as Paleta)
}

async function aplicar($: EngineInterface, id: string, comCena: boolean) {
  const p = porId(id)
  try {
    return await $.theme.set(montar(p, comCena))
  } catch (erro) {
    // Uma versão do app que não aceite algo do look: tenta só com as cores.
    $.ui.log(`boost-temas: ${String(erro)}`)
    return await $.theme.set(montar(p, false))
  }
}

export const register: Register = (on, options) => {
  const comCena = options.cenario !== false

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tema', description: 'Troca o tema do Claude Boost (ex.: /tema oceano). Sem nome, lista os temas.' })
    await aplicar($, String(options.tema ?? 'ambar'), comCena)
    return next(e)
  })

  on('command.run', { command: 'tema' }, async ($, e) => {
    const pedido = e.args.trim().toLowerCase()
    const lista = PALETAS.map(p => `- **${p.id}**: ${p.nome}. ${p.descricao}`).join('\n')
    if (!pedido) return { text: `Temas disponíveis (use /tema <nome>):\n${lista}` }
    const p = PALETAS.find(x => x.id === pedido || x.nome.toLowerCase() === pedido)
    if (!p) return { text: `Não conheço o tema "${pedido}". Temas:\n${lista}` }
    // Grava na configuração do plugin: vale para as próximas sessões também.
    const gravado = await $.config.set({ key: 'boost-temas.tema', value: p.id })
    const r = await aplicar($, p.id, comCena)
    const aviso = 'deny' in gravado ? ' (só nesta sessão: não consegui salvar a escolha)' : ''
    return { text: r.isDrawn ? `Tema **${p.nome}** aplicado${aviso}.` : `Tema ${p.nome} escolhido${aviso}. Ele aparece no app do Claude (o terminal não desenha temas).` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const cena = CENAS[(e.props as { scene?: string }).scene as keyof typeof CENAS]
    if (!cena) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={cena.svg} alt={cena.alt} />
  })
}
