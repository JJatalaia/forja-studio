"""Atualizacao de configuracao do lado do painel (o que roda na maquina de quem usa).

O painel pergunta ao servidor "tem coisa nova?", confere a ASSINATURA do manifesto com a
chave publica, baixa os arquivos, confere o sha256 de cada um contra o que esta DENTRO do
manifesto assinado, e so entao grava.

O que NUNCA entra por aqui: codigo. A lista PERMITIDOS e fechada e so tem arquivo de
configuracao. Um canal que empurra .py de fora para dentro seria uma porta dos fundos na
maquina de todo mundo que instalou - codigo novo sai pelo GitHub, que a pessoa atualiza
quando quiser e pode ler antes.

A ordem das coisas importa: baixa TUDO e confere TUDO antes de gravar o primeiro arquivo.
Gravar enquanto baixa deixaria a instalacao metade velha e metade nova se a internet caisse
no meio - e configuracao pela metade e pior que configuracao velha.
"""
import asyncio
import hashlib
import json
import os
import time
from pathlib import Path

import licenca   # reusa o servidor, a chave publica e a conferencia de assinatura

AQUI = Path(__file__).resolve().parent
MARCA = AQUI / "versao_config.json"     # que versao de configuracao esta instalada aqui

# A MESMA lista do servidor, repetida aqui de proposito: a de la decide o que pode ser
# publicado, e a daqui decide o que pode ser GRAVADO. Quem recebe nunca confia na lista de
# quem manda.
PERMITIDOS = ("presets.json", "fichas.json", "novidades.json")
# ⚠️ tempos.json FICOU DE FORA (03/11/2026): ele nao e configuracao nossa, e MEDICAO da
# maquina de quem usa - o painel escreve nele a cada geracao, com os tempos da placa DELA.
# Publicar o nosso apagaria os numeros dela e faria o painel mentir a estimativa para sempre.
# Ele viaja no pacote so como ponto de partida de quem acabou de instalar.
LIMITE_POR_ARQUIVO = 4 * 1024 * 1024

_ultimo = {"quando": 0, "manifesto": None}   # guardado 5 min, para nao bater toda hora


def instalada():
    """A versao de configuracao que esta nesta maquina (None = nunca atualizou)."""
    try:
        d = json.loads(MARCA.read_text(encoding="utf-8"))
        return d.get("versao")
    except Exception:
        return None


def _marcar(versao, titulo):
    MARCA.write_text(json.dumps({"versao": versao, "titulo": titulo,
                                 "quando": int(time.time())}, ensure_ascii=False, indent=1),
                     encoding="utf-8")


async def _buscar_manifesto():
    """Guarda a resposta por 60 s - e a FALHA por so 30 s.

    60 s, e nao 5 min: quem manda no ritmo e a conferencia da tela, que e de 10 em 10
    minutos. Com 5 min de memoria, uma atualizacao FORCADA podia demorar 15 minutos para
    chegar em quem estava com o painel aberto - medido aqui em 03/11/2026, quando publiquei
    a forcada e a tela continuou sem ver. Guardar 60 s ja evita repeticao de pedido e nao
    atrasa nada.

    Medido em 03/11/2026: o painel subiu com o servidor de contas fora do ar, guardou o
    "nao tem nada" por 5 minutos, e continuou dizendo que nao havia novidade mesmo depois
    de o servidor voltar E de uma versao ter sido publicada. Guardar sucesso poupa pedido;
    guardar fracasso so deixa a pessoa cega.
    """
    import aiohttp
    agora = time.time()
    guardado = 60 if _ultimo["manifesto"] else 30
    if agora - _ultimo["quando"] < guardado:
        return _ultimo["manifesto"]
    m = None
    # Manda o token quando existe: e o que faz a conta PAGA receber a configuracao paga.
    # Sem token (ou com conta gratis) o servidor responde a trilha publica - de proposito,
    # para quem nunca criou conta nao ficar com o painel velho para sempre.
    token = ler().get("token")
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as s:
            async with s.post(licenca.SERVIDOR + "/api/atualizacao",
                              json={"token": token} if token else {}) as r:
                if r.status == 200:
                    d = await r.json()
                    m = d.get("manifesto") if d.get("tem") else None
    except Exception:
        m = None     # sem internet: fica com o que ja tem, sem reclamar na tela
    _ultimo.update({"quando": agora, "manifesto": m})
    return m


