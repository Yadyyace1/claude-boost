# boost-painel

O painel **Hoje** do Claude Boost: um painel ao lado do chat que transforma a tela inicial do Claude num pequeno dashboard.

- **Saudação e data**, com o seu nome.
- **Seu uso:** barras do contexto da conversa, do limite de 5 horas (com o horário em que zera) e do limite da semana. Quando a conversa passa de 70%, sugere um `/compact`.
- **Atalhos:** pedidos de um clique, como "Planejar o meu dia" ou "Resumir o que fiz hoje". Você escolhe quais em `/config`, separados por `|`.
- **Lembretes:** anote com `/lembrete seu texto`. Um clique marca como feito e outro apaga. Eles ficam salvos entre sessões.
- **Dica do dia** para gastar menos do seu limite.

Comandos: `/painel` abre o painel e `/lembrete <texto>` anota um lembrete. Em `/config` dá para mudar o nome, os atalhos e se o painel abre sozinho ao iniciar.
