---
name: custo-de-placa-medido
description: Quanto custa de placa cada coisa - numeros medidos, nao estimativa
metadata:
  type: reference
---

# Custo de placa, medido

| trabalho | custo real |
|---|---|
| **pessoa falando (lip sync)** | **~1 min de placa para cada 1 s de fala** |
| imagem no Krea 2 (modelo ja carregado) | ~25 s |
| imagem no Qwen 2512, caprichado | ~400 s |
| video no LTX 2.5 | 3 a 6,6 min |
| montagem final (ffmpeg) | ~28 s |

**Multiplique antes de prometer volume.** Um video com 1 minuto de narracao e uma hora de
maquina so no lip sync.

**Carregar o modelo e parte do custo.** A primeira geracao depois de trocar de IA pode levar
4 minutos so subindo o modelo. Gere tudo da mesma IA de uma vez - alternar entre duas IAs
grandes desperdica a tarde.

Ver [[uma-geracao-por-vez]] e [[comfyui-nao-devolve-memoria]].
