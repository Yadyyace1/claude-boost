---
name: planilhas-relatorios
description: Trabalhar com planilhas e montar relatórios — limpar e organizar dados de Excel/CSV/Google Sheets, juntar planilhas, calcular totais e indicadores, fazer gráfico, resumir números para alguém ler. Use quando o usuário mandar uma planilha, CSV ou tabela, ou pedir um relatório, dashboard ou resumo de números.
---

# Planilhas e relatórios

## Regras

1. **Nunca altere o arquivo original.** Trabalhe numa cópia (`<nome>-v01.xlsx`) e diga onde ficou.
2. **Olhe antes de mexer:** mostre quantas linhas/colunas, os nomes das colunas, linhas vazias ou duplicadas e formatos estranhos (datas como texto, número com vírgula). Pergunte o que fazer com os casos duvidosos.
3. **Brasil:** decimal com vírgula, milhar com ponto, datas dd/mm/aaaa, moeda R$. Cuidado ao ler CSV exportado do Excel BR (separador `;`).
4. **Contas conferíveis:** ao entregar um total ou indicador, diga como foi calculado (quais colunas, quais filtros), para a pessoa conseguir conferir.
5. **Planilha grande:** processe com script (Python/pandas via `uv run`) em vez de colar os dados na conversa — economiza muitos tokens.

## Relatório

- Comece pela conclusão: as 3 coisas que os números dizem, em frases simples.
- Depois a tabela ou gráfico que sustenta cada uma.
- Gráfico: um por ideia, título que diz a conclusão ("Vendas caíram 12% em outubro"), não só o nome da métrica.
- Se a pessoa usa Google Sheets ou Drive, o conector do Google Drive permite ler direto da conta dela.