def _abrir(manifesto):
    """Confere a assinatura e devolve os dados, ou None se nao for nossa."""
    return licenca.conferir(manifesto) if manifesto else None


async def estado():
    """O que a tela precisa: tem novidade, qual, e se e obrigatoria."""
    agora = instalada()
    dados = _abrir(await _buscar_manifesto())
    if not dados:
        return {"instalada": agora, "tem_nova": False}
    nova = dados.get("versao")
    return {"instalada": agora, "tem_nova": bool(nova) and nova != agora,
            "versao": nova, "trilha": dados.get("trilha") or "gratis",
            "titulo": dados.get("titulo"), "texto": dados.get("texto"),
            "obrigatoria": bool(dados.get("obrigatoria")),
            "publicada_em": dados.get("publicada_em"),
            "arquivos": [a.get("nome") for a in (dados.get("arquivos") or [])]}


async def aplicar():
    """Baixa, confere e grava. Devolve {"ok": True, "versao": ...} ou levanta ErroDeConta."""
    import aiohttp
    _ultimo["quando"] = 0                     # nao aplica em cima de uma resposta velha
    dados = _abrir(await _buscar_manifesto())
    if not dados:
        raise licenca.ErroDeConta("Não achei atualização nenhuma assinada por nós.", 404)
    versao = dados.get("versao")
    if not versao or versao == instalada():
        return {"ok": True, "versao": versao, "nada_a_fazer": True}

    baixados = {}
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=90)) as s:
        for item in dados.get("arquivos") or []:
            nome = item.get("nome")
            if nome not in PERMITIDOS:
                # o manifesto e assinado, mas a lista de ca manda: arquivo fora dela nao grava.
                raise licenca.ErroDeConta(f'A atualização tentou gravar "{nome}", que não é '
                                          f'arquivo de configuração. Cancelei tudo.', 400)
            trilha = dados.get("trilha") or "gratis"
            url = f"{licenca.SERVIDOR}/api/atualizacao/{versao}/{nome}?trilha={trilha}"
            if trilha == "pago":
                url += "&token=" + (ler().get("token") or "")
            try:
                async with s.get(url) as r:
                    if r.status != 200:
                        raise licenca.ErroDeConta(f"Não consegui baixar {nome} "
                                                  f"(o servidor respondeu {r.status}).", 502)
                    corpo = await r.read()
            except licenca.ErroDeConta:
                raise
            except Exception as exc:
                raise licenca.ErroDeConta(f"Não consegui baixar {nome}: {exc}", 502)
            if len(corpo) > LIMITE_POR_ARQUIVO:
                raise licenca.ErroDeConta(f"{nome} veio grande demais. Cancelei.", 400)
            if hashlib.sha256(corpo).hexdigest() != item.get("sha256"):
                raise licenca.ErroDeConta(f"O arquivo {nome} chegou diferente do que foi "
                                          f"assinado. Cancelei por segurança.", 400)
            try:
                json.loads(corpo.decode("utf-8"))
            except Exception:
                raise licenca.ErroDeConta(f"{nome} não é um JSON válido. Cancelei.", 400)
            baixados[nome] = corpo

    # so agora grava, com tudo conferido. Cada arquivo vira .bak antes de ser trocado:
    # se a configuracao nova nao prestar, a velha esta do lado.
    gravados = []
    for nome, corpo in baixados.items():
        destino = AQUI / nome
        if destino.exists():
            try:
                destino.replace(destino.with_name(nome + ".bak_antes_da_atualizacao"))
            except Exception:
                pass
        tmp = destino.with_suffix(destino.suffix + ".tmp")
        tmp.write_bytes(corpo)
        os.replace(tmp, destino)
        gravados.append(nome)
    _marcar(versao, dados.get("titulo"))
    print(f"[estúdio] configuração atualizada para {versao}: {', '.join(gravados)}", flush=True)
    return {"ok": True, "versao": versao, "titulo": dados.get("titulo"), "arquivos": gravados}
