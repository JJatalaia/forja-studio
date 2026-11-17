"""Converte workflows testados (formato da interface da ComfyUI) para o formato de API usado pelo Estúdio.

Uso (só converte os ids que você pedir):
  ComfyUI_windows_portable\\python_embeded\\python.exe estudio\\converter_presets.py wan22_5b krea2
  ... converter_presets.py --listar            mostra os ids conhecidos e de qual workflow vem cada um

Regras de segurança:
- NUNCA sobrescreve um presets\\<id>.api.json que já existe: vários têm ajustes feitos à mão
  (ex.: hunyuan15_i2v, nó 8 trocado para VAEDecodeTiled para a ComfyUI não travar). O resultado novo vai para
  presets\\<id>.api.json.novo, para comparar com calma.
- Para substituir mesmo assim: --sobrescrever (antes guarda uma cópia <id>.api.json.bak_<data-hora>).
  Mesmo substituindo, as correções que estão em presets.json -> "ajustes_api" -> "trocar" continuam valendo,
  porque o estúdio aplica na hora de gerar.
- Workflow que já está em formato de API não precisa de conversor.
- Workflow no formato da interface precisa do conversor oficial do comfy-cli (pacote comfy_cli). Hoje nenhum
  Python do E: tem esse pacote (o antigo ficava no Python do Hermes, no D:, e NÃO deve mais ser usado).
  Se precisar, instale o comfy-cli num Python dentro do E: e rode este arquivo com ele.
- Lê /object_info da ComfyUI de vídeo (8188) só para converter; não gera nada.
"""
import argparse
import json
import shutil
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WF = ROOT / "workflows"
OUT = Path(__file__).resolve().parent / "presets"
COMFY = "http://127.0.0.1:8188"
FONTES = {
    "z_image_turbo": "z_image_turbo.json",
    "krea2": "krea2_turbo.json",
    "krea2_img2img": "etapa5_img2img.json",
    "wan22_5b": "etapa6b_wan22_5b.json",
    "wan_animate_curto": "wan_animate_caminhada_TESTE.json",
    "wan_animate_10s": "wan_animate_caminhada_10s.json",
    "minimax_h3_r2v": "minimax_h3_r2v_original.json",
    "fasth3": "fasth3_i2v_original.json",
    # só referência: o servidor NÃO usa este arquivo (apresentador.montar() monta o InfiniteTalk do zero)
    "infinitetalk": "infinitetalk_original.json",
    "ltx23_ia2v": "ltx2_3_ia2v_original.json",
    "qwen_image_2512": "qwen_image_2512_original.json",
    "flux2_dev": "flux2_t2i_original.json",
    "hidream_o1": "hidream_o1_original.json",
    "hunyuan15_i2v": "hunyuan15_i2v_original.json",
    "ideogram4": "ideogram4_int8_original.json",
}
# ajustes feitos à mão depois da conversão (se regenerar, confira se continuam no arquivo)
AJUSTES_MANUAIS = {
    "hunyuan15_i2v": "nó 8 = VAEDecodeTiled (tile 256, overlap 64, temporal 16/4); também está em presets.json "
                     "ajustes_api.trocar",
}
INTERESSE = {"CLIPTextEncode", "LoadImage", "LoadVideo", "KSampler", "EmptyLatentImage", "SaveImage", "SaveVideo",
             "Wan22ImageToVideoLatent", "WanAnimateToVideo", "ResolutionSelector", "LoraLoaderModelOnly",
             "PrimitiveInt", "PrimitiveStringMultiline", "TextGenerate", "ComfySwitchNode", "PrimitiveBoolean",
             "CreateVideo", "StringConcatenate"}


def e_formato_api(wf):
    """Formato de API = {id: {"class_type": ..., "inputs": {...}}}."""
    return isinstance(wf, dict) and bool(wf) and all(
        isinstance(v, dict) and "class_type" in v and "inputs" in v for v in wf.values())


def converter(wf, cache):
    if e_formato_api(wf):
        return wf
    try:
        from comfy_cli.workflow_to_api import convert_ui_to_api
    except ImportError:
        raise SystemExit("Este workflow está no formato da interface e precisa do conversor do comfy-cli, que não "
                         "está instalado neste Python. Instale o comfy-cli num Python dentro do E: e rode de novo "
                         "com ele (não use o Python do D:).")
    if "oi" not in cache:
        try:
            cache["oi"] = json.load(urllib.request.urlopen(COMFY + "/object_info", timeout=120))
        except OSError as exc:
            raise SystemExit(f"A ComfyUI de vídeo (8188) precisa estar ligada para converter: {exc}")
    return convert_ui_to_api(wf, cache["oi"])


def main():
    ap = argparse.ArgumentParser(description="Converte workflows para o formato de API do Estúdio.")
    ap.add_argument("ids", nargs="*", help="ids a converter (ex.: wan22_5b krea2)")
    ap.add_argument("--sobrescrever", action="store_true",
                    help="substitui o .api.json existente (guarda uma cópia .bak antes)")
    ap.add_argument("--listar", action="store_true", help="mostra os ids conhecidos")
    a = ap.parse_args()
    if a.listar or not a.ids:
        print("Ids conhecidos (workflow de origem em workflows\\):")
        for pid, fn in FONTES.items():
            nota = f"  <- ajuste à mão: {AJUSTES_MANUAIS[pid]}" if pid in AJUSTES_MANUAIS else ""
            print(f"  {pid:<18} {fn}{nota}")
        if not a.ids:
            print("\nNada convertido: diga quais ids converter (ex.: converter_presets.py wan22_5b).")
        return 0
    desconhecidos = [i for i in a.ids if i not in FONTES]
    if desconhecidos:
        print("Id desconhecido: " + ", ".join(desconhecidos) + ". Use --listar.")
        return 2
    OUT.mkdir(exist_ok=True)
    cache = {}
    for pid in a.ids:
        wf = json.loads((WF / FONTES[pid]).read_text(encoding="utf-8"))
        api = converter(wf, cache)
        destino = OUT / f"{pid}.api.json"
        if destino.exists() and not a.sobrescrever:
            destino = OUT / f"{pid}.api.json.novo"
            print(f"\n{pid}: o .api.json já existe e NÃO foi mexido; resultado em {destino.name}")
        elif destino.exists():
            bak = OUT / f"{pid}.api.json.bak_{datetime.now():%Y-%m-%d_%H%M%S}"
            shutil.copy2(destino, bak)
            print(f"\n{pid}: cópia do anterior em {bak.name}")
        if pid in AJUSTES_MANUAIS:
            print(f"  ATENÇÃO: {pid} tem ajuste feito à mão: {AJUSTES_MANUAIS[pid]}")
        destino.write_text(json.dumps(api, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"=== {pid} ({len(api)} nós) -> {destino.name}")
        for nid, n in api.items():
            if n["class_type"] in INTERESSE:
                ins = {k: (v if not isinstance(v, str) else v[:60]) for k, v in n["inputs"].items()
                       if not isinstance(v, list)}
                print(f"  {nid:>10} {n['class_type']:<24} {ins}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
