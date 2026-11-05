r"""Cria o icone "Forja Studio" na Area de Trabalho - um atalho .lnk de verdade.

Por que .lnk e nao .bat: um .bat na Area de Trabalho abre uma janela preta antes de
qualquer coisa, nao tem icone proprio e parece gambiarra. Um .lnk tem icone, tem nome
limpo e pode apontar para o `pythonw.exe` (o Python SEM console) - a pessoa clica e so
ve o navegador.

Feito pelo proprio Windows (WScript.Shell, via PowerShell) em vez de escrever os bytes
do .lnk na mao: o formato e cheio de detalhe e o Windows ja sabe faze-lo certo.

    python atalho.py            cria (ou refaz) o icone na Area de Trabalho
    python atalho.py --tirar    tira o icone
    python atalho.py --onde     so diz onde ele ficaria
"""
import os
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent          # ...\estudio
RAIZ = AQUI.parent
NOME = "Forja Studio"


def _area_de_trabalho():
    """Pergunta ao Windows onde fica a Area de Trabalho DESTA pessoa.

    Adivinhar C:\\Users\\<nome>\\Desktop erra em quem usa OneDrive (ela fica
    redirecionada), em Windows noutro idioma e em perfil fora do C:.
    """
    # o pacote traz este modulo pronto; aqui no projeto ele pode nao estar do lado
    for pasta in (RAIZ, RAIZ / "_github" / "pacote", AQUI):
        if (pasta / "area_de_trabalho.py").is_file():
            sys.path.insert(0, str(pasta))
            try:
                from area_de_trabalho import area_de_trabalho
                m = area_de_trabalho()
                if m:
                    return Path(m)
            except Exception:
                pass
            break
    import ctypes
    import ctypes.wintypes

    class G(ctypes.Structure):
        _fields_ = [("a", ctypes.c_ulong), ("b", ctypes.c_ushort),
                    ("c", ctypes.c_ushort), ("d", ctypes.c_ubyte * 8)]

    g = G()
    ole32, shell32 = ctypes.windll.ole32, ctypes.windll.shell32
    if ole32.CLSIDFromString(ctypes.c_wchar_p("{B4BFCC3A-DB2C-424C-B029-7FE99A87C641}"),
                             ctypes.byref(g)) != 0:
        return None
    caminho = ctypes.c_wchar_p()
    if shell32.SHGetKnownFolderPath(ctypes.byref(g), 0, 0, ctypes.byref(caminho)) != 0:
        return None
    try:
        p = Path(caminho.value)
        return p if p.is_dir() else None
    finally:
        ole32.CoTaskMemFree(caminho)


def _pythonw():
    """O Python SEM console. Com ele, clicar no icone nao pisca janela preta nenhuma."""
    base = RAIZ / "ComfyUI_windows_portable" / "python_embeded"
    for nome in ("pythonw.exe", "python.exe"):
        p = base / nome
        if p.is_file():
            return p
    atual = Path(sys.executable)
    sem = atual.with_name("pythonw.exe")
    return sem if sem.is_file() else atual


def _ps(script):
    """Roda um PowerShell curto, escondido, e devolve (deu_certo, saida)."""
    try:
        r = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden",
             "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True, text=True, timeout=60,
            creationflags=0x08000000 if os.name == "nt" else 0)
        return r.returncode == 0, (r.stdout or r.stderr or "").strip()
    except (OSError, subprocess.SubprocessError) as e:
        return False, str(e)


def criar(mesa=None):
    """Cria o atalho. Devolve o caminho dele, ou None."""
    if os.name != "nt":
        return None
    mesa = Path(mesa) if mesa else _area_de_trabalho()
    if not mesa or not mesa.is_dir():
        return None

    alvo = mesa / f"{NOME}.lnk"
    py = _pythonw()
    abrir = AQUI / "abrir.py"
    icone = AQUI / "icone.ico"
    if not abrir.is_file():
        return None

    # o .lnk guarda o caminho; aspas duplas dentro do PowerShell viram ""
    def esc(p):
        return str(p).replace('"', '""')

    script = f'''
$a = (New-Object -ComObject WScript.Shell).CreateShortcut("{esc(alvo)}")
$a.TargetPath       = "{esc(py)}"
$a.Arguments        = '"{esc(abrir)}"'
$a.WorkingDirectory = "{esc(RAIZ)}"
$a.Description      = "Abre o Forja Studio. So a pagina: as IAs voce liga la dentro."
'''
    if icone.is_file():
        script += f'$a.IconLocation = "{esc(icone)},0"\n'
    script += "$a.Save()\n"

    ok, saida = _ps(script)
    if ok and alvo.is_file():
        return alvo
    if saida:
        print("  (o Windows disse:", saida, ")")
    return None


def tirar(mesa=None):
    mesa = Path(mesa) if mesa else _area_de_trabalho()
    if not mesa:
        return False
    tirou = False
    for nome in (f"{NOME}.lnk", f"{NOME}.bat"):     # tira tambem o .bat antigo
        p = mesa / nome
        if p.exists():
            try:
                p.unlink()
                print(f"  tirei: {p}")
                tirou = True
            except OSError as e:
                print(f"  nao consegui tirar {p}: {e}")
    return tirou


def main():
    mesa = _area_de_trabalho()
    if "--onde" in sys.argv:
        print(f"  Area de Trabalho: {mesa}")
        return 0
    if "--tirar" in sys.argv:
        return 0 if tirar(mesa) else 1
    feito = criar(mesa)
    if feito:
        print(f"  icone criado: {feito}")
        print(f"    aponta para: {_pythonw().name} {AQUI / 'abrir.py'}")
        print("    clicar nele NAO abre janela preta e NAO acende a placa de video")
        return 0
    print("  nao consegui criar o icone (Area de Trabalho nao encontrada?)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
