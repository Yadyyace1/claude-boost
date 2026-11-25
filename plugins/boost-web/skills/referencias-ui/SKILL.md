---
name: referencias-ui
description: Referências para deixar a interface de um site mais caprichada — bibliotecas de blocos e microinterações (Bencho, MicroKit via shadcn), galerias de inspiração (Godly) e, opcionalmente, o pstack para o jeito de programar. Use quando o usuário pedir um site mais bonito, animações, microinterações, efeitos de hover, sons de interface, componentes prontos ou inspiração de design web.
---

# Referências de UI

São bibliotecas **por projeto**: entram no código do site, não na máquina. Antes de adicionar qualquer uma, confira a licença e se o projeto usa React/Next e Tailwind/shadcn.

## Bibliotecas

| Nome | O que é | Custo | Como usar |
|---|---|---|---|
| **Bencho** | blocos React interativos e sons de interface, organizados pelo gesto (arrastar, passar o mouse, deslizar...) | uma parte é grátis (MIT); a biblioteca completa, o código-fonte inteiro e o MCP são pagos | copiar o bloco grátis para o projeto; o pago é decisão da pessoa |
| **MicroKit** | microinterações prontas (botões, toggles, feedback de clique) para copiar e colar | grátis | pelo registro `@microkit` do shadcn (confira no site o nome exato de cada componente antes de instalar) |

## Inspiração

- **Godly** (galeria de sites bem desenhados): bom para escolher uma direção antes de codar. Mostre 3 ou 4 referências para a pessoa escolher, em vez de inventar um estilo.

## Regras para microinteração

1. **Pouco e com propósito:** animação confirma uma ação (clicou, salvou, deu erro) ou guia o olho. Enfeite em tudo cansa e pesa.
2. **Rápido:** de 150 a 300 ms para a maioria das transições.
3. **Respeite `prefers-reduced-motion`:** quem pediu menos movimento no sistema não recebe animação grande.
4. **Som é opcional e desligável**, nunca toca sozinho ao abrir a página.
5. Depois de adicionar, teste no celular e meça o desempenho (skill `testar-site`).

## Opcional: pstack (jeito de programar)

O **pstack** é um conjunto de skills de método de trabalho (planejar, validar o comportamento atual antes de mudar o código, trabalhar em paralelo com outros agentes). A versão para o Claude Code é um port feito **pela comunidade** (`michael-denyer/pstack-claude`, licença MIT, bem popular), não pela Anthropic.

- Ele instala um **hook** que liga o modo sozinho em tarefas grandes, então muda o comportamento do Claude e gasta contexto.
- É marketplace de terceiros: leia o repositório antes e instale só se quiser:

```powershell
claude plugin marketplace add michael-denyer/pstack-claude
```

```powershell
claude plugin install pstack@pstack-claude
```

Mesmo sem ele, vale a ideia principal: **antes de mudar um código, registre como ele se comporta hoje** (um teste, um print, uma saída de comando) para provar depois que a mudança não quebrou nada.
