r"""Atualiza o PAINEL sozinho, na hora em que a pessoa clica no icone (17/11/2026).

Pedido do dono: tudo que mudar no painel (tela, configuracao, conserto) tem que chegar
sozinho a quem ja instalou, sem a pessoa baixar instalador de novo.

Como funciona
-------------
O `abrir.py` chama `conferir_e_aplicar()` ANTES de ligar o painel. Aqui:

 1. baixa um arquivo pequeno, `atualizacao.json`, da pagina de versoes do projeto;
 2. confere a ASSINATURA dele com a chave publica que esta escrita neste arquivo;
 3. se a versao de la for mais nova que a daqui, baixa o `painel.zip`, confere o tamanho
    e o sha256 (que vieram DENTRO do manifesto assinado) e troca os arquivos.

O que protege quem instalou
---------------------------
Um canal que troca codigo na maquina dos outros e perigoso se for mal feito. Por isso:

 - so vale pacote ASSINADO. A chave que assina mora so no computador do dono - nao esta
   no servidor de contas nem no GitHub. Quem invadir um dos dois nao consegue fabricar
   uma atualizacao que este arquivo aceite;
 - o endereco do zip tem que ser a pagina de versoes deste projeto, e nada mais;
 - nenhum nome de arquivo com "..", unidade de disco ou caminho absoluto;
 - nunca escreve em `python\` (o Python do instalador) nem nos arquivos de quem usa
   (conta, licenca, configuracao, historico, tempos medidos, chaves);
 - cada arquivo trocado e guardado antes em `_atualizacao\anterior\`. Se a troca falhar no
   meio, tudo volta ao que era e o painel abre na versao antiga;
 - qualquer erro aqui NUNCA impede o painel de abrir: vira uma linha em
   `estudio\atualizacao_codigo.log` e a vida segue.

O que ele NAO faz
-----------------
 - nao baixa IA nenhuma (modelo e a pessoa que escolhe, pelo botao);
 - nao instala biblioteca de Python: mudanca que precise disso sai num instalador novo;
 - nao roda em copia de desenvolvimento (pasta com `.git`) nem onde existir o arquivo
   `estudio\sem_atualizacao_automatica.txt`.
"""
import base64
import hashlib
import io
import json
import os
import shutil
import time
import urllib.request
import zipfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent          # ...\estudio
RAIZ = AQUI.parent

PROJETO = "https://github.com/JJatalaia/forja-studio/releases/"
URL_MANIFESTO = PROJETO + "latest/download/atualizacao.json"
PREFIXO_DO_ZIP = PROJETO + "download/"

# A chave PUBLICA que confere a assinatura (Ed25519, 32 bytes em base64). A privada mora
# so no computador do dono. Trocar esta linha e trocar em quem o painel confia.
CHAVE_PUBLICA = "UNAliNO+DVSFp3XdOLPkWopzxpyXT3vMD2r1aeZ71nM="

MARCA = AQUI / "versao_codigo.json"             # que versao do painel esta aqui
LISTA = AQUI / "arquivos_do_pacote.json"        # os arquivos que a ultima atualizacao trouxe
REGISTRO = AQUI / "atualizacao_codigo.log"
TRABALHO = RAIZ / "_atualizacao"
LIMITE_ZIP = 60 * 1024 * 1024                   # o pacote tem poucos MB; acima disto, recusa

# O que e de quem USA: nunca e escrito nem apagado por aqui, venha ou nao no pacote.
PROTEGIDOS = {
    "estudio/config.json", "estudio/licenca.json", "estudio/historico.json",
    "estudio/chave_presets.bin", "estudio/versao_config.json", "estudio/icone_feito.json",
    "estudio/arquivos_do_pacote.json", "estudio/atualizacao_codigo.log",
    "estudio/sem_atualizacao_automatica.txt",
}
# Vem no pacote como ponto de partida, mas depois e da maquina: so entra se ainda nao existir.
SO_SE_FALTAR = {"estudio/tempos.json"}
PASTAS_PROIBIDAS = ("python/", "_atualizacao/", "ComfyUI_windows_portable/", "outputs/", "API/",
                    "contas/", ".git/")


class Recusado(Exception):
    """O pacote nao passou numa conferencia. A mensagem diz qual."""


def _anotar(texto):
    try:
        with open(REGISTRO, "a", encoding="utf-8") as f:
            f.write("%s  %s\n" % (time.strftime("%d/%m/%Y %H:%M:%S"), texto))
    except OSError:
        pass


