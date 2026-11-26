# boost-painel

O painel **Hoje** do Spark: o menu inicial do Claude, aberto ao lado do chat.

```
/plugin install boost-painel --marketplace Yadyyace1/claude-boost
```

- **"O que vamos criar hoje?"**: um campo para escrever o pedido. Enter envia para o Claude.
- **Atalhos**: pedidos de um clique, escolhidos em `/config` (separados por `|`) ou no onboarding.
- **Métricas**: conversas do dia, projetos, lembretes e barras do contexto e dos limites de 5 horas (com o horário em que zera) e da semana.
- **Projetos recentes**: as pastas em que você mais trabalhou com o Claude, com link para abrir.
- **Caixa de arquivos**: jogue arquivos em `~/Spark/Caixa de entrada` e clique em **Analisar os arquivos**. A lista se atualiza sozinha a cada resposta.
- **Personalizar o Claude**:
  - **tema**: troca com um clique (precisa do `boost-temas`);
  - **modelo e conversa**: trocar o modelo, compactar, nova conversa, configurações e conectores (o botão já escreve o comando na caixa de mensagem);
  - **segurança**: fazer backup e restaurar (precisa do `boost-backup`).
- **Lembretes**: `/lembrete seu texto`; um clique marca como feito e outro apaga.
- **Dica do dia** para gastar menos do seu limite.

Comandos: `/painel` abre o painel e `/lembrete <texto>` anota um lembrete. Em `/config` dá para mudar o nome, os atalhos e se o painel abre sozinho ao iniciar.
