# -*- coding: utf-8 -*-
"""Bate em cada link de download e diz se ele RESPONDE -- sem baixar nada.

POR QUE ISTO EXISTE
-------------------
Conferir o tamanho pela API do HuggingFace prova que o arquivo e o mesmo. NAO prova que o
link funciona para quem vai baixar:

  * repositorio pode estar "gated" (pede aceitar licenca, ou login)   -> 401 / 403
  * arquivo pode ter sido movido ou apagado depois                    -> 404
  * repositorio pode ter virado privado                               -> 401

Um HEAD custa milissegundos e nao baixa byte nenhum. Rodar isto antes de publicar e a
diferenca entre "a lista esta certa" e "a pessoa consegue instalar".

    py _github/conferir_links.py
"""
import json
import io
import sys
import urllib.error
import urllib.request
from pathlib import Path

AQUI = Path(__file__).resolve().parent
FONTES = AQUI / "fontes.json"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Alem dos modelos: o que o manual de instalacao manda a pessoa baixar.
EXTRAS = {
    "ComfyUI portatil (Windows)":
        "https://github.com/comfyanonymous/ComfyUI/releases/latest",
    "VoiceStudio (voz local)":
        "https://github.com/debpalash/VoiceStudio",
    "nó ComfyUI-Easy-Media": "https://github.com/yolain/ComfyUI-Easy-Media",
    "nó ComfyUI-GGUF": "https://github.com/city96/ComfyUI-GGUF",
    "nó ComfyUI-KJNodes": "https://github.com/kijai/ComfyUI-KJNodes",
    "nó ComfyUI_Fill-ChatterBox": "https://github.com/filliptm/ComfyUI_Fill-ChatterBox",
}


def bater(url):
    """Devolve (codigo, bytes informados). Segue redirecionamento, nao baixa o corpo."""
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": "Mozilla/5.0 estudio-local/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.status, int(r.headers.get("Content-Length") or 0)
    except urllib.error.HTTPError as e:
        return e.code, 0
    except Exception as e:
        return str(e)[:40], 0


def main():
    if not FONTES.is_file():
        print("Nao achei o fontes.json. Rode antes: py _github/achar_fontes.py")
        return 1
    fontes = json.loads(FONTES.read_text(encoding="utf-8"))
    man = AQUI / "pacote" / "modelos.json"
    tamanhos = {}
    if man.is_file():
        d = json.loads(man.read_text(encoding="utf-8"))
        for grupo in ("comfyui", "texto"):
            for n, v in d.get(grupo, {}).items():
                tamanhos[n] = v.get("bytes", 0)

    print("MODELOS (%d)\n%s" % (len(fontes), "-" * 78))
    bons, ruins = [], []
    for nome in sorted(fontes):
        cod, tam = bater(fontes[nome])
        meu = tamanhos.get(nome, 0)
        if cod == 200 and (not meu or not tam or tam == meu):
            print("  [ok]  %-58s %s" % (nome[:58], "tamanho confere" if tam == meu else ""))
            bons.append(nome)
        elif cod == 200:
            print("  [!]   %-58s responde, mas %d bytes x %d meus" % (nome[:58], tam, meu))
            ruins.append((nome, "tamanho diferente"))
        elif cod in (401, 403) and "Lightricks/" in fontes[nome]:
            # o repositorio oficial da Lightricks pede login e aceitar a licenca.
            # Nao e link quebrado: e um passo a mais, documentado no INSTALAR.md.
            print("  [L]   %-58s pede login + aceitar a licenca (esperado)" % nome[:58])
            bons.append(nome)
        else:
            print("  [X]   %-58s %s" % (nome[:58], cod))
            ruins.append((nome, cod))

    print("\nO QUE O MANUAL MANDA BAIXAR (%d)\n%s" % (len(EXTRAS), "-" * 78))
    for nome, url in EXTRAS.items():
        cod, _ = bater(url)
        ok = cod == 200
        print("  %s %-44s %s" % ("[ok] " if ok else "[X]  ", nome, "" if ok else cod))
        (bons if ok else ruins).append(nome if ok else (nome, cod))

    print("\n%s\n%d respondem | %d com problema" % ("=" * 78, len(bons), len(ruins)))
    for nome, por in ruins:
        print("   - %s: %s" % (nome, por))
    return 1 if ruins else 0


if __name__ == "__main__":
    sys.exit(main())
