r"""Instalar as IAs DEPOIS, uma por uma, pela propria tela do estudio.

## Por que isto existe

Antes, para usar o Forja, a pessoa tinha de baixar **235,7 GB de modelos antes de ver a
primeira tela**. Quem tem internet boa e disco grande aguenta; o resto desiste no meio,
sem nunca ter visto o programa.

Agora a ordem se inverte:

  1. instala a PLATAFORMA - ~5,6 GB, abre em minutos, entra na conta, ve tudo funcionando;
  2. a tela inicial mostra cada IA com **"falta instalar - 19,3 GB"** e um botao;
  3. a pessoa instala as que quiser, quando quiser, e so as que o computador dela aguenta.

Quem so quer fazer imagem baixa 19,3 GB e acabou. Nao precisa dos 235.

## Como ele sabe o que falta

O `modelos.json` (feito pelo `_github/gerar_inventario.py`) diz, para cada arquivo: o
**nome**, a **pasta** dentro de `models/`, o **tamanho em bytes** e **quais IAs usam ele**.
Daqui saem as duas contas que importam:

  - **instalada**: todos os arquivos dela estao no disco, com o tamanho certo;
  - **falta X GB**: o que ainda nao esta - descontando o que outras IAs ja trouxeram,
    porque varias dividem o mesmo arquivo (as duas Krea sao quase o mesmo download).

## O que ele NAO faz

- **Nao baixa duas coisas ao mesmo tempo.** Uma fila, um arquivo de cada vez: duas
  conexoes grandes na mesma internet terminam as duas mais devagar, e a barra de progresso
  vira mentira.
- **Nao apaga nada.** Desinstalar IA e coisa de apagar modelo de 20 GB por engano; se um
  dia existir, sera com confirmacao escrita.
- **Nao baixa o que ja esta la.** Confere o tamanho antes; arquivo completo e pulado, e
  arquivo pela metade **continua de onde parou** (HTTP Range), em vez de recomecar.
"""
import json
import os
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path

import plataforma

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent


def _achar_catalogo():
    """O modelos.json fica em lugares diferentes no pacote e aqui no desenvolvimento.

    No PACOTE ele vai para a raiz, ao lado do setup.py. Na maquina onde o projeto e
    escrito, ele mora em _github/, que e onde o gerar_inventario.py o produz. Procurar
    nos dois evita a cena de "funciona aqui e nao funciona la".
    """
    for p in (RAIZ / "modelos.json", RAIZ / "_github" / "modelos.json"):
        if p.is_file():
            return p
    return RAIZ / "modelos.json"


CATALOGO = _achar_catalogo()
MODELOS = plataforma.comfy_dir(RAIZ) / "models"

# Quanto o arquivo no disco pode diferir do catalogo e ainda contar como completo.
# Zero seria rigido demais: o mesmo modelo as vezes e republicado com metadado diferente.
# 1 MB pega "baixou pela metade" sem reclamar de diferenca boba.
FOLGA_BYTES = 1024 * 1024

_fila = []                 # ids esperando
_agora = None              # {"ia":..., "arquivo":..., "baixados":..., "total":..., "comecou":...}
_erro = None
_parar = False
_trava = threading.Lock()
_tocando = False


