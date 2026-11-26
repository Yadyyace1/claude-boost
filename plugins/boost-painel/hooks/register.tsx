import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Lembrete, Uso } from '../types'

const PAINEL = 'boost-hoje'
const VAZIO: Uso = { contexto: null, cincoHoras: null, semana: null, reset5h: null }
const uso = atom({ plugin: 'boost-painel', key: 'uso' } as const, VAZIO, { shape: 'uso-1' })
const lembretes = atom({ plugin: 'boost-painel', key: 'lembretes' } as const, [] as Lembrete[], { shape: 'lembretes-1' })

const DICAS = [
  'Assunto novo? Use /clear: o Claude começa leve e gasta menos do seu limite.',
  'Conversa longa? /compact resume o que importa e libera espaço.',
  'Para buscas grandes, peça para usar um subagente: o resultado volta resumido.',
  'Cole o caminho do arquivo com @ em vez de colar o texto inteiro.',
  'Tarefas simples (renomear, formatar) saem mais baratas num modelo menor: /model.',
  'Antes de uma mudança grande, peça um plano primeiro e aprove só depois.',
  'Guarde preferências no seu CLAUDE.md: o Claude lê toda sessão e você não precisa repetir.',
]

function saudacao(hora: number) {
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function deUso(context: SessionContextUsage, limites: SessionRateLimit[]): Uso {
  const achar = (kind: string) => limites.find(l => l.kind === kind)
  const cinco = achar('five_hour')
  const semana = achar('seven_day')
  return {
    contexto: context.percent ?? null,
    cincoHoras: cinco ? cinco.percentUsed : null,
    semana: semana ? semana.percentUsed : null,
    reset5h: cinco?.resetsAt ?? null,
  }
}

async function carregarLembretes($: EngineInterface) {
  const salvos = (await $.store.get('lembretes')) as Lembrete[] | undefined
  if (Array.isArray(salvos)) await update($, lembretes, () => salvos)
}

async function salvarLembretes($: EngineInterface, mudar: (l: Lembrete[]) => Lembrete[]) {
  await update($, lembretes, mudar)
  await $.store.set('lembretes', await read($, lembretes))
}

async function abrir($: EngineInterface) {
  return $.ui.open({ id: PAINEL, title: 'Hoje' })
}

export const register: Register = (on, options) => {
  const nome = String(options.nome ?? '').trim()
  const atalhos = String(options.atalhos ?? '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 6)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'painel', description: 'Abre o painel Hoje do Claude Boost' })
    await $.command.register({ name: 'lembrete', description: 'Anota um lembrete no painel Hoje (ex.: /lembrete ligar para o Renan)' })
    await carregarLembretes($)
    const atual = await $.session.usage()
    await update($, uso, () => deUso(atual.context, atual.rateLimits))
    if (options.abrir !== false) void abrir($)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, uso, () => deUso(e.context, e.rateLimits))
    return next(e)
  })

  on('command.run', { command: 'painel' }, async $ => {
    await abrir($)
    return { text: 'Painel Hoje aberto.' }
  })

  on('command.run', { command: 'lembrete' }, async ($, e) => {
    const texto = e.args.trim()
    if (!texto) return { text: 'Escreva o lembrete depois do comando: /lembrete pagar a conta de luz' }
    const id = String(await $.clock.now())
    await salvarLembretes($, l => [...l, { id, texto, feito: false }].slice(-30))
    void abrir($)
    return { text: `Anotado no painel: ${texto}` }
  })

  on('ui.render', { component: 'Pane', requestId: PAINEL }, async ($, e) => {
    const { Box, Text, Button, Progress } = $.ui.resolve(e)
    const agora = new Date(await $.clock.now())
    const u = await read($, uso)
    const lista = await read($, lembretes)
    const pendentes = lista.filter(l => !l.feito)
    const dica = DICAS[Math.floor(agora.getTime() / 86_400_000) % DICAS.length]
    const data = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const reset = u.reset5h ? new Date(u.reset5h).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text size="heading" weight="semibold">{saudacao(agora.getHours())}{nome ? `, ${nome}` : ''}!</Text>
          <Text dimColor>{data}</Text>
        </Box>

        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">Seu uso</Text>
          {u.contexto !== null && <Progress label="Contexto da conversa" value={u.contexto / 100} valueText={`${Math.round(u.contexto)}%`} />}
          {u.cincoHoras !== null && <Progress label="Limite de 5 horas" value={u.cincoHoras / 100} valueText={`${Math.round(u.cincoHoras)}%${reset ? ` · zera às ${reset}` : ''}`} />}
          {u.semana !== null && <Progress label="Limite da semana" value={u.semana / 100} valueText={`${Math.round(u.semana)}%`} />}
          {u.contexto === null && u.cincoHoras === null && <Text dimColor>Os números aparecem depois da primeira resposta.</Text>}
          {(u.contexto ?? 0) >= 70 && <Text dimColor>Conversa pesada: um /compact agora economiza.</Text>}
        </Box>

        {atalhos.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Text weight="semibold">Atalhos</Text>
            {atalhos.map((a, i) => (
              <Button key={`atalho-${i}`} label={a} onPress={() => void $.prompt.submit({ text: a })} />
            ))}
          </Box>
        )}

        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">Lembretes {pendentes.length ? `(${pendentes.length})` : ''}</Text>
          {lista.length === 0 && <Text dimColor>Nenhum ainda. Anote com /lembrete seu texto.</Text>}
          {lista.map(l => (
            <Button
              key={`lembrete-${l.id}`}
              onPress={() => void salvarLembretes($, all => (l.feito ? all.filter(x => x.id !== l.id) : all.map(x => (x.id === l.id ? { ...x, feito: true } : x))))}
            >
              {l.feito ? '✓ ' : '○ '}{l.texto} <Text dimColor>{l.feito ? '(clique para apagar)' : ''}</Text>
            </Button>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text weight="semibold">Dica do dia</Text>
          <Text dimColor>{dica}</Text>
        </Box>
      </Box>
    )
  })
}
