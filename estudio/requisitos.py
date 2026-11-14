r"""O que esta maquina ainda precisa de FORA para o estudio funcionar inteiro.

14/11/2026, regra do dono: "tudo que eu tiver que criar conta, baixar, tem que estar na
pagina inicial, tem que mostrar o passo a passo. A pessoa vai instalar na casa dela, e se
ela tiver problema, nao vale."

Ate aqui dois pre-requisitos so existiam num manual (INSTALAR.md):

  ffmpeg        o painel usa para converter audio e video que a pessoa envia. Sem ele,
                enviar um MP3 ou um video respondia "o ffmpeg nao foi encontrado".
  VoiceStudio   o motor da VOZ (narracao local). E um programa de terceiros, com instalador
                proprio; sem ele a aba Narracao nao fala nada.

Este modulo baixa os dois pelo botao da tela, cada um numa versao FIXA e conferindo o
SHA-256 que o GitHub publica - sao programas, e programa baixado nao se roda sem conferir.

  - o ffmpeg e so descompactado dentro da pasta do estudio (_ferramentas\ffmpeg\bin): nao
    mexe no PATH do Windows nem pede administrador;
  - o VoiceStudio NAO e instalado por aqui: o painel baixa o instalador oficial, confere, e
    ABRE. Quem clica em "avancar" no instalador de outro programa e a pessoa, nao a gente.

Nenhum dos dois vai dentro do instalador do Forja: o ffmpeg tem 118 MB e o VoiceStudio 222 MB
mais ~22 GB de modelos, e nem todo mundo quer voz.
"""
import hashlib
import os
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent
FFMPEG_DIR = RAIZ / "_ferramentas" / "ffmpeg" / "bin"
BAIXADOS = RAIZ / "_baixados"

# Versoes FIXAS. Trocar e trocar os quatro campos, e testar.
FFMPEG = {
    "nome": "ffmpeg-2026-11-09-git-16a345b022-essentials_build.zip",
    "url": ("https://github.com/GyanD/codexffmpeg/releases/download/2026-11-09-git-16a345b022/"
            "ffmpeg-2026-11-09-git-16a345b022-essentials_build.zip"),
    "bytes": 117769418,
    "sha256": "eb2e1e721ae0a160b244a33d1284d5e0e98f30b00910d4a662d02ca68c0c3cb3",
}
VOICESTUDIO = {
    "versao": "0.5.8",
    "nome": "VoiceStudio-0.5.8-win-x64.exe",
    "url": "https://github.com/debpalash/VoiceStudio/releases/download/v0.5.8/VoiceStudio-0.5.8-win-x64.exe",
    "bytes": 232785545,
    "sha256": "11238cb8b08ea38b9b4e8e3050cd950ee2a2d3af1856d54e5ce6fb877444ad34",
    "pagina": "https://github.com/debpalash/VoiceStudio",
}

_trava = threading.Lock()
_estado = {"id": None, "fase": None, "baixados": 0, "total": 0, "erro": None, "erro_de": None,
           "pronto": None}
_parar = False


class _Parado(Exception):
    pass


# ----------------------------------------------------------------------------- consultas
def ffmpeg_onde():
    """O caminho do ffmpeg que o painel vai usar, ou None."""
    proprio = FFMPEG_DIR / "ffmpeg.exe"
    if proprio.is_file():
        return str(proprio)
    return shutil.which("ffmpeg")


def ativar_ffmpeg():
    """Poe o ffmpeg DO ESTUDIO na frente do PATH deste processo (nao no do Windows).

    O painel chama "ffmpeg" pelo nome. Sem isto, ter o arquivo na pasta do estudio nao
    adiantava nada: so o PATH do Windows era olhado.
    """
    if (FFMPEG_DIR / "ffmpeg.exe").is_file():
        atual = os.environ.get("PATH", "")
        if str(FFMPEG_DIR).lower() not in atual.lower():
            os.environ["PATH"] = str(FFMPEG_DIR) + os.pathsep + atual
        return True
    return False


def progresso():
    with _trava:
        return dict(_estado)


def _fase(**mais):
    with _trava:
        _estado.update(mais)