# --------------------------------------------------------------------------- o catalogo
def catalogo():
    """{nome do arquivo: {fonte, pasta, bytes, usado_por}}. Vazio se nao houver catalogo."""
    try:
        d = json.loads(CATALOGO.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d.get("comfyui") or {}


def caminho_de(nome, info):
    return MODELOS / (info.get("pasta") or "") / nome


def esta_completo(nome, info):
    p = caminho_de(nome, info)
    try:
        tam = p.stat().st_size
    except OSError:
        return False
    esperado = info.get("bytes") or 0
    if not esperado:
        return tam > 0
    return abs(tam - esperado) <= FOLGA_BYTES


def arquivos_da(nome_da_ia, cat=None):
    cat = cat if cat is not None else catalogo()
    return {n: v for n, v in cat.items() if nome_da_ia in (v.get("usado_por") or [])}


def estado_de(nome_da_ia, cat=None):
    """O que a tela precisa saber sobre UMA ia.

    "falta" e so o que ainda nao esta no disco - entao, se a pessoa ja instalou a Krea 2
    Turbo, a Krea 2 Transformar aparece como "falta 0,1 GB", que e a verdade, em vez de
    repetir os 17,8 GB que ela ja tem.
    """
    cat = cat if cat is not None else catalogo()
    arquivos = arquivos_da(nome_da_ia, cat)
    if not arquivos:
        return {"conhecida": False}

    faltando, sem_link, bytes_falta, bytes_total = [], [], 0, 0
    for n, v in arquivos.items():
        bytes_total += v.get("bytes") or 0
        if esta_completo(n, v):
            continue
        faltando.append(n)
        bytes_falta += v.get("bytes") or 0
        if not v.get("fonte"):
            sem_link.append(n)

    return {
        "conhecida": True,
        "instalada": not faltando,
        "arquivos": len(arquivos),
        "faltando": len(faltando),
        "gb_total": round(bytes_total / 1024 ** 3, 1),
        "gb_falta": round(bytes_falta / 1024 ** 3, 1),
        # sem link nenhum para um pedaco: o botao nao pode prometer o que nao entrega
        "da_para_baixar": bool(faltando) and not sem_link,
        "sem_link": sem_link,
    }


def todas(nomes):
    cat = catalogo()
    return {n: estado_de(n, cat) for n in nomes}


# ------------------------------------------------------------------------- baixar
def progresso():
    with _trava:
        d = dict(_agora) if _agora else None
        return {"baixando": d, "fila": list(_fila), "erro": _erro}


def _baixar_arquivo(nome, info):
    """Baixa um arquivo, continuando de onde parou. Levanta em caso de erro."""
    global _agora
    destino = caminho_de(nome, info)
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".baixando")
    total = info.get("bytes") or 0
    ja = parcial.stat().st_size if parcial.exists() else 0

    pedido = urllib.request.Request(info["fonte"], headers={"User-Agent": "ForjaStudio/1.0"})
    if ja:
        # continuar de onde parou. Se o servidor nao aceitar, ele responde 200 e a gente
        # recomeca do zero em vez de grudar bytes novos no fim de um arquivo pela metade.
        pedido.add_header("Range", f"bytes={ja}-")

    with urllib.request.urlopen(pedido, timeout=60) as r:
        # 206 = "aqui esta o resto", 200 = "toma o arquivo inteiro". O segundo caso
        # acontece quando o servidor nao aceita continuar; ai e preciso zerar e gravar
        # por cima, senao a gente grudaria o arquivo inteiro no fim do pedaco antigo e
        # o resultado passaria no teste de tamanho sendo lixo.
        continuando = r.status == 206
        if ja and not continuando:
            print(f"[estúdio] {nome}: o servidor não deixou continuar, baixando do zero.",
                  flush=True)
        with _trava:
            if _agora:
                _agora["continuou"] = bool(continuando and ja)
        if not continuando:
            ja = 0
        if not total:
            total = int(r.headers.get("Content-Length") or 0) + ja
        with open(parcial, "ab" if continuando else "wb") as f:
            while True:
                if _parar:
                    raise InterruptedError("parado por quem pediu")
                pedaco = r.read(1024 * 512)
                if not pedaco:
                    break
                f.write(pedaco)
                ja += len(pedaco)
                with _trava:
                    if _agora:
                        _agora["baixados"] = ja
                        _agora["total"] = total

    if total and abs(parcial.stat().st_size - total) > FOLGA_BYTES:
        raise OSError(f"{nome}: baixou {parcial.stat().st_size} de {total} bytes")
    parcial.replace(destino)


def _trabalhar(nomes_por_ia):
    global _agora, _erro, _tocando, _parar
    cat = catalogo()
    try:
        while True:
            with _trava:
                if not _fila:
                    break
                ia = _fila[0]
            for nome, info in arquivos_da(ia, cat).items():
                if _parar:
                    raise InterruptedError("parado por quem pediu")
                if esta_completo(nome, info):
                    continue
                if not info.get("fonte"):
                    raise OSError(f"{nome}: nao sei de onde baixar este arquivo")
                with _trava:
                    _agora = {"ia": ia, "arquivo": nome, "baixados": 0,
                              "total": info.get("bytes") or 0, "comecou": time.time()}
                _baixar_arquivo(nome, info)
            with _trava:
                if _fila and _fila[0] == ia:
                    _fila.pop(0)
    except Exception as exc:
        with _trava:
            _erro = str(exc)
    finally:
        with _trava:
            _agora = None
            _tocando = False
            _parar = False


def instalar(ia):
    """Poe a IA na fila. Devolve (entrou, recado)."""
    global _tocando, _erro
    est = estado_de(ia)
    if not est.get("conhecida"):
        return False, "Não conheço esta IA no catálogo de modelos."
    if est["instalada"]:
        return False, "Esta IA já está instalada."
    if est["sem_link"]:
        return False, ("Não sei de onde baixar " + str(len(est["sem_link"])) +
                       " arquivo(s) desta IA. Veja IAS-INSTALADAS.md e baixe à mão.")
    with _trava:
        if ia in _fila:
            return False, "Esta IA já está na fila."
        _fila.append(ia)
        _erro = None
        if _tocando:
            return True, "Entrou na fila."
        _tocando = True
    threading.Thread(target=_trabalhar, args=(None,), daemon=True).start()
    return True, "Começando a baixar."


def parar():
    """Para o download atual. O pedaco baixado FICA: continua da proxima vez."""
    global _parar
    with _trava:
        _fila.clear()
        _parar = True
    return True
