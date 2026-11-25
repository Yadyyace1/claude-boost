---
name: receitas-video
description: Receitas de edição de vídeo e áudio com FFmpeg, Whisper local, auto-editor e HyperFrames — cortar trecho, cortar silêncio, comprimir para WhatsApp/Instagram, mudar formato (vertical 9:16), queimar legenda, juntar vídeos, extrair áudio, gerar GIF, transcrever e gerar SRT, títulos e vinhetas animadas. Use quando o usuário pedir qualquer edição de vídeo ou áudio, legenda ou transcrição.
---

# Receitas de vídeo (FFmpeg + Whisper)

## Antes de tudo

- Confira se o FFmpeg existe: `ffmpeg -version`. Se não existir, **peça autorização** e instale: `winget install Gyan.FFmpeg` (depois, abrir um terminal novo).
- **Nunca sobrescreva o original.** Saída sempre com nome novo (`<nome>-v01.mp4`, `v02`…). Não use `-y` sem ter certeza de que o arquivo de saída é novo.
- Antes de editar, inspecione: `ffprobe -hide_banner <arquivo>` (duração, resolução, fps, áudio).
- Vídeo longo demora: rode em segundo plano e avise o usuário.

## Receitas

**Cortar um trecho** (rápido, sem recodificar; o corte cai no keyframe mais próximo):

```bash
ffmpeg -ss 00:01:10 -to 00:01:45 -i in.mp4 -c copy corte-v01.mp4
```

Corte exato (recodifica): troque `-c copy` por `-c:v libx264 -crf 20 -c:a aac`.

**Comprimir** (bom para WhatsApp/e-mail; CRF maior = arquivo menor):

```bash
ffmpeg -i in.mp4 -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 128k -movflags +faststart menor-v01.mp4
```

**Vertical 9:16 para Reels/TikTok/Shorts** (corta o centro):

```bash
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy vertical-v01.mp4
```

**Queimar legenda SRT no vídeo:**

```bash
ffmpeg -i in.mp4 -vf "subtitles=legenda.srt:force_style='FontName=Arial,FontSize=22,Outline=2'" -c:a copy legendado-v01.mp4
```

No Windows, se o caminho da legenda tiver `C:\`, copie o `.srt` para a mesma pasta e use só o nome do arquivo.

**Juntar vídeos** (mesmo formato/resolução): crie `lista.txt` com uma linha `file 'parte1.mp4'` por vídeo e rode:

```bash
ffmpeg -f concat -safe 0 -i lista.txt -c copy junto-v01.mp4
```

**Extrair o áudio:**

```bash
ffmpeg -i in.mp4 -vn -c:a libmp3lame -q:a 2 audio-v01.mp3
```

**GIF leve:**

```bash
ffmpeg -i in.mp4 -vf "fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" anim-v01.gif
```

**Normalizar volume** (padrão de redes, -14 LUFS):

```bash
ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy som-v01.mp4
```

## Transcrição e legenda automática (Whisper local, grátis)

Com o `uv` instalado, sem instalar nada no sistema:

```bash
uvx --from openai-whisper whisper in.mp4 --language pt --model small --output_format srt
```

- `small` é um bom equilíbrio; `medium` acerta mais e é bem mais lento. Primeira execução baixa o modelo.
- Revise o SRT gerado (nomes próprios e gírias erram) e depois queime com a receita acima.

## Cortar silêncio automaticamente (auto-editor)

O **auto-editor** corta as pausas e os silêncios de vídeos falados (aulas, vlogs, podcasts). Instale pelo executável oficial do *release* no GitHub (`WyattBlue/auto-editor`) e **confira o SHA-256** do arquivo baixado com o publicado no release antes de rodar. Peça autorização antes de baixar.

```bash
auto-editor in.mp4 --margin 0.2s -o sem-silencio-v01.mp4
```

## Vídeo com motion design: HyperFrames (plugin oficial)

Para vinheta, título animado, legenda estilizada, explainer ou vídeo de produto, use o plugin oficial **HyperFrames** (marketplace da Anthropic):

```powershell
claude plugin install hyperframes@claude-plugins-official
```

- São 21 skills, com uns **2,7 mil tokens fixos por sessão**. Desligue quando não estiver usando: `claude plugin disable hyperframes@claude-plugins-official` (e `enable` para voltar).
- Desligue a telemetria: `npx hyperframes telemetry disable`.
- **Fontes:** use as embutidas (Archivo Black, Montserrat, Oswald). Lilita One e Impact quebram o lint.

## Kit grátis de "editar vídeo com Claude"

No lugar dos cursos pagos, este conjunto cobre o fluxo inteiro:

1. **auto-editor:** corta os silêncios.
2. **Whisper:** transcreve e gera o SRT.
3. **HyperFrames:** títulos, legendas animadas e vinhetas.
4. **Uma pasta de marca** no projeto (`marca/`, com logo, cores em hex, fontes e 2 ou 3 vídeos de referência), que o Claude usa em toda peça.

**Voz clonada local** (opcional): só com uma placa de vídeo boa. O Chatterbox Multilingual (licença MIT) fala português do Brasil. Use apenas a voz da própria pessoa, ou uma voz com autorização.

## Fechamento

Mostre ao usuário o arquivo gerado (caminho completo), a duração e o tamanho, e sugira conferir o resultado antes de publicar.
