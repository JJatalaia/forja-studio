"""Apresentador: foto + audio -> pessoa falando (InfiniteTalk, 1 pessoa), com a duracao que o audio tiver.

InfiniteTalk gera trechos de 81 quadros (25 fps). Cada trecho novo recebe TODOS os quadros ja gerados em
`previous_frames`: o no usa (quadros_ja_gerados - 9) como ponto de partida do audio, e os 9 primeiros quadros do
trecho novo repetem o fim do anterior (sao descartados antes de emendar). No fim corta no tamanho exato do audio.
"""
import math

FPS = 25
TRECHO = 81
MOVIMENTO = 9


def num_trechos(quadros):
    return 1 if quadros <= TRECHO else 1 + math.ceil((quadros - TRECHO) / (TRECHO - MOVIMENTO))


def montar(foto, audio, segundos, largura, altura, prompt, seed, prefixo, passos=6):
    quadros = max(1, int(round(segundos * FPS)))
    api = {
        "foto": {"class_type": "LoadImage", "inputs": {"image": foto}},
        "audio": {"class_type": "LoadAudio", "inputs": {"audio": audio}},
        "unet": {"class_type": "UNETLoader", "inputs": {"unet_name": "Wan2_1-I2V-14B-480p_fp8_e4m3fn_scaled_KJ.safetensors",
                                                         "weight_dtype": "default"}},
        "lora": {"class_type": "LoraLoaderModelOnly", "inputs": {
            "lora_name": "lightx2v_I2V_14B_480p_cfg_step_distill_rank64_bf16.safetensors", "strength_model": 1,
            "model": ["unet", 0]}},
        "patch": {"class_type": "ModelPatchLoader", "inputs": {"name": "wan2.1_infiniteTalk_multi_fp16.safetensors"}},
        "clip": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
                                                         "type": "wan", "device": "default"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["clip", 0]}},
        "neg": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["pos", 0]}},
        "vae": {"class_type": "VAELoader", "inputs": {"vae_name": "Wan2_1_VAE_bf16.safetensors"}},
        "enc": {"class_type": "AudioEncoderLoader", "inputs": {"audio_encoder_name": "wav2vec2-chinese-base_fp16.safetensors"}},
        "aenc": {"class_type": "AudioEncoderEncode", "inputs": {"audio_encoder": ["enc", 0], "audio": ["audio", 0]}},
        "sel": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
    }
    acumulado = None
    for k in range(num_trechos(quadros)):
        t = f"t{k}"
        it = {"mode": "single_speaker", "length": TRECHO, "motion_frame_count": MOVIMENTO, "audio_scale": 1,
              "model": ["lora", 0], "model_patch": ["patch", 0], "positive": ["pos", 0], "negative": ["neg", 0],
              "vae": ["vae", 0], "width": largura, "height": altura, "audio_encoder_output_1": ["aenc", 0],
              "start_image": ["foto", 0]}
        if acumulado:
            it["previous_frames"] = acumulado
        api[f"{t}_it"] = {"class_type": "WanInfiniteTalkToVideo", "inputs": it}
        api[f"{t}_g"] = {"class_type": "CFGGuider", "inputs": {"cfg": 1, "model": [f"{t}_it", 0],
                                                               "positive": [f"{t}_it", 1], "negative": [f"{t}_it", 2]}}
        api[f"{t}_s"] = {"class_type": "BasicScheduler", "inputs": {"scheduler": "normal", "steps": passos, "denoise": 1,
                                                                    "model": [f"{t}_it", 0]}}
        api[f"{t}_n"] = {"class_type": "RandomNoise", "inputs": {"noise_seed": seed + k}}
        api[f"{t}_k"] = {"class_type": "SamplerCustomAdvanced", "inputs": {
            "noise": [f"{t}_n", 0], "guider": [f"{t}_g", 0], "sampler": ["sel", 0], "sigmas": [f"{t}_s", 0],
            "latent_image": [f"{t}_it", 3]}}
        api[f"{t}_d"] = {"class_type": "VAEDecode", "inputs": {"samples": [f"{t}_k", 0], "vae": ["vae", 0]}}
        if acumulado is None:
            acumulado = [f"{t}_d", 0]
        else:  # descarta os 9 quadros repetidos e emenda
            api[f"{t}_c"] = {"class_type": "ImageFromBatch", "inputs": {"image": [f"{t}_d", 0],
                                                                        "batch_index": MOVIMENTO, "length": 4096}}
            api[f"{t}_j"] = {"class_type": "ImageBatch", "inputs": {"image1": acumulado, "image2": [f"{t}_c", 0]}}
            acumulado = [f"{t}_j", 0]
    api["final"] = {"class_type": "ImageFromBatch", "inputs": {"image": acumulado, "batch_index": 0, "length": quadros}}
    api["video"] = {"class_type": "CreateVideo", "inputs": {"fps": FPS, "images": ["final", 0], "audio": ["audio", 0]}}
    api["salvar"] = {"class_type": "SaveVideo", "inputs": {"filename_prefix": prefixo, "format": "auto", "codec": "auto",
                                                           "video": ["video", 0]}}
    return api


LTX_MAX_S = 15  # testado 8 s (704x1280 em ~7 min na 1a vez); acima disso usa InfiniteTalk


def montar_ltx(api_base, foto, audio, segundos, largura, altura, prompt, seed, prefixo):
    """LTX-2.3 imagem+audio -> video (2 etapas: meia resolucao + ampliacao 2x). Melhorador de prompt DESLIGADO:
    o Gemma 12B gera ~5,7 s por palavra nesta placa (levaria horas)."""
    import copy
    a = copy.deepcopy(api_base)
    a["269"]["inputs"]["image"] = foto
    a["276"]["inputs"]["audio"] = audio
    a["340:331"]["inputs"]["value"] = float(segundos)
    a["340:330"]["inputs"]["value"] = largura
    a["340:324"]["inputs"]["value"] = altura
    a["340:319"]["inputs"]["value"] = prompt
    a["340:349"]["inputs"]["value"] = False
    a["340:285"]["inputs"]["noise_seed"] = seed
    a["340:286"]["inputs"]["noise_seed"] = seed + 1
    a["341"]["inputs"]["filename_prefix"] = prefixo
    return a


def tamanho_ltx(largura_foto, altura_foto, area=704 * 1280):
    ar = largura_foto / altura_foto
    return max(256, round(math.sqrt(area * ar) / 64) * 64), max(256, round(math.sqrt(area / ar) / 64) * 64)


def tamanho(largura_foto, altura_foto, area=832 * 480):
    """Mantem a proporcao da foto com ~480p, multiplos de 16."""
    ar = largura_foto / altura_foto
    w = max(256, round(math.sqrt(area * ar) / 16) * 16)
    h = max(256, round(math.sqrt(area / ar) / 16) * 16)
    return w, h