def _numeros(versao):
    """'2026.11.17.3' -> (2026, 11, 17, 3). Pedaco que nao for numero vale 0."""
    partes = []
    for p in str(versao or "").split("."):
        partes.append(int(p) if p.isdigit() else 0)
    return tuple(partes)


def versao_instalada(raiz=RAIZ):
    try:
        return json.loads((Path(raiz) / "estudio" / "versao_codigo.json").read_text(encoding="utf-8")).get("versao")
    except (OSError, ValueError, AttributeError):
        return None


def desligado(raiz=RAIZ):
    """Motivo para NAO atualizar aqui, ou None."""
    raiz = Path(raiz)
    if os.environ.get("FORJA_SEM_ATUALIZAR"):
        return "desligado pela variavel FORJA_SEM_ATUALIZAR"
    if (raiz / ".git").exists():
        return "copia de desenvolvimento (tem .git)"
    if (raiz / "estudio" / "sem_atualizacao_automatica.txt").exists():
        return "desligado pelo arquivo sem_atualizacao_automatica.txt"
    return None


def _baixar(url, limite, segundos):
    pedido = urllib.request.Request(url, headers={"User-Agent": "forja-studio-atualizador",
                                                  "Cache-Control": "no-cache"})
    with urllib.request.urlopen(pedido, timeout=segundos) as r:
        dados = r.read(limite + 1)
    if len(dados) > limite:
        raise Recusado("o arquivo passou do tamanho permitido")
    return dados


def conferir_assinatura(envelope, chave_publica=None):
    """Recebe os bytes do atualizacao.json e devolve o manifesto (dict) SE a assinatura bater."""
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    try:
        env = json.loads(envelope.decode("utf-8"))
        corpo = base64.b64decode(env["manifesto"], validate=True)
        assinatura = base64.b64decode(env["assinatura"], validate=True)
        chave = Ed25519PublicKey.from_public_bytes(base64.b64decode(chave_publica or CHAVE_PUBLICA))
    except Exception as exc:
        raise Recusado("o manifesto veio num formato que nao entendo (%s)" % type(exc).__name__)
    try:
        chave.verify(assinatura, corpo)
    except InvalidSignature:
        raise Recusado("a ASSINATURA do manifesto nao confere")
    try:
        m = json.loads(corpo.decode("utf-8"))
    except ValueError:
        raise Recusado("o manifesto assinado nao e um JSON")
    for campo in ("versao", "zip_url", "sha256", "tamanho"):
        if campo not in m:
            raise Recusado("falta '%s' no manifesto" % campo)
    return m


def _nome_seguro(nome):
    """O nome de dentro do zip, ja conferido, ou None para pular (pasta, protegido)."""
    n = nome.replace("\\", "/")
    if n.endswith("/"):
        return None
    if n.startswith("/") or ":" in n or any(p in ("", ".", "..") for p in n.split("/")):
        raise Recusado("nome de arquivo perigoso no pacote: %r" % nome)
    baixo = n.lower()
    if any(baixo.startswith(p.lower()) for p in PASTAS_PROIBIDAS):
        raise Recusado("o pacote tenta escrever numa pasta proibida: %r" % nome)
    if n in PROTEGIDOS:
        return None
    return n


