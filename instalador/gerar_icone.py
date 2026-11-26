# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10"]
# ///
"""Desenha o ícone do Boost: um raio âmbar num quadrado escuro arredondado.

Uso: uv run instalador/gerar_icone.py  →  instalador/icone.png (1024) e instalador/icone.ico (16 a 256).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

AQUI = Path(__file__).parent
L = 1024  # desenha grande e reduz
FUNDO_TOPO, FUNDO_BASE = (46, 41, 34), (20, 19, 17)  # mesmo fundo da janela do instalador
AMBAR_CLARO, AMBAR_ESCURO = (247, 197, 98), (214, 138, 30)  # destaque #E0A33B em degradê
RAIO = [(560, 135), (300, 585), (480, 585), (415, 890), (725, 415), (545, 415), (690, 135)]


def degrade(tam, topo, base):
    img = Image.new("RGB", (1, tam))
    for y in range(tam):
        t = y / (tam - 1)
        img.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(topo, base)))
    return img.resize((tam, tam))


def desenhar():
    margem, canto = 40, 210
    caixa = (margem, margem, L - margem, L - margem)

    # quadrado arredondado com degradê e borda âmbar fina
    mascara = Image.new("L", (L, L), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(caixa, canto, fill=255)
    icone = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    icone.paste(degrade(L, FUNDO_TOPO, FUNDO_BASE), (0, 0), mascara)
    ImageDraw.Draw(icone).rounded_rectangle(caixa, canto, outline=(224, 163, 59, 90), width=10)

    # brilho atrás do raio
    brilho = Image.new("L", (L, L), 0)
    ImageDraw.Draw(brilho).polygon(RAIO, fill=150)
    brilho = brilho.filter(ImageFilter.GaussianBlur(70))
    camada = Image.new("RGBA", (L, L), (224, 163, 59, 0))
    camada.putalpha(Image.composite(brilho, Image.new("L", (L, L), 0), mascara))
    icone = Image.alpha_composite(icone, camada)

    # o raio, em degradê âmbar
    forma = Image.new("L", (L, L), 0)
    ImageDraw.Draw(forma).polygon(RAIO, fill=255)
    cor = degrade(L, AMBAR_CLARO, AMBAR_ESCURO).convert("RGBA")
    cor.putalpha(forma)
    return Image.alpha_composite(icone, cor)


if __name__ == "__main__":
    img = desenhar()
    img.save(AQUI / "icone.png")
    img.save(AQUI / "icone.ico", sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])
    print("icone.png e icone.ico em", AQUI)
