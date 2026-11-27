# Servidor do Spark na Vultr (São Paulo) — proposta

**Situação:** só no papel. Nada foi contratado. Precisa do OK do João para o valor e da chave da API da Vultr salva como variável de ambiente (`VULTR_API_KEY`), nunca colada no chat.

## Para que serve

O Spark roda inteiro na máquina de cada cliente. Um servidor só vale a pena para o que precisa ficar ligado o tempo todo:

1. **Perfil e rede do Spark:** página de perfil de cada cliente e a rede de networking (o próximo projeto).
2. **Bot de WhatsApp dos clientes:** o webhook da API oficial da Meta precisa de um endereço público sempre no ar. Um **n8n** no servidor recebe as mensagens, chama o Claude pela API e responde.
3. **Assinaturas, depois:** controle de quem assinou o serviço e acesso ao kit.

## Menor custo possível

| Item | Escolha | Por quê |
|---|---|---|
| Região | São Paulo (`sao`) | latência baixa para clientes no Brasil |
| Máquina | o menor plano com IPv4 (1 vCPU, 1–2 GB) | aguenta o n8n e uma API pequena |
| Preço | **entre US$ 9 e US$ 18 por mês**, a confirmar no painel com a região São Paulo escolhida | as fontes públicas não batem; o painel mostra o valor certo |
| Sistema | Ubuntu LTS + Docker | um `docker compose` sobe tudo |
| HTTPS | Caddy | certificado grátis e automático |
| Banco e login | **Supabase no plano grátis** (fora do servidor) | não gasta memória do servidor e tem backup |
| Backup | snapshot manual antes de mudanças grandes | backup automático da Vultr é pago à parte |

Para economizar também nos tokens: o n8n só chama o Claude quando chega mensagem, com um modelo menor (Haiku) para o atendimento comum e respostas curtas, e a base de respostas do cliente fica num arquivo, em vez de ir inteira em cada chamada.

## Passo a passo (quando aprovado)

1. O João cria a chave em Vultr → Account → API e a salva com `[Environment]::SetEnvironmentVariable("VULTR_API_KEY", "…", "User")` no próprio PowerShell.
2. O Claude confere o preço real do plano na região São Paulo pela API e mostra o valor antes de criar.
3. Com o OK: cria a máquina e a chave SSH, ativa o firewall (só 22, 80 e 443) e instala Docker, Caddy e n8n.
4. Aponta um subdomínio (ex.: `api.` + domínio do Spark) para o IP.
5. Registra tudo aqui e no Obsidian (nota "Consultoria Claude Boost").
