#!/bin/bash
# Spark: o instalador do Spark para macOS. Faz no Mac o mesmo que o Spark.exe no Windows:
# prepara o Mac (Homebrew, Git, Node.js, uv), instala o Claude Code, faz o login, registra o kit desta pasta
# e abre o assistente no navegador, que instala o resto. Abre com dois cliques (no Terminal).
# Nada é instalado sem uma confirmação; senhas e chaves nunca passam pelo chat.

cd "$(dirname "$0")" || exit 1
BASE="$(pwd)"
KIT="$BASE/kit"
LOCAL_BIN="$HOME/.local/bin"
export PATH="/opt/homebrew/bin:/usr/local/bin:$LOCAL_BIN:$PATH"

AMBAR=$'\033[38;2;224;163;59m'; VERDE=$'\033[38;2;76;195;138m'; VERM=$'\033[38;2;239;107;107m'
SUAVE=$'\033[38;2;168;158;142m'; NEG=$'\033[1m'; FIM=$'\033[0m'

clear
printf '\n  %s✦ Spark%s\n  %sVamos deixar o seu Claude pronto. Você só confirma e entra nas suas contas.%s\n\n' "$AMBAR$NEG" "$FIM" "$SUAVE" "$FIM"

# Janelas do próprio macOS para confirmar e avisar (o texto nunca leva aspas duplas).
confirmar() {
  osascript -e "display dialog \"$1\" with title \"Spark\" buttons {\"Agora não\", \"Continuar\"} default button \"Continuar\" with icon note" >/dev/null 2>&1
}
avisar() {
  osascript -e "display dialog \"$1\" with title \"Spark\" buttons {\"OK\"} default button \"OK\" with icon note" >/dev/null 2>&1
}
etapa() { printf '\n%s●%s %s%s%s\n' "$AMBAR" "$FIM" "$NEG" "$1" "$FIM"; }
ok() { printf '  %s✓%s %s\n' "$VERDE" "$FIM" "$1"; }
parar() {
  printf '\n  %s✗ %s%s\n' "$VERM" "$1" "$FIM"
  avisar "A instalação parou: $1\n\nVocê pode abrir o Spark de novo: ele continua de onde parou."
  exit 1
}
tem() { command -v "$1" >/dev/null 2>&1; }
no_perfil() {
  # Acrescenta uma linha ao ~/.zprofile (lido pelo Terminal), se ainda não estiver lá.
  grep -qsF "$1" "$HOME/.zprofile" || printf '\n%s\n' "$1" >> "$HOME/.zprofile"
}

[ -d "$KIT" ] || parar "não achei a pasta kit ao lado do Spark.command. Mantenha os arquivos juntos, na pasta que você recebeu."

# 1. Homebrew (o instalador de programas do Mac)
etapa "Preparar o Mac (Homebrew, Git, Node.js e uv)"
if ! tem brew; then
  confirmar "Falta o Homebrew, o instalador de programas do Mac. Instalar agora pelo instalador oficial (brew.sh)? Ele pede a senha do seu Mac no Terminal." || parar "sem o Homebrew não dá para continuar."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || parar "o Homebrew não terminou de instalar."
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$b" ]; then eval "$("$b" shellenv)"; no_perfil "eval \"\$($b shellenv)\""; break; fi
  done
  tem brew || parar "o Homebrew não apareceu depois da instalação."
fi
ok "Homebrew"

faltam=()
tem git || faltam+=(git)
tem node || faltam+=(node)
tem uv || faltam+=(uv)
if [ ${#faltam[@]} -gt 0 ]; then
  confirmar "Faltam: ${faltam[*]}. O Claude Code e os conectores precisam deles. Instalar agora pelo Homebrew?" || parar "sem ${faltam[*]} não dá para continuar."
  brew install "${faltam[@]}" || parar "não consegui instalar ${faltam[*]}."
fi
ok "Git, Node.js e uv"

# 2. Claude Code
etapa "Claude Code"
if ! tem claude; then
  confirmar "Instalar o Claude Code pelo instalador oficial da Anthropic (claude.ai/install.sh)?" || parar "sem o Claude Code não dá para continuar."
  for tentativa in 1 2; do
    curl -fsSL https://claude.ai/install.sh | bash && [ -x "$LOCAL_BIN/claude" ] && break
    [ "$tentativa" = 1 ] && { printf '  %stentando de novo em 5 segundos…%s\n' "$SUAVE" "$FIM"; sleep 5; }
  done
  no_perfil 'export PATH="$HOME/.local/bin:$PATH"'
  tem claude || parar "o Claude Code não apareceu depois da instalação."
fi
ok "Claude Code $(claude --version 2>/dev/null | head -1)"

# 3. Login
etapa "Entrar na sua conta do Claude"
if claude auth status 2>/dev/null | tr -d ' ' | grep -q '"loggedIn":true'; then
  ok "você já está logado"
else
  avisar "Agora você entra na sua conta do Claude. O navegador vai abrir: entre com a conta da sua assinatura e volte para o Terminal quando ele disser que deu certo."
  claude auth login --claudeai
  claude auth status 2>/dev/null | tr -d ' ' | grep -q '"loggedIn":true' || parar "o login não foi concluído."
  ok "login feito"
fi

# 4. Kit do Spark (o marketplace desta pasta)
etapa "Registrar o kit Spark"
SITUACAO="$(claude plugin marketplace list --json 2>/dev/null | KIT="$KIT" node -e '
let t = ""; process.stdin.on("data", (d) => (t += d)).on("end", () => {
  let lista = []; try { lista = JSON.parse(t) } catch {}
  const m = lista.find((x) => x.name === "claude-boost")
  console.log(!m ? "nenhum" : (m.path || m.installLocation) === process.env.KIT ? "mesmo" : "outro")
})')"
if [ "$SITUACAO" = "outro" ]; then
  confirmar "Já existe um kit Spark no seu Claude, vindo de outro lugar. Trocar pelo kit desta pasta (a versão mais nova)?" || parar "mantive o kit antigo; nada foi alterado."
  claude plugin marketplace remove claude-boost >/dev/null 2>&1
  SITUACAO="nenhum"
fi
if [ "$SITUACAO" = "nenhum" ]; then
  claude plugin marketplace add "$KIT" || parar "não consegui registrar o kit."
fi
claude plugin install boost-onboarding@claude-boost >/dev/null 2>&1
ok "kit registrado"

# 5. Assistente no navegador
etapa "Escolher e instalar (no navegador)"
EXTRA=()
[ -f "$BASE/perfil.json" ] && EXTRA=(--respostas "$BASE/perfil.json")
node "$KIT/plugins/boost-onboarding/scripts/instalar.mjs" "${EXTRA[@]}"
codigo=$?
[ $codigo -eq 2 ] && parar "o assistente ficou aberto tempo demais sem terminar."
[ $codigo -ne 0 ] && parar "o assistente fechou com erro (código $codigo)."

printf '\n  %s✦ We got you.%s Feche e abra de novo o app do Claude para ver o tema e o painel.\n\n' "$AMBAR$NEG" "$FIM"
avisar "Tudo pronto! Feche e abra de novo o app do Claude para ver as personalizações. Comandos: /guia, /painel, /tema e /lembrete."
