r"""Abre o Forja Studio sem nenhuma janela preta.

Isto e o alvo do icone da Area de Trabalho. Roda com `pythonw.exe` (o Python SEM
console), entao a pessoa clica no icone e ve o navegador - mais nada.

O que ele faz, nesta ordem:

 1. abre JA a tela de espera (`web/aguarde.html`), direto do disco. E um arquivo HTML
    comum: funciona com tudo desligado, sem servidor nenhum, porque o navegador le do
    disco. E a primeira coisa que a pessoa ve, em menos de um segundo;
 2. ve se o estudio ja esta no ar. Se estiver, a propria tela de espera entra sozinha;
 3. se nao estiver, liga o estudio ESCONDIDO e sai. A tela de espera fica batendo na
    porta e entra quando ele atender.

Por que a tela de espera existe: um arquivo .html aberto do disco NAO consegue ligar
programa nenhum - o navegador proibe, e ainda bem. Entao ela nao liga nada: quem liga
e este programa, e ela so mostra a cara bonita enquanto isso acontece e entra sozinha
quando fica pronto. Antes, clicar antes da hora dava o "nao foi possivel conectar" do
navegador, que parece defeito e nao e.

O estudio sozinho gasta ~44 MB e NAO acende a placa de video (medido em 04/11/2026,
com tudo ligado: ComfyUI 214 MB + placa, estudio 44 MB e fora da lista da placa).
Quem acende a placa sao as IAs, e elas so ligam quando a pessoa clica nos botoes.
"""
import os
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

import plataforma

plataforma.completar_path()

AQUI = Path(__file__).resolve().parent          # ...\estudio
RAIZ = AQUI.parent                              # a pasta do projeto
PORTA = int(os.environ.get("ESTUDIO_PORTA") or 8194)
ENDERECO = f"http://127.0.0.1:{PORTA}"
ESPERA = AQUI / "web" / "aguarde.html"


def no_ar(porta=PORTA, segundos=0.6):
    """True se alguem atende nessa porta aqui na maquina."""
    try:
        with socket.create_connection(("127.0.0.1", porta), timeout=segundos):
            return True
    except OSError:
        return False


def python_do_projeto():
    """O python.exe que roda o estudio. Sem console: pythonw.exe quando existir."""
    if not plataforma.WIN:
        comfy = _ambiente().get("ESTUDIO_COMFY_DIR")
        proprio = (Path(comfy).parent / "venv" / "bin" / "python") if comfy else plataforma.python_comfy(RAIZ)
        return proprio if proprio.is_file() else Path(sys.executable)
    base = RAIZ / "ComfyUI_windows_portable" / "python_embeded"
    for nome in ("pythonw.exe", "python.exe"):
        p = base / nome
        if p.is_file():
            return p
    # fora do pacote (a maquina de desenvolvimento), vale o python que esta rodando isto
    atual = Path(sys.executable)
    semjanela = atual.with_name("pythonw.exe")
    return semjanela if semjanela.is_file() else atual


def _ambiente():
    env = dict(os.environ)
    caminhos = RAIZ / "caminhos.sh"
    if not plataforma.WIN and caminhos.is_file():
        for linha in caminhos.read_text(encoding="utf-8").splitlines():
            if linha.startswith("export ") and "=" in linha:
                chave, _, valor = linha[7:].partition("=")
                env[chave.strip()] = valor.strip().strip('"')
    return env


def ligar_escondido():
    """Liga o estudio sem abrir janela. Devolve o processo, ou None se nao deu."""
    py = python_do_projeto()
    servidor = AQUI / "server.py"
    if not servidor.is_file():
        return None

    criar = 0
    if plataforma.WIN:
        # CREATE_NO_WINDOW: nenhum console aparece, nem por um piscar.
        # DETACHED_PROCESS nao serve aqui: ele solta o processo do nosso e o estudio
        # morreria junto com algumas sessoes. CREATE_NO_WINDOW basta e e mais simples.
        criar = 0x08000000
    try:
        return subprocess.Popen(
            [str(py), "-s", str(servidor)],
            cwd=str(RAIZ), env=_ambiente(), stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            **({"creationflags": criar} if plataforma.WIN else {"start_new_session": True}))
    except OSError:
        return None


def main():
    # 1) a cara do produto aparece primeiro, mesmo com tudo desligado.
    #    Se por algum motivo o arquivo nao estiver aqui, vai direto no endereco: pior
    #    experiencia, mas nunca um clique que nao faz nada.
    if ESPERA.is_file():
        webbrowser.open(ESPERA.as_uri() + f"?porta={PORTA}")
    else:
        webbrowser.open(ENDERECO)

    # 2) ja estava ligado? entao nao liga em dobro - a tela de espera entra sozinha.
    if no_ar():
        return 0

    # 3) liga escondido. Daqui para a frente quem acompanha e a tela de espera.
    if ligar_escondido() is None:
        return 1

    # Fica por perto so o suficiente para o processo filho se firmar. Sem isto, em
    # alguns casos o Windows derruba o filho junto com o pai que sai rapido demais.
    for _ in range(40):          # ate 20 s
        if no_ar(segundos=0.3):
            break
        time.sleep(0.5)
    return 0


if __name__ == "__main__":
    sys.exit(main())
