"""Texto -> voz (Chatterbox Multilingual, com clonagem opcional) + limpeza com Whisper.

O Chatterbox as vezes continua "falando" coisas sem sentido depois do texto (testado: 7,7 s certos e 32 s de
falatorio). Por isso: o texto e dividido em frases curtas (um no por frase), e depois de gerar cada audio e
transcrito com o faster-whisper; o audio e cortado logo apos a ultima palavra do texto. No fim junta tudo.
"""
import re
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf

LIMITE = 220  # caracteres por trecho de fala
IDIOMAS = {"Português": "Portuguese (pt)", "Inglês": "English (en)", "Espanhol": "Spanish (es)",
           "Francês": "French (fr)", "Italiano": "Italian (it)", "Alemão": "German (de)", "Japonês": "Japanese (ja)"}
_whisper = None


def dividir(texto, limite=LIMITE):
    frases = [f.strip() for f in re.split(r"(?<=[.!?…])\s+|\n+", texto.strip()) if f.strip()]
    trechos, atual = [], ""
    for f in frases:
        while len(f) > limite:  # frase gigante: quebra na virgula/espaco mais proximo do limite
            corte = max(f.rfind(",", 0, limite), f.rfind(" ", 0, limite))
            corte = corte if corte > 40 else limite
            if atual:
                trechos.append(atual); atual = ""
            trechos.append(f[:corte + 1].strip()); f = f[corte + 1:].strip()
        if atual and len(atual) + 1 + len(f) > limite:
            trechos.append(atual); atual = f
        else:
            atual = (atual + " " + f).strip()
    if atual:
        trechos.append(atual)
    return trechos


def montar_tts(trechos, idioma, amostra_voz, seed, prefixo, expressividade=0.5):
    api = {}
    if amostra_voz:
        api["amostra"] = {"class_type": "LoadAudio", "inputs": {"audio": amostra_voz}}
    for i, t in enumerate(trechos):
        ins = {"text": t, "language": idioma, "exaggeration": expressividade, "cfg_weight": 0.5, "temperature": 0.8,
               # top_p baixo: com 1.0 a voz "inventa" falas depois do texto (40 s em vez de 8 s); 0.3 testado = texto exato
               "repetition_penalty": 2.0, "min_p": 0.05, "top_p": 0.3, "seed": (seed + i) % 4294967295,
               "keep_model_loaded": True}
        if amostra_voz:
            ins["audio_prompt"] = ["amostra", 0]
        api[f"v{i}"] = {"class_type": "FL_ChatterboxMultilingualTTS", "inputs": ins}
        api[f"s{i}"] = {"class_type": "SaveAudio", "inputs": {"audio": [f"v{i}", 0], "filename_prefix": f"{prefixo}_t{i:02d}"}}
    return api


def _norm(p):
    p = unicodedata.normalize("NFKD", p.lower())
    return "".join(c for c in p if c.isalnum())


def _modelo():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("Systran/faster-whisper-small", device="cpu", compute_type="int8")
    return _whisper


def corte_fim(caminho, texto, idioma_codigo="pt"):
    """Segundo onde termina a fala do texto (ou None se nao der para achar)."""
    alvo = [_norm(w) for w in texto.split() if _norm(w)]
    segs, _ = _modelo().transcribe(str(caminho), language=idioma_codigo, word_timestamps=True, vad_filter=False)
    palavras = [(w.word, w.end) for s in segs for w in (s.words or [])]
    if not palavras or not alvo:
        return None
    ultima = alvo[-1]
    fim, contadas = None, 0
    for w, t in palavras:
        contadas += 1
        if _norm(w).startswith(ultima[:4]) or ultima.startswith(_norm(w)[:4] or "#"):
            if contadas >= len(alvo) * 0.6:
                fim = t
                if contadas >= len(alvo) * 0.9:
                    break
        if contadas > len(alvo) * 1.3:  # passou muito do texto: o resto e falatorio
            break
    if fim is None:  # nao achou a ultima palavra: corta pela contagem de palavras
        fim = palavras[min(len(palavras), len(alvo)) - 1][1]
    return fim


def juntar(arquivos_e_textos, destino, idioma_codigo="pt", pausa=0.35):
    """Corta cada trecho no fim do texto e junta com pausa. Retorna (duracao, relatorio)."""
    partes, relatorio, sr = [], [], None
    for arq, texto in arquivos_e_textos:
        dados, taxa = sf.read(str(arq), always_2d=True)
        sr = sr or taxa
        fim = corte_fim(arq, texto, idioma_codigo)
        total = len(dados) / taxa
        corte = min(total, (fim + 0.25) if fim else total)
        dados = dados[: int(corte * taxa)]
        n = int(0.08 * taxa)  # micro fade para nao estalar
        if len(dados) > n:
            dados[-n:] *= np.linspace(1, 0, n)[:, None]
        partes.append(dados)
        partes.append(np.zeros((int(pausa * taxa), dados.shape[1])))
        relatorio.append({"texto": texto[:60], "gerado_s": round(float(total), 1), "usado_s": round(float(corte), 1)})
    audio = np.concatenate(partes[:-1]) if partes else np.zeros((1, 1))
    sf.write(str(destino), audio, sr)
    return round(len(audio) / sr, 2), relatorio
