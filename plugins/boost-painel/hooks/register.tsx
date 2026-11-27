import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Arquivo, Caixa, Contagem, Inicio, Lembrete, Projeto, Uso } from '../types'

// O painel "Hoje" do Spark: na página de criar (a faixa acima da caixa de mensagem, enquanto a conversa
// está vazia) e, completo, ao lado do chat (/painel).
const PAINEL = 'boost-hoje'
const uso = atom({ plugin: 'boost-painel', key: 'uso' } as const, { contexto: null, cincoHoras: null, semana: null, reset5h: null } as Uso, { shape: 'uso-1' })
const lembretes = atom({ plugin: 'boost-painel', key: 'lembretes' } as const, [] as Lembrete[], { shape: 'lembretes-1' })
const projetos = atom({ plugin: 'boost-painel', key: 'projetos' } as const, [] as Projeto[], { shape: 'projetos-1' })
const caixa = atom({ plugin: 'boost-painel', key: 'caixa' } as const, { pasta: '', arquivos: [] } as Caixa, { shape: 'caixa-1' })
const contagem = atom({ plugin: 'boost-painel', key: 'contagem' } as const, { dia: '', conversas: 0 } as Contagem, { shape: 'contagem-1' })
const inicio = atom({ plugin: 'boost-painel', key: 'inicio' } as const, { mensagens: 0, oculto: false } as Inicio, { shape: 'inicio-1' })

const TEMAS: [string, string][] = [['ambar', 'Âmbar'], ['synthwave', 'Synthwave'], ['floresta', 'Floresta'], ['oceano', 'Oceano'], ['caderno', 'Caderno'], ['grafite', 'Grafite'], ['royal', 'Royal']]

const DICAS = [
  'Assunto novo? Use /clear: o Claude começa leve e gasta menos do seu limite.',
  'Conversa longa? /compact resume o que importa e libera espaço.',
  'Para buscas grandes, peça para usar um subagente: o resultado volta resumido.',
  'Cole o caminho do arquivo com @ em vez de colar o texto inteiro.',
  'Tarefas simples (renomear, formatar) saem mais baratas num modelo menor: /model.',
  'Antes de uma mudança grande, peça um plano primeiro e aprove só depois.',
  'Guarde preferências no seu CLAUDE.md: o Claude lê toda sessão e você não precisa repetir.',
  'Faça um backup das suas configurações de vez em quando: é um clique aqui no painel.',
]

function saudacao(hora: number) {
  return hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
}

function deUso(context: SessionContextUsage, limites: SessionRateLimit[]): Uso {
  const cinco = limites.find(l => l.kind === 'five_hour')
  const semana = limites.find(l => l.kind === 'seven_day')
  return { contexto: context.percent ?? null, cincoHoras: cinco ? cinco.percentUsed : null, semana: semana ? semana.percentUsed : null, reset5h: cinco?.resetsAt ?? null }
}

function nomeDaPasta(caminho: string) {
  const partes = caminho.split(/[\\/]/).filter(Boolean)
  return partes[partes.length - 1] ?? caminho
}

