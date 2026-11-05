---
name: comfyui-nao-devolve-memoria
description: A ComfyUI segura o modelo na memoria mesmo com a fila vazia
metadata:
  type: reference
---

# Fila vazia nao quer dizer memoria livre

**A ComfyUI nao devolve o modelo quando o trabalho termina.** Ela deixa tudo carregado na RAM
e na placa esperando o proximo pedido.

Medido: duas ComfyUI **paradas**, fila zerada, segurando **36 GB de RAM** e 12 dos 16 GB da
placa. Fechar as duas devolveu tudo.

**Como aplicar:** se o computador esta pesado e nada esta gerando, feche a ComfyUI e abra de
novo. E nao olhe so a fila para decidir se ha memoria - olhe o processo.
