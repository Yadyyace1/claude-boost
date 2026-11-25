---
name: deploy-vercel
description: Publicar e acompanhar um site na Vercel — conectar o repositório, variáveis de ambiente, ver o status e os logs de um deploy, achar o erro de build, voltar para a versão anterior. Use quando o usuário pedir para colocar o site no ar, fazer deploy, ver por que o deploy falhou ou ver erros do site em produção.
---

# Deploy na Vercel

## Conexão

O jeito mais simples é o **conector da Vercel** (Configurações → Conectores no app, ou `/mcp` no Claude Code para autorizar). Cada pessoa autoriza com a própria conta Vercel. Sem o conector, use a CLI (`npx vercel`), que pede login no navegador.

## Fluxo recomendado

1. **Código no GitHub** primeiro. Com o repositório ligado à Vercel, cada push gera um deploy de pré-visualização e cada merge na branch principal vai para produção. Não precisa rodar deploy à mão.
2. **Variáveis de ambiente** (chaves de API etc.) ficam no painel da Vercel, nunca no código. Liste quais o projeto precisa e peça para a pessoa cadastrar.
3. **Deploy falhou?** Leia o log de build do deploy, ache a primeira mensagem de erro de verdade (não as linhas de aviso) e corrija no código.
4. **Erro em produção?** Veja primeiro os erros de runtime, depois os logs.
5. **Deu ruim no ar?** Voltar para o deploy anterior (rollback) é mais rápido que corrigir correndo. **Pergunte antes** de promover ou fazer rollback em produção.

## Limites

- Domínio, plano pago e qualquer compra: só com o OK explícito e mostrando o preço.
- Nunca mostre o valor de variáveis secretas na conversa.
