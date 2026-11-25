# Roteiro da consultoria (~1h por pessoa)

Objetivo: a pessoa sai com o Claude configurado para o trabalho dela **e** com uma tarefa real resolvida na frente dela. É a tarefa real que convence.

## Antes (5 min, por mensagem)

- Perguntar: Windows ou Mac? Usa Claude Pro, Max ou nada ainda? Quais 3 tarefas tomam mais tempo?
- Pedir para trazer **um arquivo ou tarefa real** para a sessão (planilha, vídeo, texto, site).
- Abrir a ficha dela (modelo em `FICHA-CLIENTE.md`) no vault.

## Sessão

| Tempo | Etapa | O que fazer |
|---|---|---|
| 0–10 | **Diagnóstico** | conversar sobre o trabalho dela; preencher a ficha; se ela já usa o Claude Code, rodar `ccusage daily` e anotar o consumo na ficha (o "antes") |
| 10–25 | **Instalação** | pré-requisitos, marketplace, `boost-base`, `/boost-base:boost-setup` (status line) |
| 25–35 | **Perfil** | `/boost-base:diagnostico` → módulos recomendados → `CLAUDE.md` pessoal (ler junto antes de gravar) |
| 35–40 | **Conectores** | ligar na conta dela só os que ela usa (Configurações → Conectores) |
| 40–55 | **Tarefa real** | resolver a tarefa que ela trouxe, com ela digitando |
| 55–60 | **Fechamento** | mostrar `/clear`, a status line e onde pedir ajuda; combinar o retorno |

## Regras da sessão

- **Ela digita, você orienta.** Quem só assiste não aprende o caminho.
- Mostrar sempre que o Claude **pergunta antes** de agir (enviar, apagar, instalar, gastar). Isso dá segurança.
- Nada de chave, senha ou token seu na máquina dela. Cada um usa a própria conta.
- Instalar só os módulos que ela vai usar na semana seguinte.

## Depois (1 semana)

- Mensagem perguntando: o que usou? o que travou? o que faltou?
- Pedir o `ccusage daily` de novo e comparar com o "antes" da ficha.
- Toda dor que se repetir em mais de uma pessoa vira melhoria do kit (skill nova ou ajuste), registrada no `CHANGELOG.md` com nova versão.
- Atualizar a ficha dela.

## Agenda atual

- Karina — feita (incorporar o material dela ao kit).
- Renan — 26/11/2026.
- Rafael — 27/11/2026 (sexta).
