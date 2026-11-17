# Deixe uma IA instalar para você

Se você não tem paciência para baixar 25 arquivos e conferir pasta por pasta, **peça para uma
IA fazer**. O Claude Code, o Codex e o Gemini CLI rodam no seu computador e conseguem baixar,
conferir e organizar sozinhos.

Instale uma delas, abra na pasta onde você quer o estúdio, e **cole o texto abaixo**.

---

## O texto para colar

> Quero instalar o **Estúdio Local** nesta pasta. É um painel local de geração de imagem,
> vídeo e narração com IA. Faça o seguinte, na ordem, e me avise a cada etapa:
>
> **1. Confira a minha máquina.** Rode `nvidia-smi` e me diga quanta memória a placa tem. Se
> for menos de 12 GB, pare e me avise — não vai valer a pena. Confira também o espaço livre
> em disco: preciso de pelo menos 50 GB, e de 170 GB para instalar tudo.
>
> **2. Baixe a ComfyUI portátil para Windows** e descompacte aqui, na pasta
> `ComfyUI_windows_portable`.
>
> **3. Instale estes 6 complementos** em `ComfyUI/custom_nodes`, clonando cada um com git:
> `ComfyUI-Easy-Media`, `ComfyUI-GGUF`, `ComfyUI-KJNodes`, `ComfyUI-segment-anything-2`,
> `ComfyUI_Fill-ChatterBox`, `comfyui_controlnet_aux`.
>
> **4. Baixe os modelos.** A lista está em `IAS-INSTALADAS.md`, com o link de download, o
> tamanho e **a pasta de destino** de cada um. Três coisas importantes:
> - Respeite a pasta. Modelo na pasta errada não aparece no painel.
> - Um arquivo precisa ser **renomeado** depois de baixado — a tabela avisa qual.
> - **Confira o tamanho de cada arquivo baixado** contra a tabela. Se não bater, o download
>   veio incompleto: baixe de novo. Não siga em frente com arquivo truncado.
>
> Me pergunte antes de começar quanto eu quero baixar: só imagem (47 GB), imagem mais pessoa
> falando (75 GB), ou tudo (165 GB).
>
> **5. Rode `python setup.py`** e me mostre o resultado. Ele confere tudo, instala as
> dependências e cria o atalho.
>
> **6. Se o setup apontar modelo faltando ou na pasta errada**, conserte e rode de novo até
> ficar limpo.
>
> Fale comigo em português e me avise se alguma coisa der errado, em vez de seguir adiante.

---

## O que esperar

**Vai demorar.** Os downloads somam de 47 a 165 GB. Numa internet de 100 Mb, a instalação
completa leva perto de um dia. A IA vai ficar esperando junto.

**Ela vai te perguntar coisas.** Deixe perguntar. É melhor do que ela decidir sozinha baixar
165 GB que você não queria.

**No fim, o `setup.py` é o juiz.** Enquanto ele não disser "está tudo no lugar", não está.
Ele confere arquivo por arquivo e aponta o que falta e o que está na pasta errada.

## Por que conferir o tamanho é a parte mais importante

Download grande falha no meio com frequência, e o navegador nem sempre avisa. O arquivo fica
lá, com o nome certo, **pela metade** — e o erro que aparece depois, na hora de gerar, não
tem nada a ver com download. Você perde horas procurando no lugar errado.

A tabela traz o tamanho exato de cada arquivo. Conferir leva um segundo e evita isso.

## Se você não quiser usar IA nenhuma

Tudo isso está em [INSTALAR.md](INSTALAR.md), passo a passo, para fazer à mão. A IA só
economiza o trabalho braçal — não faz nada que você não possa fazer sozinho.
