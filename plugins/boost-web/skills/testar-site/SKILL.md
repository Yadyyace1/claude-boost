---
name: testar-site
description: Testar e depurar um site com navegador automatizado (Playwright e Chrome DevTools) — abrir a página, clicar, preencher formulário de teste, tirar print, ver erros do console e da rede, medir desempenho (Lighthouse), testar no celular. Use quando o usuário pedir para testar, conferir, depurar ou tirar print de um site ou app web.
---

# Testar um site

## Ferramenta

- **Playwright** (MCP `playwright`): navegar, clicar, digitar, preencher formulário, print. Bom para testar um fluxo de ponta a ponta.
- **Chrome DevTools** (MCP `chrome-devtools`): console, rede, desempenho, Lighthouse, estilos CSS. Bom para descobrir *por que* algo quebrou ou está lento.
- No app desktop do Claude também existe o navegador embutido; qualquer um serve para olhar a página.

## Roteiro

1. **Abra a página** e leia o conteúdo pelo snapshot/texto (mais barato em tokens que print). Tire print só para mostrar algo visual.
2. **Erros primeiro:** console (erros de JavaScript) e rede (requisições 4xx/5xx).
3. **Fluxo principal:** faça o caminho que o usuário real faz (ex.: home → produto → formulário) e anote onde quebra.
4. **Celular:** redimensione para 375×812 e repita o essencial.
5. **Desempenho (se pedido):** Lighthouse pelo Chrome DevTools; traga as 3 melhorias de maior impacto, não a lista inteira.
6. **Relatório:** o que funciona, o que quebrou (com o passo para reproduzir e a mensagem de erro) e a correção provável.

## Limites

- Só preencha formulário com **dados de teste** e em site da própria pessoa (localhost ou ambiente de teste). Nunca senha real, cartão ou documento.
- Nunca clique em "comprar", "enviar" ou "publicar" em site real sem o OK explícito.
- Não resolva CAPTCHA.
