"""Enquadra a imagem do personagem igual a pessoa do video de movimento (Wan Animate).

O Wan Animate copia o enquadramento da IMAGEM do personagem; o video so da o esqueleto.
Se o video e uma selfie (cabeca grande, do peito pra cima) e a imagem e de corpo inteiro,
o personagem sai cortado e as maos do video viram "punhos gigantes". Aqui:
  1. pela ComfyUI: DWPose no inicio do video e na imagem; silhueta da imagem por GrabCut (fundo liso);
  2. marcos comparaveis nos dois: topo da cabeca, linha e largura dos ombros;
     (no personagem usa DWPose se achar; robo/mascote o DWPose nao acha -> usa a silhueta)
  3. recorta a imagem (completa bordas repetindo a margem) na proporcao do video.
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

NARIZ, PESCOCO, OMBRO_D, OMBRO_E = 0, 1, 2, 5
CONF = 0.3


def api_pose(imagem, video, prefixo):
    """Workflow: pose da imagem e de 24 quadros do inicio do video (salva JSON)."""
    dw = {"detect_hand": "disable", "detect_body": "enable", "detect_face": "disable",
          "resolution": 512, "bbox_detector": "yolox_l.onnx",
          "pose_estimator": "dw-ll_ucoco_384_bs5.torchscript.pt", "scale_stick_for_xinsr_cn": "disable"}
    return {
        "1": {"class_type": "LoadImage", "inputs": {"image": imagem}},
        "2": {"class_type": "DWPreprocessor", "inputs": {**dw, "image": ["1", 0]}},
        "3": {"class_type": "SavePoseKpsAsJsonFile", "inputs": {"pose_kps": ["2", 1], "filename_prefix": prefixo + "_img"}},
        "4": {"class_type": "LoadVideo", "inputs": {"file": video}},
        "5": {"class_type": "GetVideoComponents", "inputs": {"video": ["4", 0]}},
        "6": {"class_type": "ImageFromBatch", "inputs": {"image": ["5", 0], "batch_index": 0, "length": 24}},
        "7": {"class_type": "DWPreprocessor", "inputs": {**dw, "image": ["6", 0]}},
        "8": {"class_type": "SavePoseKpsAsJsonFile", "inputs": {"pose_kps": ["7", 1], "filename_prefix": prefixo + "_vid"}},
    }


def _pessoa(quadro):
    """Maior pessoa do quadro -> array (18,3) em pixels, ou None."""
    W, H = quadro["canvas_width"], quadro["canvas_height"]
    melhor, area = None, -1
    for p in quadro.get("people") or []:
        k = np.array(p["pose_keypoints_2d"], dtype=float).reshape(-1, 3)[:18]
        if k[:, 0].max() <= 1.0 and k[:, 1].max() <= 1.0:  # veio normalizado
            k[:, 0] *= W
            k[:, 1] *= H
        v = k[k[:, 2] > CONF]
        if len(v) < 3:
            continue
        a = np.ptp(v[:, 0]) * np.ptp(v[:, 1])
        if a > area:
            melhor, area = k, a
    return melhor


def marcos_pose(k):
    """Topo da cabeca, linha/centro/largura dos ombros a partir do DWPose."""
    if not (k[OMBRO_D, 2] > CONF and k[OMBRO_E, 2] > CONF):
        return None
    oy = (k[OMBRO_D, 1] + k[OMBRO_E, 1]) / 2
    ox = (k[OMBRO_D, 0] + k[OMBRO_E, 0]) / 2
    larg = math.dist(k[OMBRO_D, :2], k[OMBRO_E, :2])
    if k[NARIZ, 2] > CONF:  # topo ~ uma distancia nariz->ombros acima do nariz, limitado pela largura
        topo = k[NARIZ, 1] - min(oy - k[NARIZ, 1], 0.55 * larg)
    else:
        topo = oy - 0.75 * larg
    return {"topo": topo, "ombro_y": oy, "ombro_x": ox, "ombro_larg": larg}


def silhueta_por_fundo(caminho_img):
    """Mascara do personagem quando o fundo e liso (cor das bordas). None se o fundo nao for liso."""
    import cv2
    a = np.asarray(Image.open(caminho_img).convert("RGB")).astype(np.int16)
    bordas = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    fundo = np.median(bordas, axis=0)
    if np.abs(bordas - fundo).max(axis=1).mean() > 25:  # fundo com cenario: nao da pra usar
        return None
    # GrabCut (aguenta fundo em degrade): trabalha reduzido e amplia a mascara
    H, W = a.shape[:2]
    f = min(1.0, 512 / max(H, W))
    peq = cv2.resize(a.astype(np.uint8), (max(8, int(W * f)), max(8, int(H * f))), interpolation=cv2.INTER_AREA)
    h, w = peq.shape[:2]
    gc = np.zeros((h, w), np.uint8)
    mb, ma = max(2, int(w * 0.02)), max(2, int(h * 0.01))
    bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(peq, cv2.COLOR_RGB2BGR), gc, (mb, ma, w - 2 * mb, h - 2 * ma), bg, fg, 6, cv2.GC_INIT_WITH_RECT)
    m = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
    m = cv2.resize(m, (W, H), interpolation=cv2.INTER_NEAREST)
    n, rot, st, _ = cv2.connectedComponentsWithStats(m)
    if n < 2:
        return None
    maior = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    m = rot == maior
    return m if m.mean() > 0.02 else None


def marcos_silhueta(m):
    """Mesmos marcos a partir da silhueta (robos, mascotes, estilos que o DWPose nao reconhece)."""
    linhas = np.where(m.any(axis=1))[0]
    if len(linhas) < 20:
        return None
    alt = linhas[-1] - linhas[0]
    cont = m.sum(axis=1).astype(float)
    # largura maxima do tronco (parte de cima da figura); antenas, orelhas e mechas sao finas e sao ignoradas
    faixa = slice(linhas[0], linhas[0] + int(alt * 0.45))
    maxima = cont[faixa].max()
    if maxima <= 0:
        return None
    topo = next(y for y in range(linhas[0], linhas[-1]) if cont[y] >= 0.22 * maxima)
    ombro = next((y for y in range(topo, linhas[0] + int(alt * 0.45)) if cont[y] >= 0.75 * maxima), None)
    if ombro is None or ombro - topo < alt * 0.05:
        return None
    larg_sil = cont[ombro: ombro + max(2, int(alt * 0.04))].max()
    xs = np.where(m[ombro + int(alt * 0.02)])[0]
    return {"topo": float(topo),
            "ombro_y": ombro + alt * 0.025,        # articulacao fica um pouco abaixo da borda da silhueta
            "ombro_x": float(xs.mean()) if len(xs) else m.shape[1] / 2,
            "ombro_larg": 0.8 * larg_sil}          # distancia entre articulacoes ~80% da largura externa


def calcular_recorte(json_img, json_vid, caminho_img):
    """Retorna ((x0, y0, largura, altura), info) do recorte, ou (None, motivo)."""
    img = json.loads(Path(json_img).read_text(encoding="utf-8"))[0]
    vid = json.loads(Path(json_vid).read_text(encoding="utf-8"))
    wv, hv = vid[0]["canvas_width"], vid[0]["canvas_height"]
    mv = [marcos_pose(k) for k in (_pessoa(q) for q in vid) if k is not None]
    mv = [m for m in mv if m]
    if not mv:
        return None, "Não achei a pessoa (ombros) no início do vídeo."
    v = {c: float(np.median([m[c] for m in mv])) for c in mv[0]}
    k = _pessoa(img)
    mi, fonte = (marcos_pose(k), "pose") if k is not None else (None, None)
    if not mi:
        sil = silhueta_por_fundo(caminho_img)
        if sil is not None:
            mi, fonte = marcos_silhueta(sil), "silhueta"
    if not mi:
        return None, ("Não consegui localizar a cabeça e os ombros do personagem. Funciona melhor com personagem "
                      "de corpo inteiro ou meio corpo, de frente, em fundo liso.")
    s_alt = (mi["ombro_y"] - mi["topo"]) / max(1.0, v["ombro_y"] - v["topo"])
    s_larg = mi["ombro_larg"] / max(1.0, v["ombro_larg"])
    s = math.sqrt(s_alt * s_larg)  # pixels da imagem por pixel do video
    x0 = mi["ombro_x"] - v["ombro_x"] * s
    y0 = mi["ombro_y"] - v["ombro_y"] * s
    return (x0, y0, wv * s, hv * s), {"escala": round(s, 3), "fonte": fonte,
                                      "escalas": [round(s_alt, 3), round(s_larg, 3)]}


def recortar(caminho_img, caixa, destino):
    x0, y0, w, h = caixa
    im = Image.open(caminho_img).convert("RGB")
    W, H = im.size
    pe, pc = max(0, math.ceil(-x0)), max(0, math.ceil(-y0))
    pd, pb = max(0, math.ceil(x0 + w - W)), max(0, math.ceil(y0 + h - H))
    if pe or pc or pd or pb:  # recorte sai da imagem: completa repetindo a margem
        arr = np.pad(np.asarray(im), ((pc, pb), (pe, pd), (0, 0)), mode="edge")
        im = Image.fromarray(arr)
        x0, y0 = x0 + pe, y0 + pc
    out = im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))
    out.save(destino)
    return {"tamanho": list(out.size), "preenchido": bool(pe or pc or pd or pb)}
