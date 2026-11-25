---
name: game-juice
description: Game juice — checklist em 8 etapas para dar peso e impacto a um golpe, magia ou tiro num jogo (carga, núcleo, rastro, explosão, reação do alvo, som, consequência, números de dano), com dicas de tempo em quadros e o vfx_workbench do PixelLab para os efeitos. Use quando o usuário pedir para deixar um ataque, golpe, magia ou acerto mais satisfatório, com mais impacto, "mais gostoso" ou com mais game feel.
---

# Game juice: um golpe com impacto

Um ataque parece fraco quando acontece num quadro só. Ele fica gostoso quando o jogador **sente antes, durante e depois**. Passe pelas 8 etapas e veja qual está faltando.

## As 8 etapas

1. **Carga (antecipação):** um instante de preparo antes de soltar. Brilho juntando, personagem recuando, partículas indo para dentro. Curto (2 a 6 quadros em 60 fps) para não atrasar o controle.
2. **Núcleo:** o golpe em si, com uma forma clara e a cor mais forte da tela. Tem que ser legível mesmo pequeno.
3. **Rastro:** o caminho que o golpe faz (arco da espada, cauda do projétil). Mostra direção e velocidade.
4. **Explosão (impacto):** o momento do acerto. Flash rápido, forma que se expande, faíscas. É aqui que entram:
   - **hit-stop:** congelar a ação por 2 a 6 quadros no instante do acerto;
   - **tremida de tela** leve e curta (exagerada cansa e enjoa).
5. **Reação do alvo:** o inimigo pisca branco por 1 ou 2 quadros, é empurrado para trás (knockback) e muda de pose. Sem reação, parece que o golpe atravessou.
6. **Som:** um som em camadas (o "whoosh" da carga, o estalo do acerto, um grave curto). Varie levemente o tom a cada acerto para não ficar repetitivo.
7. **Consequência:** o que sobra depois. Marca no chão, fumaça, poeira, pedaços caindo, partículas que demoram a sumir.
8. **Números de dano:** sobem e somem; crítico maior, com outra cor e um pequeno salto. Fonte legível acima de tudo.

## Como usar

1. Descreva ou mostre o golpe atual (vídeo, GIF ou o código da animação).
2. Marque cada etapa: ✅ tem, ⚠️ fraca, ❌ falta.
3. Ataque primeiro as faltas mais baratas e de maior efeito: normalmente **hit-stop, flash branco no alvo e knockback** (são código, não arte).
4. Depois, os efeitos visuais e o som.

## Efeitos com o PixelLab

Para os efeitos animados em pixel art (carga, rastro, explosão, aura), use o **`vfx_workbench`** do MCP do PixelLab (no boost-design). Comece por `vfx_workbench(argv=['describe', 'start'])`. Ele é uma ferramenta de desenho guiado (sem custo de geração por IA) e exporta para "My effects" na conta da pessoa.

- Desenhe o efeito no **tamanho nativo** do jogo e amplie só por vizinho mais próximo (nearest-neighbor).
- Mantenha a paleta do jogo; a cor mais forte da tela é a do golpe.
- Para o som, o PixelLab também gera efeitos sonoros (custa crédito: mostre o custo e espere o OK).

## Cuidado com o excesso

Tremida de tela, flash e partícula demais deixam o jogo confuso e podem incomodar quem é sensível a luz piscando. Ofereça uma opção para reduzir tremida e flashes nas configurações do jogo.