def _aplicar(raiz, pacote, versao):
    """Troca os arquivos. Devolve (escritos, apagados). Se falhar no meio, desfaz e levanta."""
    raiz = Path(raiz)
    guarda = raiz / "_atualizacao" / "anterior" / ("%s_%s" % (versao, time.strftime("%Y%m%d-%H%M%S")))
    with zipfile.ZipFile(io.BytesIO(pacote)) as z:
        nomes = []
        for info in z.infolist():
            n = _nome_seguro(info.filename)
            if n:
                nomes.append((n, info))
        if not any(n == "estudio/server.py" for n, _ in nomes):
            raise Recusado("o pacote nao tem o painel dentro (falta estudio/server.py)")
        try:
            antiga = set(json.loads((raiz / "estudio" / "arquivos_do_pacote.json").read_text(encoding="utf-8")))
        except (OSError, ValueError, TypeError):
            antiga = set()
        nova = {n for n, _ in nomes}
        feitos = []         # (destino, copia guardada ou None se o arquivo era novo)
        try:
            for n, info in nomes:
                destino = raiz / n
                if n in SO_SE_FALTAR and destino.exists():
                    continue
                dados = z.read(info)
                copia = None
                if destino.exists():
                    if destino.read_bytes() == dados:
                        continue                        # ja esta igual: nao mexe
                    copia = guarda / n
                    copia.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(destino, copia)
                destino.parent.mkdir(parents=True, exist_ok=True)
                provisorio = destino.with_name(destino.name + ".atualizando")
                provisorio.write_bytes(dados)
                os.replace(provisorio, destino)
                feitos.append((destino, copia))
            apagados = 0
            for n in sorted(antiga - nova):
                try:
                    if _nome_seguro(n) is None:
                        continue
                except Recusado:
                    continue
                alvo = raiz / n
                if alvo.is_file():
                    copia = guarda / n
                    copia.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(alvo), str(copia))
                    feitos.append((alvo, copia))
                    apagados += 1
        except Exception:
            for destino, copia in reversed(feitos):     # desfaz: volta cada arquivo ao que era
                try:
                    if copia is None:
                        destino.unlink(missing_ok=True)
                    else:
                        destino.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(copia, destino)
                except OSError:
                    pass
            raise
        (raiz / "estudio" / "arquivos_do_pacote.json").write_text(
            json.dumps(sorted(nova), ensure_ascii=False, indent=0), encoding="utf-8")
        return len(feitos) - apagados, apagados


def _limpar_guardas(raiz, manter=3):
    pasta = Path(raiz) / "_atualizacao" / "anterior"
    try:
        velhas = sorted((p for p in pasta.iterdir() if p.is_dir()), key=lambda p: p.stat().st_mtime)
        for p in velhas[:-manter]:
            shutil.rmtree(p, ignore_errors=True)
    except OSError:
        pass


def conferir_e_aplicar(raiz=RAIZ, url_manifesto=URL_MANIFESTO, prefixo_do_zip=PREFIXO_DO_ZIP,
                       chave_publica=None, segundos=8):
    """Confere se ha painel novo e, se houver, instala. NUNCA levanta erro.

    Devolve {"estado": "em dia" | "atualizado" | "desligado" | "sem resposta" | "recusado" | "falhou",
             "de", "para", "motivo"}.
    """
    r = {"estado": "em dia", "de": versao_instalada(raiz), "para": None, "motivo": None}
    try:
        motivo = desligado(raiz)
        if motivo:
            r.update(estado="desligado", motivo=motivo)
            return r
        try:
            envelope = _baixar(url_manifesto, 200 * 1024, segundos)
        except Recusado:
            raise
        except Exception as exc:                 # sem internet, GitHub fora: abre o que tem
            r.update(estado="sem resposta", motivo="%s: %s" % (type(exc).__name__, exc))
            return r
        m = conferir_assinatura(envelope, chave_publica)
        r["para"] = m["versao"]
        if _numeros(m["versao"]) <= _numeros(r["de"]):
            return r
        url = str(m["zip_url"])
        if not url.startswith(prefixo_do_zip):
            raise Recusado("o endereco do pacote nao e a pagina de versoes do projeto")
        tamanho = int(m["tamanho"])
        if tamanho <= 0 or tamanho > LIMITE_ZIP:
            raise Recusado("tamanho de pacote fora do esperado (%s bytes)" % tamanho)
        pacote = _baixar(url, LIMITE_ZIP, max(60, segundos * 8))
        if len(pacote) != tamanho:
            raise Recusado("o pacote chegou com %d bytes e o manifesto dizia %d" % (len(pacote), tamanho))
        if hashlib.sha256(pacote).hexdigest() != str(m["sha256"]).lower():
            raise Recusado("o sha256 do pacote nao confere com o do manifesto assinado")
        escritos, apagados = _aplicar(raiz, pacote, m["versao"])
        _limpar_guardas(raiz)
        r.update(estado="atualizado")
        _anotar("ATUALIZADO de %s para %s (%d arquivos trocados, %d retirados)"
                % (r["de"], m["versao"], escritos, apagados))
        return r
    except Recusado as exc:
        r.update(estado="recusado", motivo=str(exc))
        _anotar("RECUSADO: %s" % exc)
        return r
    except Exception as exc:
        r.update(estado="falhou", motivo="%s: %s" % (type(exc).__name__, exc))
        _anotar("FALHOU (o painel abre na versao que tinha): %s: %s" % (type(exc).__name__, exc))
        return r


if __name__ == "__main__":
    print(json.dumps(conferir_e_aplicar(), ensure_ascii=False, indent=1))
