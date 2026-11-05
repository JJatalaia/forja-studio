# Fazer muitos vídeos de uma vez

Um vídeo você faz clicando no painel. **Dez vídeos por semana você não faz clicando** — você
faz uma vez e repete. Este manual é a receita: como arrumar as pastas, o que escrever para a
IA de código, e o que ela devolve.

Leia primeiro o [BAT-FEITO-PELA-IA.md](BAT-FEITO-PELA-IA.md), que explica a ideia. Este aqui
é o passo a passo.

---

## 1. Arrume as pastas antes de pedir qualquer coisa

**Esta é a etapa que as pessoas pulam, e é a que decide se vai funcionar.** A IA não adivinha
onde estão as suas coisas. Se o material estiver espalhado, metade do trabalho dela vira
procurar arquivo — e ela erra.

Monte assim, uma pasta por vídeo:

```
meu-canal/
├── 01-primeiro-video/
│   ├── texto.txt            o que vai ser narrado, do começo ao fim
│   ├── cenas.json           a lista de cenas (a IA monta, se você não tiver)
│   ├── imagens/             as imagens geradas vão cair aqui
│   ├── voz/                 a narração gerada
│   └── pronto/              o vídeo montado
├── 02-segundo-video/
│   └── (igual)
└── referencias/
    ├── personagem.png       a ficha do personagem, se tiver um fixo
    └── logo.png             o que se repete em todo vídeo
```

**A regra:** o que é de um vídeo fica na pasta dele; o que se repete fica em `referencias/`.
Simples assim — e é o que permite dizer "faz igual ao 01, mas com este texto".

## 2. O `cenas.json`

É o coração da coisa: a lista do que vai aparecer, em ordem. Uma cena por bloco:

```json
[
  { "n": 1, "fala": "Era uma tarde quieta de domingo.",
    "imagem": "Um senhor sentado na poltrona perto da janela, luz de fim de tarde" },
  { "n": 2, "fala": "E ele lembrou da casa da infância.",
    "imagem": "Uma casa simples de interior vista do portão, árvore grande na frente" }
]
```

`fala` é o que a voz diz. `imagem` é o que se vê. **Não precisa saber escrever isso**: peça
para a IA montar a partir do seu `texto.txt`, e depois leia e corrija. Ler e corrigir é
rápido; refazer vídeo é caro.

## 3. O que pedir para a IA de código

Abra o Claude Code (ou Gemini CLI) na pasta `meu-canal` e peça:

> Lê o `01-primeiro-video/cenas.json`. Para cada cena:
> 1. manda o estúdio local (`http://127.0.0.1:8194`) gerar a imagem no preset `krea2`,
>    formato 9:16, e salva em `01-primeiro-video/imagens/cena-01.png` e assim por diante;
> 2. **espera terminar antes de mandar a próxima** — a placa só faz uma por vez;
> 3. depois gera a narração de cada fala com a voz local e salva em `voz/`;
> 4. no fim, monta tudo com ffmpeg em `pronto/video.mp4`, cada imagem durando o tempo da
>    fala dela.
>
> Me entrega isso como um `.bat` que eu clico. Se uma cena falhar, **pula e continua**, e no
> fim me diz quais falharam — não pare tudo por causa de uma.

Da segunda vez você só muda o número da pasta. Da terceira, você só clica.

## 4. As quatro coisas que precisam estar no pedido

Se faltar uma destas, o atalho vai dar problema no meio:

**Uma geração por vez.** A placa não divide. Sem isso, as duas gerações ficam lentas e podem
estourar a memória.

**Não morrer no primeiro erro.** O estúdio demora a responder enquanto carrega um modelo
grande. O atalho tem que tentar várias vezes antes de desistir — senão ele morre no meio de
um trabalho de uma hora.

**Pular a cena que falhou.** Em vinte cenas, uma falha. Se o atalho parar tudo, você perde as
dezenove que já tinham dado certo.

**Dizer no fim o que não deu certo.** Um relatório de uma linha por cena. Sem isso, você
descobre o buraco só quando assiste.

## 5. Quanto tempo vai levar — faça a conta ANTES

| | |
|---|---|
| imagem (Krea 2, modelo já carregado) | ~25 s |
| narração | rápido, poucos segundos |
| **pessoa falando (lip sync)** | **~1 min de placa para cada 1 s de fala** |
| montagem | ~30 s |

Um vídeo de 20 cenas só com imagem e narração: **uns 15 minutos**.
O mesmo vídeo com um apresentador falando 1 minuto: **mais uma hora**.

> **Multiplique antes de prometer.** O erro mais comum de quem começa é combinar dez vídeos
> por semana sem ter feito essa conta.

## 6. Depois que rodar

**Assista antes de publicar.** A IA garante que o trabalho aconteceu, não que ficou bom.

**Se uma cena ficou ruim, refaça só ela.** Peça: *"refaz só a cena 7 com este prompt"*. Um
minuto contra meia hora.

**Se o estúdio caiu no meio**, procure o arquivo antes de mandar refazer: ele quase sempre
está pronto na pasta de saída da ComfyUI, só não foi registrado.

## 7. Quando o canal pegar o jeito

Depois do terceiro vídeo você vai perceber que o pedido é sempre o mesmo. Aí vale pedir para
a IA guardar o procedimento como uma **skill** em `.claude/skills/`, e das próximas vezes é
só dizer o nome dela. Tem dois exemplos prontos no projeto:
[SKILLS-E-AGENTES.md](SKILLS-E-AGENTES.md).

Nenhuma skill boa nasceu escrita de uma vez. Todas viraram arquivo **depois** de o trabalho
dar certo na mão.
