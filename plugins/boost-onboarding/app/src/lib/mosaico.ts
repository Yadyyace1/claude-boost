// Transforma uma foto num fundo em mosaico (SVG só com retângulos), que o app do Claude aceita como cenário:
// o fundo do app não aceita imagens, só desenho vetorial. Tudo acontece no navegador: a foto não sai do computador.

const COLUNAS = 40
const LINHAS = 25 // 1600 × 1000, células de 40 pontos
const ESCURECER = 0.38 // escurece para o texto continuar legível por cima

const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")

export async function fotoParaMosaico(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem (JPG, PNG ou WebP).")
  if (arquivo.size > 15 * 1024 * 1024) throw new Error("A imagem passa de 15 MB.")
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => falha(new Error("Não consegui abrir essa imagem."))
      i.src = url
    })
    // Recorta no meio para a proporção 16:10 (cobre a tela como um papel de parede).
    const alvo = COLUNAS / LINHAS
    let sw = img.naturalWidth, sh = img.naturalHeight
    if (sw / sh > alvo) sw = sh * alvo
    else sh = sw / alvo
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2
    const canvas = document.createElement("canvas")
    canvas.width = COLUNAS
    canvas.height = LINHAS
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COLUNAS, LINHAS) // a redução tira a média de cada célula
    const { data } = ctx.getImageData(0, 0, COLUNAS, LINHAS)
    const celula = 1600 / COLUNAS
    const rects: string[] = []
    for (let y = 0; y < LINHAS; y++) {
      for (let x = 0; x < COLUNAS; x++) {
        const i = (y * COLUNAS + x) * 4
        const cor = `#${hex(data[i] * (1 - ESCURECER))}${hex(data[i + 1] * (1 - ESCURECER))}${hex(data[i + 2] * (1 - ESCURECER))}`
        rects.push(`<rect x="${x * celula}" y="${y * celula}" width="${celula + 1}" height="${celula + 1}" fill="${cor}"/>`)
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">${rects.join("")}</svg>`
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const svgComoUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