function haQuanto(ms: number, agora: number) {
  const min = Math.round((agora - ms) / 60000)
  if (min < 60) return min <= 1 ? 'agora' : `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}

function tamanho(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
}

async function pastaDaCaixa($: EngineInterface) {
  const casa = (await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || ''
  return `${casa}${casa.includes('\\') ? '\\' : '/'}Spark${casa.includes('\\') ? '\\' : '/'}Caixa de entrada`
}

async function lerCaixa($: EngineInterface) {
  const pasta = await pastaDaCaixa($)
  const sep = pasta.includes('\\') ? '\\' : '/'
  if (!(await $.fs.exists(pasta))) {
    await $.fs.write(`${pasta}${sep}LEIA-ME.txt`, 'Jogue aqui arquivos (PDF, planilhas, imagens, textos) e clique em "Analisar os arquivos" no painel Hoje do Claude.\n')
  }
  const itens = await $.fs.list(pasta)
  const arquivos: Arquivo[] = itens
    .filter(i => i.kind === 'file' && i.name !== 'LEIA-ME.txt')
    .map(i => ({ nome: i.name, tamanho: i.size ?? 0, quando: i.mtimeMs ?? 0 }))
    .sort((a, b) => b.quando - a.quando)
  await update($, caixa, () => ({ pasta, arquivos }))
}

async function lembrarProjeto($: EngineInterface, caminho: string, agora: number) {
  const salvos = ((await $.store.get('projetos')) as Projeto[] | undefined) ?? []
  const outro = salvos.filter(p => p.caminho !== caminho)
  const antes = salvos.find(p => p.caminho === caminho)
  const lista = [{ caminho, nome: nomeDaPasta(caminho), ultimo: agora, vezes: (antes?.vezes ?? 0) + 1 }, ...outro].slice(0, 12)
  await $.store.set('projetos', lista)
  await update($, projetos, () => lista)
}

async function contarConversa($: EngineInterface, agora: number) {
  const dia = new Date(agora).toISOString().slice(0, 10)
  const salvo = (await $.store.get('contagem')) as Contagem | undefined
  const nova = { dia, conversas: salvo?.dia === dia ? salvo.conversas + 1 : 1 }
  await $.store.set('contagem', nova)
  await update($, contagem, () => nova)
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

async function enviar($: EngineInterface, texto: string) {
  if (texto.trim()) await $.prompt.submit({ text: texto.trim() })
}

async function preencher($: EngineInterface, texto: string) {
  await $.prompt.fill({ text: texto })
}

async function trocarTema($: EngineInterface, id: string) {
  const r = await $.config.set({ key: 'boost-temas.tema', value: id })
  $.ui.toast('deny' in r ? 'Instale o boost-temas para trocar o tema por aqui.' : `Tema ${id} escolhido.`)
}

export const register: Register = (on, options) => {
  const nome = String(options.nome ?? '').trim()
  const atalhos = String(options.atalhos ?? '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 6)
  const skills = String(options.skills ?? '').split('|').map(s => s.trim()).filter(s => /^[a-z0-9-]+$/.test(s)).slice(0, 12)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'painel', description: 'Abre o painel Hoje do Spark' })
    await $.command.register({ name: 'lembrete', description: 'Anota um lembrete no painel Hoje (ex.: /lembrete ligar para o Renan)' })
    const agora = await $.clock.now()
    await carregarLembretes($)
    await lembrarProjeto($, e.cwd, agora)
    await contarConversa($, agora)
    await lerCaixa($).catch(() => undefined)
    const atual = await $.session.usage()
    await update($, uso, () => deUso(atual.context, atual.rateLimits))
    if (options.abrir === true) void abrir($)
    return next(e)
  })

  // A conversa começou: a página de criar sai da frente.
  on('prompt.submit', async ($, e, next) => {
    await update($, inicio, i => ({ ...i, mensagens: i.mensagens + 1 }))
    return next(e)
  })

  // Página de criar: o painel compacto acima da caixa de mensagem, só enquanto a conversa está vazia.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const ini = await read($, inicio)
    if (options.inicio === false || e.props.hasSurvey || e.props.isWorking || ini.mensagens > 0 || ini.oculto) return next(e)
    const { Box, Text, Button, Input } = $.ui.resolve(e)
    const agora = new Date(await $.clock.now())
    const u = await read($, uso)
    const medidas = [
      u.cincoHoras !== null ? `5 h: ${Math.round(u.cincoHoras)}%` : null,
      u.semana !== null ? `semana: ${Math.round(u.semana)}%` : null,
    ].filter(Boolean).join(' · ')
    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Text weight="semibold">✦ {saudacao(agora.getHours())}{nome ? `, ${nome}` : ''}!</Text>
          {medidas && <Text dimColor>uso {medidas}</Text>}
        </Box>
        <Input key="pedido-inicio" label="O que vamos criar hoje?" placeholder="Descreva e aperte Enter" submitLabel="criar" onSubmit={(v: string) => void enviar($, v)} />
        {atalhos.length > 0 && (
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {atalhos.map((a, i) => <Button key={`ini-atalho-${i}`} label={a} onPress={() => void enviar($, a)} />)}
          </Box>
        )}
        {skills.length > 0 && (
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Text dimColor>Skills:</Text>
            {skills.map(s => <Button key={`ini-skill-${s}`} label={`/${s}`} onPress={() => void preencher($, `/${s} `)} />)}
          </Box>
        )}
        <Box flexDirection="row" gap={1} flexWrap="wrap">
          <Button key="ini-painel" label="Painel completo" onPress={() => void abrir($)} />
          <Button key="ini-esconder" label="Esconder" onPress={() => void update($, inicio, i => ({ ...i, oculto: true }))} />
        </Box>
      </Box>
    )
  })

  on('session.measure', async ($, e, next) => {
    await update($, uso, () => deUso(e.context, e.rateLimits))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await lerCaixa($).catch(() => undefined)
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
    const { Box, Text, Button, Progress, Input, Link } = $.ui.resolve(e)
    void atalhos
    const agoraMs = await $.clock.now()
    const agora = new Date(agoraMs)
    const u = await read($, uso)
    const lista = await read($, lembretes)
    const projs = await read($, projetos)
    const cx = await read($, caixa)
    const cont = await read($, contagem)
    const pendentes = lista.filter(l => !l.feito)
    const dica = DICAS[Math.floor(agoraMs / 86_400_000) % DICAS.length]
    const data = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const reset = u.reset5h ? new Date(u.reset5h).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null
    const urlPasta = cx.pasta ? `file:///${cx.pasta.replace(/\\/g, '/').replace(/^\/+/, '')}` : ''

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text size="heading" weight="semibold">{saudacao(agora.getHours())}{nome ? `, ${nome}` : ''}!</Text>
          <Text dimColor>{data}</Text>
        </Box>

        <Input key="pedido" label="Pedir algo" placeholder="Escreva e aperte Enter" submitLabel="enviar" onSubmit={(v: string) => void enviar($, v)} />

        {skills.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Text weight="semibold">Suas skills</Text>
            <Box flexDirection="row" gap={1} flexWrap="wrap">
              {skills.map(s => <Button key={`skill-${s}`} label={`/${s}`} onPress={() => void preencher($, `/${s} `)} />)}
            </Box>
          </Box>
        )}

        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">Métricas</Text>
          <Text dimColor>{cont.conversas} {cont.conversas === 1 ? 'conversa' : 'conversas'} hoje · {projs.length} {projs.length === 1 ? 'projeto' : 'projetos'} · {pendentes.length} {pendentes.length === 1 ? 'lembrete' : 'lembretes'}</Text>
          {u.contexto !== null && <Progress label="Contexto da conversa" value={u.contexto / 100} valueText={`${Math.round(u.contexto)}%`} />}
          {u.cincoHoras !== null && <Progress label="Limite de 5 horas" value={u.cincoHoras / 100} valueText={`${Math.round(u.cincoHoras)}%${reset ? ` · zera às ${reset}` : ''}`} />}
          {u.semana !== null && <Progress label="Limite da semana" value={u.semana / 100} valueText={`${Math.round(u.semana)}%`} />}
          {u.contexto === null && u.cincoHoras === null && <Text dimColor>O uso aparece depois da primeira resposta.</Text>}
          {(u.contexto ?? 0) >= 70 && <Text dimColor>Conversa pesada: um /compact agora economiza.</Text>}
        </Box>

        {projs.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Text weight="semibold">Projetos recentes</Text>
            {projs.slice(0, 5).map(p => (
              <Link key={`proj-${p.caminho}`} href={`file:///${p.caminho.replace(/\\/g, '/').replace(/^\/+/, '')}`}>
                {p.nome} <Text dimColor>· {haQuanto(p.ultimo, agoraMs)} · {p.vezes}×</Text>
              </Link>
            ))}
          </Box>
        )}

        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">Caixa de arquivos {cx.arquivos.length ? `(${cx.arquivos.length})` : ''}</Text>
          {cx.arquivos.length === 0 && <Text dimColor>Jogue arquivos na pasta e o Claude analisa para você.</Text>}
          {cx.arquivos.slice(0, 6).map(a => (
            <Text key={`arq-${a.nome}`}>{a.nome} <Text dimColor>· {tamanho(a.tamanho)} · {haQuanto(a.quando, agoraMs)}</Text></Text>
          ))}
          {urlPasta && <Link href={urlPasta}>Abrir a pasta</Link>}
          {cx.arquivos.length > 0 && (
            <Button key="analisar" label="Analisar os arquivos" onPress={() => void enviar($, `Leia os arquivos da minha caixa de entrada (${cx.pasta}) e me diga, para cada um, o que ele é e o que dá para fazer com ele. Depois pergunte o que eu quero fazer.`)} />
          )}
          <Button key="atualizar-caixa" label="Atualizar" onPress={() => void lerCaixa($)} />
        </Box>

        <Box flexDirection="column" gap={1}>
          <Text weight="semibold">Personalizar o Claude</Text>
          <Text dimColor>Tema</Text>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            {TEMAS.map(([id, rotulo]) => <Button key={`tema-${id}`} label={rotulo} onPress={() => void trocarTema($, id)} />)}
          </Box>
          <Text dimColor>Modelo e conversa</Text>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Button key="modelo" label="Trocar o modelo" onPress={() => void preencher($, '/model ')} />
            <Button key="compactar" label="Compactar a conversa" onPress={() => void preencher($, '/compact')} />
            <Button key="nova" label="Nova conversa" onPress={() => void preencher($, '/clear')} />
            <Button key="config" label="Configurações" onPress={() => void preencher($, '/config')} />
            <Button key="conectores" label="Conectores (MCP)" onPress={() => void preencher($, '/mcp')} />
          </Box>
          <Text dimColor>Segurança</Text>
          <Box flexDirection="row" gap={1} flexWrap="wrap">
            <Button key="backup" label="Fazer backup agora" onPress={() => void preencher($, '/backup')} />
            <Button key="restaurar" label="Restaurar um backup" onPress={() => void preencher($, '/restaurar')} />
          </Box>
        </Box>

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
