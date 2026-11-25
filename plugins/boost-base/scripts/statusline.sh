#!/usr/bin/env bash
# Claude Boost — status line
# Mostra: modelo │ pasta │ ctx NN% │ 5h NN% │ sem NN%   (ou o custo em US$ para quem usa API)
# Lê o JSON que o Claude Code manda pela entrada padrão. Não precisa de jq nem de Python.

json=$(tr -d '\r\n' )

# Devolve o objeto {...} da chave pedida (contando chaves, aguenta objetos aninhados).
obj() {
  printf '%s' "$2" | awk -v k="\"$1\"" '{
    i = index($0, k); if (!i) exit
    s = substr($0, i + length(k)); j = index(s, "{"); if (!j) exit
    d = 0
    for (p = j; p <= length(s); p++) {
      c = substr(s, p, 1)
      if (c == "{") d++
      else if (c == "}") { d--; if (d == 0) { print substr(s, j, p - j + 1); exit } }
    }
  }'
}

# Primeiro valor numérico da chave dentro do texto.
num() {
  printf '%s' "$2" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*[0-9.]*" | head -1 | sed 's/.*:[[:space:]]*//'
}

# Primeiro valor de texto da chave dentro do texto.
str() {
  printf '%s' "$2" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//'
}

pct() { [ -n "$1" ] && printf '%.0f' "$1" 2>/dev/null; }

cor() { # verde < 50, amarelo < 80, vermelho
  if [ "$1" -lt 50 ]; then printf '\033[32m'; elif [ "$1" -lt 80 ]; then printf '\033[33m'; else printf '\033[31m'; fi
}
R=$'\033[0m'; D=$'\033[2m'

modelo=$(str display_name "$(obj model "$json")")
[ -z "$modelo" ] && modelo="Claude"

dir=$(str current_dir "$(obj workspace "$json")")
[ -z "$dir" ] && dir=$(str cwd "$json")
dir=${dir//\\\\//}; dir=${dir//\\//}; dir=${dir%/}; pasta=${dir##*/}

saida="$modelo"
[ -n "$pasta" ] && saida="$saida $D│$R $pasta"

ctx=$(pct "$(num used_percentage "$(obj context_window "$json")")")
[ -n "$ctx" ] && saida="$saida $D│$R ctx $(cor "$ctx")${ctx}%$R"

limites=$(obj rate_limits "$json")
h5=$(pct "$(num used_percentage "$(obj five_hour "$limites")")")
sem=$(pct "$(num used_percentage "$(obj seven_day "$limites")")")
[ -n "$h5" ] && saida="$saida $D│$R 5h $(cor "$h5")${h5}%$R"
[ -n "$sem" ] && saida="$saida $D│$R sem $(cor "$sem")${sem}%$R"

if [ -z "$h5" ] && [ -z "$sem" ]; then
  custo=$(num total_cost_usd "$(obj cost "$json")")
  [ -n "$custo" ] && saida="$saida $D│$R \$$(printf '%.2f' "$custo" 2>/dev/null)"
fi

printf '%s\n' "$saida"
