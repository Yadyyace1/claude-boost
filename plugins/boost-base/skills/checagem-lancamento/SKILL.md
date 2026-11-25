---
name: checagem-lancamento
description: Checagem de segurança antes de lançar um app ou site — 20 verificações (segredos no código e no histórico do git, RLS, autenticação e autorização no servidor, cookies, senhas, rate limit, bots, SQL, validação, uploads, respostas da API, cabeçalhos, HTTPS, dependências) com resultado por item e correções em ordem de risco. Use quando o usuário for publicar, lançar ou colocar no ar um app, site ou API, ou pedir uma revisão de segurança antes do lançamento.
---

# Checagem pré-lançamento

App feito com IA costuma funcionar e ainda assim estar aberto. Esta checagem passa pelas 20 falhas mais comuns antes de ir para o ar.

## Como fazer

1. Descubra a pilha (framework, banco, provedor de login, hospedagem) lendo o projeto.
2. Passe pelas 20 verificações abaixo **olhando o código de verdade** (arquivo e linha), não por suposição. O que não se aplica ao projeto fica como N/A.
3. Entregue a tabela e as correções. **Pergunte antes de alterar** qualquer coisa.

## As 20 verificações

**Segredos**
1. **Chaves fora do código:** nada de chave em arquivo versionado. Vai para `.env` (no `.gitignore`) e para as variáveis do provedor de hospedagem. Chave secreta nunca no front-end (cuidado com prefixos públicos como `NEXT_PUBLIC_` e `VITE_`).
2. **Histórico do git limpo:** procure segredos em commits antigos (`gitleaks` ou `trufflehog`). Se uma chave já vazou, **troque a chave**; apagar do histórico não basta.

**Dados**
3. **RLS ligado** em toda tabela exposta (Supabase/Postgres), com políticas testadas para usuário logado, outro usuário e anônimo.
4. **Criptografia:** HTTPS em trânsito; dados sensíveis (documentos, tokens de terceiros) criptografados no banco.

**Acesso**
5. **Autenticação no servidor:** toda rota protegida confere a sessão no servidor. Esconder botão no front não protege nada.
6. **Restrição de acesso:** o usuário A não consegue ler nem alterar dado do usuário B trocando o id na URL ou no corpo da requisição.
7. **Mass assignment:** o servidor aceita só os campos esperados (lista branca). Ninguém consegue mandar `role: "admin"` ou `plano: "pro"` no corpo.
8. **Cookies seguros:** sessão com `HttpOnly`, `Secure` e `SameSite`.
9. **Senhas com hash forte** (argon2 ou bcrypt), nunca em texto puro. Melhor ainda: usar um provedor de login pronto.

**Abuso**
10. **Rate limit** em login, cadastro, recuperação de senha, envio de e-mail e rotas caras (IA, pagamento).
11. **Proteção contra bots** nos formulários públicos (Turnstile, reCAPTCHA ou similar).

**Entrada e saída**
12. **Queries parametrizadas** ou ORM. Nunca montar SQL juntando texto com o que o usuário digitou.
13. **Validação de entrada no servidor** (tipo, tamanho, formato; por exemplo com `zod`).
14. **Não vazar conteúdo em erro:** mensagem genérica para o usuário, detalhes (stack trace, SQL) só no log. Logs sem senha, token ou dado pessoal.
15. **Uploads restritos:** tipo e tamanho conferidos no servidor, nome de arquivo aleatório, armazenamento privado, nunca executar o que subiu.
16. **Respostas da API enxutas:** devolver só os campos que a tela usa. Nada de hash de senha, e-mail de outros usuários ou campos internos.

**Transporte e cabeçalhos**
17. **Cabeçalhos de segurança:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, proteção contra iframe (`frame-ancestors`). CORS liberado só para os domínios do app.
18. **HTTPS em tudo**, com redirecionamento de http para https.

**Dependências**
19. **Vulnerabilidades conhecidas:** `npm audit` (ou o equivalente da linguagem); atualizar o que for crítico.
20. **Pacotes maliciosos ou inventados:** confira se cada pacote existe, é o oficial e é mantido. Nome parecido com um famoso (erro de digitação) e pacote que a IA sugeriu mas ninguém usa são sinais de alerta. Use lockfile.

## Entregar

| # | Verificação | Resultado | Onde (arquivo:linha) | Correção |
|---|---|---|---|---|
| 1 | Chaves fora do código | ❌ Falha | `src/lib/api.ts:4` | mover para `.env` e trocar a chave |

Depois da tabela: as correções em ordem de risco (o que expõe dado de usuário ou dinheiro primeiro) e a pergunta "quer que eu corrija os itens X, Y e Z?".

## Ferramentas que ajudam

- **`/security-review`**: comando do próprio Claude Code que revisa as mudanças pendentes da branch atual procurando falhas.
- **Plugin oficial `claude-security`** (marketplace da Anthropic): mapeia o código, procura falhas exploráveis e propõe correções.
  - Instalar: `claude plugin install claude-security@claude-plugins-official`
  - Custo: cerca de 1,9 mil tokens fixos por sessão, mais 5 hooks. **Desligue quando não estiver programando:** `claude plugin disable claude-security@claude-plugins-official` (e `enable` para ligar de novo).

Esta checagem reduz bastante o risco, mas não é auditoria profissional. App com dinheiro, saúde ou dados sensíveis merece uma revisão humana também.