# -------------------------------------------------------------------------------- baixar
def _baixar(info, destino):
    """Baixa com retomada e confere tamanho e SHA-256. O pedaco baixado fica se parar."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    parte = Path(str(destino) + ".baixando")
    ja = parte.stat().st_size if parte.is_file() else 0
    if ja > info["bytes"]:
        parte.unlink()
        ja = 0
    if ja < info["bytes"]:
        pedido = urllib.request.Request(info["url"], headers={"User-Agent": "forja-studio"})
        if ja:
            pedido.add_header("Range", f"bytes={ja}-")
        try:
            r = urllib.request.urlopen(pedido, timeout=60)
        except urllib.error.HTTPError as e:
            raise OSError(f"O servidor respondeu {e.code} ao baixar {info['nome']}.") from e
        with r:
            if ja and r.status != 206:
                ja = 0
            with open(parte, "ab" if ja else "wb") as f:
                feito = ja
                while True:
                    if _parar:
                        raise _Parado()
                    bloco = r.read(1024 * 256)
                    if not bloco:
                        break
                    f.write(bloco)
                    feito += len(bloco)
                    with _trava:
                        _estado["baixados"] = feito
    if parte.stat().st_size != info["bytes"]:
        raise OSError(f"O download de {info['nome']} veio incompleto. Clique de novo: ele "
                      "continua de onde parou.")
    _fase(fase="conferindo")
    h = hashlib.sha256()
    with open(parte, "rb") as f:
        for bloco in iter(lambda: f.read(1024 * 1024 * 4), b""):
            h.update(bloco)
    if h.hexdigest() != info["sha256"]:
        parte.unlink(missing_ok=True)
        raise OSError(f"O arquivo {info['nome']} NAO confere com a assinatura publicada. "
                      "Apaguei por seguranca. Tente de novo.")
    parte.replace(destino)


def _instalar_ffmpeg():
    zip_local = BAIXADOS / FFMPEG["nome"]
    if not zip_local.is_file():
        _baixar(FFMPEG, zip_local)
    _fase(fase="descompactando")
    FFMPEG_DIR.mkdir(parents=True, exist_ok=True)
    quero = {"ffmpeg.exe", "ffprobe.exe"}
    with zipfile.ZipFile(zip_local) as z:
        for item in z.infolist():
            nome = item.filename.replace("\\", "/").rsplit("/", 1)[-1]
            if nome in quero and "/bin/" in "/" + item.filename.replace("\\", "/"):
                with z.open(item) as origem, open(FFMPEG_DIR / nome, "wb") as f:
                    shutil.copyfileobj(origem, f)
                quero.discard(nome)
    if quero:
        raise OSError("O pacote do ffmpeg veio sem " + ", ".join(sorted(quero)) + ".")
    zip_local.unlink(missing_ok=True)       # 118 MB a menos; os dois .exe ja estao no lugar
    ativar_ffmpeg()
    return "O ffmpeg esta instalado na pasta do estudio."


def _baixar_voicestudio():
    exe = BAIXADOS / VOICESTUDIO["nome"]
    if not exe.is_file():
        _baixar(VOICESTUDIO, exe)
    _fase(fase="abrindo")
    destino = VOICESTUDIO.get("destino")
    if destino:
        # O instalador e NSIS: /D=<pasta> ja deixa a pasta preenchida. Tem de ser o ULTIMO
        # argumento e SEM aspas (regra do NSIS), por isso vai como linha pronta e nao lista.
        try:
            subprocess.Popen('"%s" /D=%s' % (exe, destino))
        except OSError:             # pediu administrador, ou outra recusa: abre do jeito comum
            os.startfile(str(exe))  # noqa: S606
    else:
        os.startfile(str(exe))      # noqa: S606 - o instalador oficial, ja conferido
    return ("Abri o instalador do VoiceStudio. Siga as telas dele; quando terminar, abra o "
            "VoiceStudio uma vez e volte aqui.")


_COMO = {"ffmpeg": (_instalar_ffmpeg, FFMPEG), "voz": (_baixar_voicestudio, VOICESTUDIO)}


def _trabalhar(qual):
    global _parar
    try:
        recado = _COMO[qual][0]()
        _fase(id=None, fase=None, erro=None, erro_de=None, pronto={"id": qual, "recado": recado,
                                                                  "quando": time.time()})
    except _Parado:
        _fase(id=None, fase=None, erro="Download parado. O que ja baixou fica guardado.", erro_de=qual)
    except Exception as exc:            # toda falha vira frase na tela, nunca silencio
        _fase(id=None, fase=None, erro=str(exc), erro_de=qual)
    finally:
        _parar = False


def instalar(qual):
    """Comeca em segundo plano. Devolve (comecou, recado)."""
    global _parar
    if qual not in _COMO:
        return False, "Nao sei instalar isso."
    if os.name != "nt":
        return False, "Esta instalacao automatica so existe no Windows."
    with _trava:
        if _estado["id"]:
            return False, "Ja ha um download em andamento. Espere terminar."
        _estado.update({"id": qual, "fase": "baixando", "baixados": 0,
                        "total": _COMO[qual][1]["bytes"], "erro": None, "erro_de": None,
                        "pronto": None})
    _parar = False
    threading.Thread(target=_trabalhar, args=(qual,), daemon=True).start()
    return True, "Comecando a baixar."


def parar():
    global _parar
    _parar = True
    return True
