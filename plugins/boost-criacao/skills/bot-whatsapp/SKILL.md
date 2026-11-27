---
name: bot-whatsapp
description: Guia passo a passo para pôr um atendente de IA no WhatsApp de uma empresa usando a API oficial do WhatsApp Business (Meta), um orquestrador (n8n, Make ou Zapier) e o Claude, com fluxo, respostas, regras e passagem para humano. Use para 'bot de WhatsApp', 'atendimento automático', 'responder clientes no WhatsApp'.
---

# Bot de atendimento no WhatsApp

Monta com você um atendente de IA no WhatsApp pela API oficial da Meta, com passagem para um humano.

Exemplo: `/bot-whatsapp salão de beleza: agendar horários e tirar dúvidas de preço`

## Caminho recomendado (oficial)

1. **Número e conta:** um número só da empresa (não o pessoal) + conta no **Meta Business**. A **API oficial do WhatsApp Business (Cloud API)** é o caminho que não arrisca banimento. O MCP oficial da Meta (WhatsApp Business Tools) ajuda a configurar conta, número, modelos e webhooks.
2. **Orquestrador:** o webhook da Meta chega no **n8n** (grátis se você mesmo hospedar), Make ou Zapier, que chama o **Claude pela API** com as instruções do atendente e responde pela Cloud API.
3. **Cérebro do atendente:** monte com a pessoa:
   - o **papel** (quem é, tom de voz, o que pode e não pode prometer);
   - a **base de respostas** (preços, horários, endereço, políticas) — sem ela o bot inventa;
   - o **fluxo**: saudação → entender o pedido → resolver ou coletar dados → confirmar → encerrar;
   - a **passagem para humano**: palavras como "atendente", reclamação, pagamento com problema → avisa a equipe e para de responder.
4. **Regras da Meta:** a empresa só inicia conversa com **modelo aprovado** e com o opt-in do cliente; dentro de 24 h depois da mensagem do cliente, responde livre. Conversas iniciadas pela empresa podem ser cobradas.
5. **LGPD:** avise que é um assistente automático, peça só os dados necessários e não guarde dados sensíveis (saúde, documentos) no histórico do bot.

## Alternativas

- **Sem programar nada:** plataformas que já fazem isso com a API oficial (os "BSPs" da Meta), pagas por mês.
- **Evite** soluções que automatizam o WhatsApp pessoal ou o WhatsApp Web: são contra os termos e podem banir o número.

## Entrega

Um plano em etapas com o que a pessoa faz em cada tela, o **texto de instruções do atendente** pronto para colar, a **base de respostas** em tabela e **3 modelos de mensagem** para aprovar na Meta. Nada é enviado ou configurado sem o OK da pessoa.

## Regras gerais

- Responda em português do Brasil, a não ser que a pessoa peça outra língua.
- Se faltar algo essencial, faça **no máximo 3 perguntas curtas** de uma vez; se der para supor com segurança, suponha e diga o que supôs.
- Entregue pronto para copiar e usar. Nada de "aqui está um exemplo genérico".
- No fim, ofereça **uma** variação ou próximo passo útil, numa linha.
