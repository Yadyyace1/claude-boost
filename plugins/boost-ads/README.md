# boost-ads

Módulo de tráfego pago (Meta Ads: Facebook e Instagram) do Claude Boost. São 7 skills, uma por tarefa do dia a dia de quem gerencia anúncios:

| Skill | Quando usar |
|---|---|
| `diagnostico-campanha` | "minha campanha não está performando": acha o primeiro gargalo do funil e decide escalar, manter, ajustar ou pausar |
| `metas-trafego` | antes de começar: CPA máximo, ROAS de equilíbrio, CPL alvo, custo por conversa e 3 cenários de orçamento |
| `estrutura-campanha` | montar a conta: modelo de estrutura, protocolo de teste, checklist pré-lançamento e padrão de nomes |
| `criativos-ads` | gerar 8 a 12 conceitos de criativo a partir de persona, ângulo, formato, gancho e mensageiro |
| `copy-anuncio` | 5 variações de texto por ângulo, com a primeira frase pensada para segurar o "ver mais" |
| `auditor-politicas` | conferir risco de reprovação na Meta e, para advocacia, o Provimento 205/2021 da OAB |
| `relatorio-cliente` | relatório do período: resumo executivo, números, próximos passos e versão curta para WhatsApp |

## Instalar

Com o marketplace do kit já adicionado (ver o [guia de instalação](../../docs/GUIA-INSTALACAO.md)):

```powershell
claude plugin install boost-ads@claude-boost
```

## Dados

As skills funcionam com números colados na conversa ou exportados do Gerenciador de Anúncios (CSV). Com o conector da Meta ligado, o Claude lê os dados direto da conta.

## Ligar o conector oficial da Meta (opcional)

A Meta tem um servidor MCP oficial para anúncios, em beta aberto: `https://mcp.facebook.com/ads`. O login é pela própria conta do Facebook (OAuth), e você escolhe quais contas de anúncio o Claude pode ver.

**No app do Claude (claude.ai ou desktop):**

1. Configurações → Conectores → **Adicionar conector personalizado**.
2. Nome: `Meta Ads`. URL: `https://mcp.facebook.com/ads`.
3. Clique em **Conectar**, entre com a conta do Facebook que administra os anúncios e marque só as contas de anúncio que vai usar.

Se o conector "Meta Ads" já aparecer na lista de conectores da sua conta, é só ativá-lo.

**No Claude Code (terminal):**

```powershell
claude mcp add --transport http meta-ads https://mcp.facebook.com/ads
```

Depois, dentro do Claude Code, rode `/mcp`, escolha `meta-ads` e faça o login.

### Cuidados com o conector

- O conector **lê e também altera** a conta: cria campanhas, muda orçamento, ativa e pausa anúncios. As skills deste módulo só leem. Qualquer mudança (criar, ativar, pausar, mexer em orçamento ou público) o Claude **mostra antes e espera o seu OK**, uma ação por vez.
- Dê acesso só às contas de anúncio que você gerencia de verdade. Se atende vários clientes, prefira ligar uma conta por vez.
- É beta: ferramentas e nomes podem mudar. Se algo falhar, os números exportados em CSV continuam funcionando com todas as skills.
