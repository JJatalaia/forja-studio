"""ElevenLabs (nuvem, paga) como fonte de voz do Apresentador.

A chave fica na pasta API do projeto (ao lado da pasta estudio) e NUNCA e mostrada
Sem a chave, o painel segue funcionando só com a voz local (Chatterbox): tudo aqui degrada em silêncio.
"""
import json
import pathlib
import time
import urllib.error
import urllib.request

import os

# A pasta API fica AO LADO da pasta estudio, dentro do projeto. ESTUDIO_API_DIR muda de lugar.
_API_DIR = pathlib.Path(os.environ.get("ESTUDIO_API_DIR")
                       or pathlib.Path(__file__).resolve().parent.parent / "API")
CHAVE_ARQ = _API_DIR / "elevenlabs.txt"
API = "https://api.elevenlabs.io/v1"
MODELO = "eleven_multilingual_v2"  # o que fala português do Brasil bem
_cache = {"vozes": None, "ate": 0.0}


def esquecer():
    """Joga fora a lista de vozes guardada.

    Precisa existir porque a lista fica 10 min na memoria: sem isto, trocar ou remover a
    chave so apareceria na tela dez minutos depois, e a pessoa acharia que nao funcionou.
    """
    _cache.update(vozes=None, ate=0.0)


def tem_chave():
    return CHAVE_ARQ.is_file() and bool(_chave())


def _chave():
    try:
        return CHAVE_ARQ.read_text(encoding="utf-8").strip().splitlines()[0].strip()
    except Exception:
        return ""


def _pedir(caminho, dados=None, binario=False, timeout=180):
    req = urllib.request.Request(API + caminho, data=dados, headers={
        "xi-api-key": _chave(), **({"Content-Type": "application/json"} if dados else {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read() if binario else json.loads(r.read())


def vozes(forcar=False):
    """[{id, nome, clonada}] — em cache por 10 min (a lista muda pouco e a conta tem limite de chamadas)."""
    if not tem_chave():
        return []
    if not forcar and _cache["vozes"] is not None and time.time() < _cache["ate"]:
        return _cache["vozes"]
    try:
        d = _pedir("/voices", timeout=25)
        lista = [{"id": v["voice_id"], "nome": v.get("name") or v["voice_id"],
                  "clonada": v.get("category") == "cloned"} for v in d.get("voices", [])]
        lista.sort(key=lambda v: (not v["clonada"], v["nome"].lower()))  # as clonadas dele primeiro
        _cache.update(vozes=lista, ate=time.time() + 600)
        return lista
    except Exception:
        return _cache["vozes"] or []


def creditos():
    """(usados, limite) ou None — para o painel mostrar quanto sobra."""
    if not tem_chave():
        return None
    try:
        d = _pedir("/user/subscription", timeout=20)
        return int(d.get("character_count") or 0), int(d.get("character_limit") or 0)
    except Exception:
        return None


def falar(texto, voz_id, saida, estabilidade=0.5, similaridade=0.8):
    """Gera o MP3 da fala e salva em `saida`. Devolve quantos caracteres foram gastos."""
    texto = (texto or "").strip()
    if not texto:
        raise RuntimeError("Sem texto para falar.")
    if not tem_chave():
        raise RuntimeError("A chave do ElevenLabs não está em API\\elevenlabs.txt.")
    corpo = json.dumps({"text": texto, "model_id": MODELO,
                        "voice_settings": {"stability": estabilidade, "similarity_boost": similaridade}}).encode()
    try:
        audio = _pedir(f"/text-to-speech/{voz_id}", dados=corpo, binario=True)
    except urllib.error.HTTPError as e:
        det = ""
        try:
            det = str(json.loads(e.read()).get("detail"))[:300]
        except Exception:
            pass
        if e.code == 401:
            raise RuntimeError("O ElevenLabs recusou a chave (401). Confira o arquivo API\\elevenlabs.txt.")
        if e.code == 429:
            raise RuntimeError("Créditos do ElevenLabs acabaram ou o limite por minuto estourou.")
        raise RuntimeError(f"ElevenLabs respondeu erro {e.code}. {det}")
    pathlib.Path(saida).write_bytes(audio)
    return len(texto)
