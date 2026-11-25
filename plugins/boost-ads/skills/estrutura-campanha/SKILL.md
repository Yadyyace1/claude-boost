---
name: estrutura-campanha
description: Arquiteto de estrutura de campanha no Meta Ads — escolhe o modelo (enxuta, teste + escala, negócio local, lançamento), define o protocolo de teste, o checklist pré-lançamento e o padrão de nomes. Use quando o usuário for montar ou reorganizar uma conta de anúncios, começar com um cliente novo ou perguntar como dividir campanhas, conjuntos e orçamento.
---

# Estrutura de campanha

## 1. Entender o caso

Pergunte: objetivo (venda online, lead, conversa no WhatsApp, visita à loja), orçamento diário ou mensal, cidade/região, quantos criativos existem, se há histórico de pixel/conversões, e a meta de CPA (se não houver, use a skill `metas-trafego`).

## 2. Escolher o modelo

| Modelo | Quando | Como fica |
|---|---|---|
| **Enxuta** | orçamento pequeno (até uns R$ 50 por dia) ou conta nova | 1 campanha, 1 ou 2 conjuntos com público amplo, 3 a 6 anúncios. Menos divisão = aprendizado mais rápido |
| **Teste + escala** | já existe venda e se quer crescer | campanha de **teste** (orçamento menor, criativos novos entrando toda semana) e campanha de **escala** (só os vencedores, maior orçamento) |
| **Negócio local** | clínica, escritório, loja física, serviço na cidade | raio em volta do endereço, objetivo de conversa (WhatsApp) ou lead, criativos com rosto e lugar reconhecíveis |
| **Lançamento** | data marcada (curso, evento, abertura) | fases: aquecimento (conteúdo para criar público), captação (leads), carrinho aberto (remarketing forte), última chamada |

Explique por que escolheu o modelo em duas frases.

## 3. Protocolo de teste

- **Uma variável por teste:** ou criativo, ou público, ou oferta. Testar tudo junto não ensina nada.
- **Orçamento por teste:** suficiente para cada variante gastar pelo menos 1 a 2 vezes a meta de CPA.
- **Duração:** de 3 a 7 dias antes de decidir. Não desligue nada no primeiro dia.
- **Critério de vencedor** definido antes de começar (por exemplo: menor custo por resultado com pelo menos X resultados).
- **Registro:** anote hipótese, data, resultado e decisão numa planilha. Isso vira o histórico da conta.

## 4. Checklist pré-lançamento

- [ ] Pixel instalado e **API de Conversões** ligada; evento certo disparando (teste pelo Gerenciador de Eventos).
- [ ] Domínio verificado no Gerenciador de Negócios.
- [ ] Página de destino abre rápido no celular e continua a promessa do anúncio.
- [ ] Link do WhatsApp com mensagem pronta (se for o caso) e alguém para responder no horário.
- [ ] UTMs nos links para medir no Analytics.
- [ ] Forma de pagamento e limite de gasto da conta conferidos.
- [ ] Textos e criativos passaram pela skill `auditor-politicas`.
- [ ] Nomes seguindo o padrão abaixo.

## 5. Padrão de nomes

Nomes padronizados deixam relatório e filtro fáceis. Sugestão (separar por `|`):

- **Campanha:** `CLIENTE | OBJETIVO | FASE | AAAA-MM` → `ESCRITORIO-X | CONVERSA | TESTE | 2026-12`
- **Conjunto:** `PÚBLICO | LOCAL | IDADE` → `AMPLO | SP-10KM | 25-55`
- **Anúncio:** `ÂNGULO | FORMATO | GANCHO | vNN` → `DUVIDA-COMUM | REELS | PERGUNTA | v01`

## 6. Entregar

Um desenho da estrutura (campanhas → conjuntos → anúncios, com orçamento de cada um), o protocolo de teste das primeiras 2 semanas e o checklist. Não crie nada na conta: se o conector da Meta estiver ligado, mostre o que seria criado e espere o OK antes de cada criação.
