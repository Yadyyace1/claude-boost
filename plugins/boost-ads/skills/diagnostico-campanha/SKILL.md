---
name: diagnostico-campanha
description: Diagnóstico de campanha de Meta Ads (Facebook/Instagram) — percorre o funil CPM → gancho → CTR → página → conversão → frequência, acha o primeiro gargalo e recomenda escalar, manter, ajustar ou pausar. Use quando o usuário colar métricas de anúncio, exportar um relatório do Gerenciador ou perguntar por que uma campanha não está dando resultado.
---

# Diagnóstico de campanha

Ideia central: o problema de uma campanha quase sempre está **numa etapa só** do funil. Consertar a etapa errada (trocar a página quando o problema é o criativo) gasta dinheiro à toa. Ache o **primeiro** gargalo, de cima para baixo, e trate só ele.

## 1. Juntar os dados

Peça (ou leia pelo conector da Meta, se estiver ligado) por campanha, conjunto e anúncio, no mesmo período:

- valor gasto, impressões, alcance, frequência, CPM
- visualizações de 3 segundos e ThruPlays (vídeo)
- cliques no link, CTR do link, CPC do link
- visualizações da página de destino
- resultados (compra, lead, conversa iniciada) e custo por resultado
- a **meta** de custo por resultado. Se não houver, calcule antes com a skill `metas-trafego`.

Anote também: objetivo da campanha, público, há quantos dias está no ar, mudanças recentes (orçamento, criativo, público).

## 2. Tem dado suficiente?

Não julgue com pouco dado. Antes de concluir qualquer coisa, confira:

- **Tempo:** pelo menos 3 dias rodando, de preferência 7 (o comportamento muda entre dias da semana).
- **Volume:** por anúncio, alguns milhares de impressões. Para custo por resultado, gasto de pelo menos 1 a 2 vezes a meta de CPA.
- **Fase de aprendizado:** o conjunto que ainda está aprendendo (a Meta pede cerca de 50 resultados por semana para sair dela) oscila. Mexer nele reinicia o aprendizado.

Se faltar dado, diga isso com clareza e diga quanto falta, em vez de dar um veredito.

## 3. Percorrer o funil

Compare cada etapa com o **histórico da própria conta** (melhor referência) ou, sem histórico, com o que é comum no nicho. Pare no primeiro elo fraco.

| Etapa | Métrica | Se estiver ruim, o problema provável é |
|---|---|---|
| 1. Leilão | CPM | público pequeno ou disputado demais, época cara (datas de varejo), criativo com baixa qualidade aos olhos da Meta |
| 2. Gancho | taxa de gancho = visualizações de 3 s ÷ impressões; retenção = ThruPlays ÷ visualizações de 3 s | os primeiros segundos não param o dedo; o vídeo perde a pessoa no meio |
| 3. Clique | CTR do link | a promessa não está clara, a oferta não interessa ou a chamada para ação está fraca |
| 4. Página | visualizações da página ÷ cliques no link | página lenta (principalmente no celular), link quebrado, redirecionamento demais |
| 5. Conversão | resultados ÷ visualizações da página | página não continua a promessa do anúncio, oferta/preço, formulário longo, pixel ou evento mal configurado |
| 6. Saturação | frequência subindo junto com o custo | o público já viu demais: hora de criativo novo ou público maior |

Dica: se o CTR está bom e a conversão está zero, **confira o rastreamento antes** (pixel, API de Conversões, evento certo). É comum a venda acontecer e não ser contada.

## 4. Decidir

Para cada campanha ou conjunto, uma decisão só:

- **Escalar:** custo por resultado abaixo da meta e estável há alguns dias. Aumente o orçamento aos poucos (cerca de 20% a cada 2 ou 3 dias) ou duplique o conjunto para escalar sem perder o aprendizado.
- **Manter:** perto da meta ou ainda sem dado suficiente. Não mexa.
- **Ajustar:** gargalo identificado. Mude **uma coisa** (o elo fraco) e meça de novo.
- **Pausar:** gastou 2 a 3 vezes a meta de CPA sem resultado, ou o custo está muito acima da meta há dias, sem sinal de melhora.

## 5. Entregar

Responda nesta ordem, curto:

1. **Veredito** em uma frase por campanha (escalar / manter / ajustar / pausar).
2. **Gargalo:** a etapa e o número que mostra isso.
3. **Ação:** o que mudar, em ordem de prioridade, e quando medir de novo.
4. **O que falta saber:** dado que faltou para ter certeza.

## Limites

- Não altere nada na conta de anúncios. Se o conector da Meta estiver ligado, use-o só para ler. Mudança de orçamento, pausa ou ativação: mostre o que faria e espere o OK.
- Não prometa resultado ao cliente final com base no diagnóstico.
