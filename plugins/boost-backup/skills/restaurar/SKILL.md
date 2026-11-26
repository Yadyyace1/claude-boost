---
name: restaurar
description: Restaura um backup das configurações do Claude Code feito pelo /backup (settings, CLAUDE.md, memórias, skills, plugins, marketplaces e MCPs), em qualquer conta ou computador depois do login. Use quando a pessoa pedir para restaurar, recuperar ou trazer as configurações de volta, ou rodar /restaurar.
argument-hint: "[caminho do claude-backup-....json]"
---

# Restaurar as configurações do Claude Code

1. **Achar o arquivo.** Se a pessoa não deu o caminho, liste `~/Claude Boost/Backups/` (os mais novos primeiro) e pergunte qual usar. Se ela trouxe de outro lugar (pendrive, Drive), peça o caminho.

2. **Simular primeiro** (não muda nada):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/restaurar.mjs" "<arquivo>"
```

   Mostre o resumo: quantos arquivos são novos ou diferentes, que marketplaces, plugins e MCPs vão entrar.

3. **Aplicar só com o OK da pessoa:**

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/restaurar.mjs" "<arquivo>" --aplicar
```

   O script guarda uma cópia do que for sobrescrito em `~/Claude Boost/Backups/antes-de-restaurar-<data>/`, então dá para voltar atrás.

4. **Segredos:** o script lista as variáveis (`BOOST_...`) que precisam da chave de cada serviço. Mostre o comando de cada uma com `COLE_AQUI` e peça para a pessoa rodar **no terminal dela**. Nunca peça para colar a chave no chat. Se ela colar, avise que ficou registrada na conversa e sugira gerar uma chave nova no serviço.

5. **Fechar:** peça para reiniciar o app do Claude. Depois, `claude mcp list` mostra quais MCPs conectaram; os que pedem login (OAuth) a pessoa autentica em `/mcp`.

Restaurar não traz o login: a pessoa já precisa estar logada na conta nova antes.
