# Instalar

## A ordem mudou, e para melhor (06/11/2026)

Antes era preciso baixar **275 GB de modelos antes de ver a primeira tela**. Agora não:

```
1.  a PLATAFORMA   →  ~5,6 GB   abre em minutos, e já funciona
2.  as IAs         →  depois, uma por uma, pelo botão da própria tela
```

**Você instala o programa, abre, cria sua conta, navega — tudo com 5,6 GB.** As IAs
aparecem na tela escritas **"Falta instalar — 19,3 GB"**, com um botão ao lado. Você
baixa só as que quiser, quando quiser, e só as que o seu computador aguentar.

Quem só quer fazer imagem baixa **19,3 GB** e acabou. Não precisa dos 275.

### O que cabe nesses 5,6 GB

| | |
|---|---|
| a ComfyUI portátil e o Python | ~5,6 GB |
| o Forja Studio (este pacote) | 1,6 MB |
| **modelos de IA** | **zero — vêm depois** |

Reserve **50 GB livres** para começar: os 5,6 da plataforma, a primeira IA (a mais leve é
a Wan 2.2 5B, 16,9 GB) e a folga que o Windows precisa para respirar.

### Como instalar uma IA, depois

Dentro do estúdio, em Imagem ou Vídeo, cada IA mostra o próprio estado:

```
Z-Image Turbo          Falta instalar — 19,3 GB     [clique]
Krea 2 Turbo           Falta instalar — 17,8 GB     [clique]
Qwen-Image 2512        instalada
```

Clica, confirma, e ele baixa em segundo plano. **Dá para usar o estúdio enquanto baixa.**
Se você fechar no meio, ou a internet cair, **continua de onde parou** — não recomeça.

Uma de cada vez, de propósito: duas conexões grandes na mesma internet terminam as duas
mais devagar.

### Duas coisas que o botão não faz

- **Não apaga IA.** Apagar modelo de 20 GB por engano é estrago grande; se um dia
  existir, será com confirmação escrita.
- **Não baixa o que não sabe de onde.** Dois arquivos do catálogo (os `gemma` do LTX 2.3)
  não têm endereço conhecido. Essas IAs aparecem como **"baixar à mão"**, e o
  `IAS-INSTALADAS.md` diz quais arquivos são.

---

## Antes de começar

Confira a placa. Abra o Prompt de Comando e digite:

```bash
nvidia-smi --query-gpu=name,memory.total --format=csv
```

Se não aparecer uma NVIDIA com **16 GB ou mais**, pare aqui: as IAs de vídeo não vão caber e
você vai passar raiva. Com 12 GB dá para usar só a parte de imagem.

Confira o espaço livre. **165 GB** para a trilha completa.

### O ffmpeg

Instale o **ffmpeg** e deixe-o no PATH:

```bash
winget install Gyan.FFmpeg
```

Confira com `ffmpeg -version` numa janela NOVA do Prompt.

Ele não vem no pacote de propósito — é binário de terceiro, e cada sistema tem a sua
versão. Sem ele o painel ainda abre e gera imagem e vídeo, mas perde o que mexe com arquivo
de mídia que **você** envia: converter áudio ou vídeo enviado responde *"O ffmpeg não foi
encontrado neste computador"*, e a conferência do áudio de referência do clone de voz passa
a dizer *"não consegui medir"* e libera o clone às cegas. Nada quebra calado: a tela avisa.

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

Depois instale **2 complementos**. Sem eles as IAs aparecem na tela mas não rodam:

| complemento | para que |
|---|---|
| [`ComfyUI-Easy-Media`](https://github.com/yolain/ComfyUI-Easy-Media) | o MiniMax H3, o carregador de modelo e as faixas de som |
| [`ComfyUI-GGUF`](https://github.com/city96/ComfyUI-GGUF) | o LTX 2.5, que vem em formato GGUF |

A forma mais simples é pelo **ComfyUI Manager**, procurando cada um pelo nome.

> **Este número já esteve errado, e vale contar por quê.** O manual dizia "6
> complementos" e listava 4 — quem instalasse ia procurar dois que não estavam escritos.
> Em 06/11/2026 eu abri os 11 workflows que viajam no pacote, peguei os **78 tipos de nó**
> que eles usam e procurei cada um dentro do código de cada complemento. Resultado: **73
> nós são da ComfyUI de fábrica** e só estes 2 complementos são necessários. Os outros
> quatro que existem na máquina de origem (KJNodes, segment-anything-2, controlnet_aux,
> Fill-ChatterBox) **nenhum workflow deste pacote usa** — são de outros trabalhos.

---

## Passo 1 — os modelos (OPCIONAL: dá para fazer tudo pelo botão da tela)

> **Leia isto antes de baixar nada à mão.** Desde 06/11/2026 o estúdio baixa cada IA
> sozinho, pelo botão "Falta instalar" que aparece no cartão dela. Esta seção continua
> aqui para quem prefere baixar por fora — internet melhor noutra máquina, modelo que
> já tem no disco, ou os dois arquivos que o painel não sabe de onde buscar.

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
