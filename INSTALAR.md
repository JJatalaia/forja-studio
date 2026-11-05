# Instalar

São **dois passos**, nesta ordem:

```
1.  baixar os modelos        →  165 GB (ou menos, se escolher uma trilha menor)
2.  aplicar a configuração   →  1 MB
```

O passo 1 é longo e chato — é internet. O passo 2 é instantâneo, e é ele que transforma uma
ComfyUI crua no painel que você viu.

---

## Antes de começar

Confira a placa. Abra o Prompt de Comando e digite:

```bash
nvidia-smi --query-gpu=name,memory.total --format=csv
```

Se não aparecer uma NVIDIA com **16 GB ou mais**, pare aqui: as IAs de vídeo não vão caber e
você vai passar raiva. Com 12 GB dá para usar só a parte de imagem.

Confira o espaço livre. **165 GB** para a trilha completa.

---

## Passo 0 — a ComfyUI

O Estúdio não substitui a ComfyUI: ele comanda a ComfyUI. Baixe a versão portátil do projeto
oficial e descompacte **dentro da pasta deste projeto**, de modo a ficar assim:

```
meu-estudio/
├── ComfyUI_windows_portable/     ← a ComfyUI que você baixou
└── estudio/                      ← este projeto
```

> Se você já tem a ComfyUI em outro lugar, não precisa mover: aponte com a variável de
> ambiente `ESTUDIO_COMFY_DIR`.

Depois instale os **6 complementos** que os workflows usam. Sem eles as IAs aparecem na tela
mas não rodam:

| complemento | para que |
|---|---|
| [`ComfyUI-Easy-Media`](https://github.com/yolain/ComfyUI-Easy-Media) | juntar vídeo e áudio, as faixas de som |
| [`ComfyUI-GGUF`](https://github.com/city96/ComfyUI-GGUF) | o LTX 2.5, que vem em formato GGUF |
| [`ComfyUI-KJNodes`](https://github.com/kijai/ComfyUI-KJNodes) | utilidades usadas em quase todos os workflows |
| [`ComfyUI_Fill-ChatterBox`](https://github.com/filliptm/ComfyUI_Fill-ChatterBox) | a voz dentro da ComfyUI |

A forma mais simples é pelo **ComfyUI Manager**, procurando cada um pelo nome.

---

## Passo 1 — os modelos

A lista está em [IAS-INSTALADAS.md](IAS-INSTALADAS.md): cada arquivo, **o tamanho** e, o mais
importante, **a pasta em que ele tem que cair** dentro de `ComfyUI/models/`.

> ⚠️ **Errar a pasta é o erro mais comum.** Um modelo em `checkpoints/` que devia estar em
> `diffusion_models/` simplesmente não aparece na lista, e parece que o download deu errado.

### 🔑 Dois arquivos pedem login

Os dois arquivos do **LTX 2.5** que vêm do repositório oficial da Lightricks estão atrás de um
portão: você precisa estar logado no Hugging Face e **aceitar a licença** na página do
repositório antes de baixar. Clicar no link sem isso devolve erro 401.

São estes:

- `gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors`
- `ltx-2.5-video-vae-bf16.safetensors`

**O que fazer:** abra [huggingface.co/Lightricks/LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5),
entre na sua conta, aceite a licença, e aí os links da tabela funcionam.

> Existem cópias desses arquivos em outros repositórios, sem portão. **Este projeto não
> aponta para elas**: a Lightricks fechou o acesso de propósito, e contornar isso é passar
> por cima da licença dela. Se você não quiser aceitar a licença, a saída honesta é não
> instalar o LTX 2.5 — as outras oito IAs funcionam sem ele.

### As trilhas

Não baixe tudo de uma vez se você só quer experimentar:

| trilha | peso | o que você consegue fazer |
|---|---|---|
| **Imagem** | **47,2 GB** (8 arquivos) | fotos e ilustrações (Krea 2, Qwen 2512) |
| **Imagem + pessoa falando** | **74,9 GB** (14 arquivos) | o acima, mais foto + texto virando alguém falando |
| **Completa** | **165,2 GB** (25 arquivos) | tudo: as 8 IAs do painel |
| **+ voz local** | +22 GB | narração de graça, no seu computador |
| **+ IA de texto** | +18,7 GB | sugestão de cena e legenda (**opcional**) |

Uma IA cujo modelo você não baixou **aparece marcada como não instalada** no painel — não dá
erro, e você pode baixar depois.

---

## Passo 2 — a configuração

Copie a pasta `estudio/` deste projeto para dentro da pasta do seu estúdio. É ela que leva:

- os **workflows** já ajustados (é aqui que mora o trabalho de verdade);
- o `presets.json`, que diz ao painel quais IAs existem e com que opções;
- o `tempos.json` — **tempos medidos de verdade**, então o painel mostra quanto falta desde a
  primeira geração, em vez de "calculando…";
- as fichas que explicam cada IA na tela.

Depois instale as 6 dependências do Python:

```bash
ComfyUI_windows_portable\python_embeded\python.exe -m pip install -r requirements.txt
```

E ligue:

```bash
ComfyUI_windows_portable\python_embeded\python.exe estudio\server.py
```

Abra `http://127.0.0.1:8194` no navegador.

---

## Passo 3 — a voz (opcional, mas vale)

A narração local é o que tira o último custo mensal do caminho. Instale o
[VoiceStudio](https://github.com/debpalash/VoiceStudio) e, **dentro dele, troque o motor para
o VoxCPM 2**.

> ⚠️ O motor que vem ligado por padrão (OmniVoice) é **CC-BY-NC: não pode ser usado em vídeo
> monetizado.** O VoxCPM 2 é Apache-2.0 e pode. A aba Narração mostra a licença do motor ativo
> — confira antes de publicar.

O painel acha o VoiceStudio sozinho se ele estiver no lugar padrão. Se estiver em outro lugar,
aponte com `ESTUDIO_VOZ_DIR`.

---

## Ajustes por variável de ambiente

Nada aqui é obrigatório — só serve se a sua máquina for diferente:

| variável | para que |
|---|---|
| `ESTUDIO_COMFY_DIR` | a ComfyUI está em outro lugar |
| `ESTUDIO_PORTA` | o painel em outra porta (padrão 8194) |
| `ESTUDIO_VOZ_DIR` | o VoiceStudio está em outro lugar |
| `ESTUDIO_CANAL_DIR` | a pasta do seu canal, usada pela aba Canal automático |
| `ESTUDIO_API_DIR` | onde fica a pasta `API/` com a chave da ElevenLabs |

As pastas também podem ser ajustadas pelo próprio painel; ele guarda em `estudio/config.json`,
que é só seu e não vai para lugar nenhum.

---

## Se der errado

**A IA não aparece na lista.** O arquivo está na pasta errada dentro de `models/`. Confira em
[IAS-INSTALADAS.md](IAS-INSTALADAS.md).

**O painel abre mas diz que a ComfyUI está desligada.** Ela precisa estar rodando na porta
8188. O painel liga sozinho pelo botão da tela de Início.

**A geração começa e morre.** Quase sempre é memória: outra coisa está ocupando a placa.
Feche a outra e tente de novo — e lembre que **a ComfyUI não devolve o modelo quando termina**,
então ela pode estar segurando memória mesmo com a fila vazia.

**Falta um complemento.** O erro da ComfyUI diz o nome do nó que faltou; procure pelo nome na
tabela do Passo 0.
