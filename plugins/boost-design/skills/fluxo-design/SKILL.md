---
name: fluxo-design
description: Fluxo de trabalho de design do Spark — editar imagem com o Photopea (camadas, texto, recorte, exportar), gerar pixel art com o PixelLab (personagens, sprites, tiles, animação) e criar peças no Canva. Use quando o usuário pedir para criar ou editar imagem, arte, post, logo, sprite, pixel art, tirar fundo ou redimensionar imagem.
---

# Fluxo de design

## Qual ferramenta

| Pedido | Ferramenta |
|---|---|
| editar foto/arte existente, camadas, texto, recorte, ajustes | **Photopea** (MCP `photopea`, grátis) |
| pixel art: personagem, sprite, tile, animação, item de jogo | **PixelLab** (MCP `pixellab`, pago, chave própria) |
| post de rede social, apresentação, peça com modelo pronto | **Canva** (conector oficial: Configurações → Conectores, ou o plugin oficial `canva` do marketplace da Anthropic) |
| ajuste simples (cortar, converter, redimensionar) | script local (Python/Pillow ou FFmpeg), sem gastar crédito |
| modelo 3D para site ou vídeo | **Tripo** (API paga) + Three.js / HyperFrames (ver a seção 3D) |

## Regras que já evitaram retrabalho

1. **Peça referência visual primeiro.** Imagem de referência do estilo vale mais que qualquer descrição. Guarde as referências numa pasta `refs/` do projeto e use sempre.
2. **Nunca sobrescreva uma versão.** Salve como `<tema>-v01.png`, `v02`… e incremente.
3. **Pixel art:** o PNG em tamanho nativo (1x) é a fonte da verdade. Ampliar **só por vizinho mais próximo** (nearest-neighbor), nunca com suavização. Exemplo com Pillow: `img.resize((w*4, h*4), Image.NEAREST)`.
4. **Fundo transparente** quando a peça vai para jogo ou montagem; fundo chapado para avatar/PFP.

## PixelLab (pago)

- Os jobs são **assíncronos**: criar → receber o id → consultar com `get_*` até ficar pronto. Não fique consultando em loop apertado; espere uns segundos entre consultas.
- **Mostre o custo e espere o OK** antes de jobs grandes (muitas direções, animações, mapas) ou de qualquer chamada com `confirm_cost=true`. A ferramenta `search_help` mostra opções e preços de graça.
- `animate_character` anima **uma direção por chamada**: pergunte qual.
- Sem a chave configurada, o servidor `pixellab` não conecta. Para configurar: `claude plugin configure boost-design@claude-boost`. Quem não usa PixelLab pode desligá-lo no `/mcp`.

## Photopea

- Abra o arquivo, trabalhe por camadas e **exporte uma versão nova** no fim.
- Use `get_preview` para conferir o resultado antes de exportar e mostre ao usuário.

## 3D (opcional): Tripo + Three.js + HyperFrames

Gera um modelo 3D a partir de texto ou imagem (Tripo), mostra na web (Three.js) ou anima em vídeo (HyperFrames, ver o boost-video).

- **Custos:** os créditos grátis do Tripo valem só no site. A **API tem saldo próprio, pago**. Mostre o custo e espere o OK antes de cada geração pela API.
- **Licença:** no plano grátis os modelos ficam **públicos** e **sem uso comercial**. Avise antes de usar em trabalho de cliente.
- A chave da API do Tripo é da própria pessoa: fica numa variável de ambiente, nunca no código nem no repositório.
- Formato para a web: GLB, carregado com o `GLTFLoader` do Three.js.
