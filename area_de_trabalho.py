r"""Onde fica a Area de Trabalho DESTA pessoa, nesta maquina.

Parece bobo e nao e. Adivinhar `C:\Users\<nome>\Desktop` erra em muita gente:

  - o nome do usuario muda (Casa, joao, Administrador, nomes com acento...);
  - quem usa OneDrive quase sempre tem a Area de Trabalho REDIRECIONADA para
    `...\OneDrive\Desktop` ou `...\OneDrive - Empresa\Desktop`;
  - em Windows em outro idioma a pasta pode nem se chamar "Desktop";
  - num PC com varios discos, o perfil pode estar fora do C:.

O jeito certo e perguntar ao proprio Windows, pela API de "pastas conhecidas"
(SHGetKnownFolderPath). Ela devolve o caminho de verdade, redirecionado ou nao,
em qualquer idioma e com qualquer nome de usuario.

Usado em 04/11/2026 depois de os atalhos irem parar numa pasta que a pessoa nao abre.
"""
import ctypes
import ctypes.wintypes
import os
from pathlib import Path

# {B4BFCC3A-DB2C-424C-B029-7FE99A87C641} = a Area de Trabalho, no vocabulario do Windows
_GUID_DESKTOP = "{B4BFCC3A-DB2C-424C-B029-7FE99A87C641}"


class _GUID(ctypes.Structure):
    _fields_ = [("Data1", ctypes.c_ulong), ("Data2", ctypes.c_ushort),
                ("Data3", ctypes.c_ushort), ("Data4", ctypes.c_ubyte * 8)]


def _pela_api():
    ole32 = ctypes.windll.ole32
    shell32 = ctypes.windll.shell32
    guid = _GUID()
    if ole32.CLSIDFromString(ctypes.c_wchar_p(_GUID_DESKTOP), ctypes.byref(guid)) != 0:
        return None
    caminho = ctypes.c_wchar_p()
    # 0 = sem sinalizador; 0 = o usuario atual
    if shell32.SHGetKnownFolderPath(ctypes.byref(guid), 0, 0, ctypes.byref(caminho)) != 0:
        return None
    try:
        return Path(caminho.value)
    finally:
        ole32.CoTaskMemFree(caminho)


def area_de_trabalho():
    """O caminho da Area de Trabalho, ou None se nao der para descobrir.

    Tenta, nesta ordem: a API do Windows, o registro, e so entao o chute. Se nem o chute
    existir, devolve None - e quem chamou decide o que fazer. Melhor nao criar atalho
    nenhum do que criar numa pasta que a pessoa nunca abre.
    """
    if os.name != "nt":
        p = Path.home() / "Desktop"
        return p if p.is_dir() else None

    try:
        p = _pela_api()
        if p and p.is_dir():
            return p
    except Exception:
        pass

    try:  # o registro guarda o mesmo caminho, inclusive quando o OneDrive redireciona
        import winreg
        chave = r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders"
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, chave) as k:
            valor, _ = winreg.QueryValueEx(k, "Desktop")
        p = Path(os.path.expandvars(valor))
        if p.is_dir():
            return p
    except Exception:
        pass

    for tentativa in (Path.home() / "Desktop",
                      Path.home() / "OneDrive" / "Desktop",
                      Path.home() / "Área de Trabalho"):
        if tentativa.is_dir():
            return tentativa
    return None


if __name__ == "__main__":
    p = area_de_trabalho()
    print(f"Area de Trabalho: {p if p else 'nao consegui descobrir'}")
    if p:
        print(f"  existe: {p.is_dir()}   da para escrever: {os.access(p, os.W_OK)}")
