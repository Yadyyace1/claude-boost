# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10"]
# ///
"""Desenha o ícone do Spark: uma faísca âmbar (estrela de quatro pontas + faísca pequena) num quadrado escuro.

Uso: uv run instalador/gerar_icone.py  →  instalador/icone.png (1024) e instalador/icone.ico (16 a 256).
O mesmo desenho está em plugins/boost-onboarding/app/src/components/Logo.tsx (FAISCAS).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

AQUI = Path(__file__).parent
L = 1024
FUNDO_TOPO, FUNDO_BASE = (46, 41, 34), (20, 19, 17)
AMBAR_CLARO, AMBAR_ESCURO = (250, 206, 110), (214, 138, 30)
# (centro x, centro y, raio) de cada faísca
FAISCAS = [(470, 560, 330), (770, 260, 120)]


def faisca(cx, cy, r, passos=24):
    """Estrela de quatro pontas de lados côncavos (curvas quadráticas com controle perto do centro)."""
    k = r * 0.14  # quanto o lado "afina" perto do centro
    pontas = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
    controles = [(cx + k, cy - k), (cx + k, cy + k), (cx - k, cy + k), (cx - k, cy - k)]
    pts = []
    for i in range(4):
        (x0, y0), (x2, y2), (x1, y1) = pontas[i], pontas[(i + 1) % 4], controles[i]
        for s in range(passos):
            t = s / passos
            pts.append(((1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2))
    return pts


def degrade(tam, topo, base):
    img = Image.new("RGB", (1, tam))
    for y in range(tam):
        t = y / (tam - 1)
        img.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(topo, base)))
    return img.resize((tam, tam))


def desenhar():
    margem, canto = 40, 210
    caixa = (margem, margem, L - margem, L - margem)
    mascara = Image.new("L", (L, L), 0)
    ImageDraw.Draw(mascara).rounded_rectangle(caixa, canto, fill=255)
    icone = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    icone.paste(degrade(L, FUNDO_TOPO, FUNDO_BASE), (0, 0), mascara)
    ImageDraw.Draw(icone).rounded_rectangle(caixa, canto, outline=(224, 163, 59, 90), width=10)

    forma = Image.new("L", (L, L), 0)
    d = ImageDraw.Draw(forma)
    for f in FAISCAS:
        d.polygon(faisca(*f), fill=255)

    brilho = forma.filter(ImageFilter.GaussianBlur(60)).point(lambda v: int(v * 0.65))
    camada = Image.new("RGBA", (L, L), (224, 163, 59, 0))
    camada.putalpha(Image.composite(brilho, Image.new("L", (L, L), 0), mascara))
    icone = Image.alpha_composite(icone, camada)

    cor = degrade(L, AMBAR_CLARO, AMBAR_ESCURO).convert("RGBA")
    cor.putalpha(forma)
    return Image.alpha_composite(icone, cor)


if __name__ == "__main__":
    img = desenhar()
    img.save(AQUI / "icone.png")
    img.save(AQUI / "icone.ico", sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])
    print("icone.png e icone.ico em", AQUI)
