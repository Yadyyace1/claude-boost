# /// script
# requires-python = ">=3.10"
# ///
"""Monta o zip do Spark para Mac: Spark.command (executável), LEIA-ME-MAC.txt e a pasta kit.

O zip é feito aqui (e não pelo Compress-Archive do Windows) para gravar a permissão de execução do
Spark.command: sem ela, o Mac não abre o arquivo com dois cliques.

Uso: uv run instalador/montar_mac.py [saida.zip]
"""
import sys
import zipfile
from pathlib import Path

AQUI = Path(__file__).parent
REPO = AQUI.parent
PASTA = "Spark - Instalador Mac"
FORA = {".git", "node_modules", "instalador", "__pycache__"}


def adicionar(z: zipfile.ZipFile, origem: Path, destino: str, modo: int) -> None:
    info = zipfile.ZipInfo.from_file(origem, destino)
    info.create_system = 3  # Unix: o Mac respeita as permissões
    info.external_attr = (0o100000 | modo) << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    with open(origem, "rb") as f:
        z.writestr(info, f.read())


def main() -> None:
    saida = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO.parent / "Spark - Instalador Mac.zip"
    with zipfile.ZipFile(saida, "w", zipfile.ZIP_DEFLATED) as z:
        adicionar(z, AQUI / "mac" / "Spark.command", f"{PASTA}/Spark.command", 0o755)
        adicionar(z, AQUI / "mac" / "LEIA-ME-MAC.txt", f"{PASTA}/LEIA-ME-MAC.txt", 0o644)
        n = 0
        for arq in sorted(REPO.rglob("*")):
            rel = arq.relative_to(REPO)
            if arq.is_dir() or any(p in FORA for p in rel.parts) or arq.suffix == ".log":
                continue
            modo = 0o755 if arq.suffix in {".sh", ".command"} else 0o644
            adicionar(z, arq, f"{PASTA}/kit/{rel.as_posix()}", modo)
            n += 1
    print(f"{saida} ({saida.stat().st_size / 1048576:.1f} MB, kit com {n} arquivos)")


if __name__ == "__main__":
    main()
