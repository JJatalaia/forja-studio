# O atalho que a IA escreve para você

Esta é a parte que a maioria das pessoas não sabe que dá para fazer, e é a que mais muda a
vida de quem usa o estúdio.

Você **não precisa aprender a programar** para automatizar o seu trabalho aqui. Você pede
para uma IA de código — o **Claude Code**, o **Gemini CLI**, o **Codex** — e ela escreve o
atalho. Você clica nele e ele roda, na sua máquina, usando **as IAs que você já baixou**.

Nada vai para a nuvem. Nada é cobrado por geração.

## Por que isso importa em dinheiro

O dono deste projeto mediu, em outubro de 2026, o que custava gerar um clipe de 10 segundos
num serviço de nuvem conhecido: **US$ 4,62**. O mesmo clipe, aqui, custa o que custa a
energia da sua placa.

A conta que vira o jogo não é a do clipe solto. É a da repetição: **o atalho que a IA
escreveu funciona para sempre**, e cada vez que você clica nele não entra nenhuma cobrança.
Quem faz vídeo em série paga a nuvem todo mês; aqui você paga a placa uma vez.

## Como é na prática

O exemplo verdadeiro — é assim que os vídeos de um senhor idoso narrando poemas são feitos
neste projeto:

> **Você escreve para a IA de código:**
>
> *"Lê o arquivo `cenas.json`. Para cada cena, manda o estúdio local gerar a imagem no preset
> `qwen_image_2512`, formato 9:16, e espera terminar antes de mandar a próxima. No fim, junta
> tudo com a narração em um vídeo. Me entrega isso como um `.bat` que eu clico."*
>
> **A IA entrega `GERAR VIDEO.bat` na sua Área de Trabalho. Você clica. Ele roda.**

Da segunda vez em diante você só clica. A IA de código não precisa estar aberta.

## O que a IA precisa saber (cole isto para ela)

O estúdio é um servidor comum na sua própria máquina, em `http://127.0.0.1:8194`. Quem souber
falar com ele por HTTP comanda o estúdio inteiro. Cole o bloco abaixo na conversa com a IA de
código e ela já sabe tudo o que precisa:

```
O Estúdio Local roda em http://127.0.0.1:8194 e tem estes endereços:

  GET  /api/presets      a lista de IAs instaladas, com os formatos e as qualidades de cada uma
  POST /api/gerar        põe um trabalho na fila
                         corpo: {"preset": "...", "modo": "...", "prompt": "...",
                                 "formato": "9:16", "qualidade": "Caprichado"}
                         devolve o id do trabalho
  GET  /api/trabalhos?aba=imagem&limite=60    o estado da fila (pronto / gerando / erro)
  GET  /api/midia/{id}/{i}                    BAIXA o arquivo pronto
  GET  /api/pastas       as pastas desta máquina (pergunte, não chute)
  POST /api/voz/falar    gera narração com a voz local (de graça)
  GET  /api/ocupado      diz se a placa está ocupada

ONDE OS ARQUIVOS FICAM: eles NÃO caem na minha pasta de trabalho. A imagem e o vídeo ficam
na pasta de saída da ComfyUI, e a narração em outra; pergunte em /api/pastas. Para usar um
arquivo, BAIXE por /api/midia/{id}/{i} e salve você mesmo onde eu pedi. Não escreva caminho
de pasta dentro do atalho: numa outra instalação ele quebra.

NÃO VEM NADA PRONTO: não há vídeo, imagem nem música de exemplo aqui dentro. Tudo é gerado
na hora, pela minha placa. Trilha sonora este estúdio não gera: use música que eu já tenha
no disco.

REGRA: uma geração por vez. Mande a próxima só depois que a anterior aparecer como pronta
em /api/trabalhos. A placa não dá conta de duas ao mesmo tempo e as duas ficam lentas.
```

## As três perguntas que todo mundo faz antes de começar

**"As imagens ficam na pasta que eu vou usar?"** Não. Quem salva o arquivo é a ComfyUI, na
pasta de saída **dela** — e a narração vai para uma terceira pasta. Peça `GET /api/pastas` e
o estúdio diz onde é **nesta** máquina. Mas o jeito certo no atalho é outro: **baixe** o
arquivo por `GET /api/midia/{id}/{i}` e salve você mesmo na pasta do seu projeto. Caminho de
pasta escrito dentro do atalho quebra na máquina do vizinho — a pasta de saída existe para
você **procurar arquivo órfão** quando o estúdio cai no meio, não para o atalho depender dela.

**"Os vídeos já vêm, ou é para gerar?"** É para gerar. **Não vem nenhum vídeo, nenhuma imagem
e nenhum áudio de exemplo** no pacote — ele tem 1,5 MB de código, e o que pesa são as IAs que
você baixa depois, pelo botão. Tudo que sai daqui nasce na sua placa, na hora. Por isso a conta
do tempo é obrigatória antes de prometer trabalho a alguém:

| | |
|---|---|
| imagem (modelo já carregado) | ~25 s |
| narração | poucos segundos |
| montagem com ffmpeg | ~30 s |
| **pessoa falando (lip sync)** | **~1 min de placa para cada 1 s de fala** |

**"E música, já tem?"** Não tem — **e não há motor de música neste estúdio**. Ele instala IA de
imagem e vídeo, IA de texto e IA de voz; a aba de música nem aparece na tela sem os projetos
dela. Para trilha, use música que você já tenha no disco e mande o atalho juntar com o ffmpeg.
A narração, essa sim é feita aqui, de graça, pela voz local.

## As três armadilhas (já custaram caro aqui)

**1. Uma geração por vez.** A placa não divide. Duas ao mesmo tempo deixam as duas lentas e
podem estourar a memória. O atalho tem que **esperar a anterior terminar**.

**2. O estúdio pisca, e o atalho não pode morrer por isso.** Quando a placa está carregando
um modelo grande, o estúdio demora a responder. Se o seu atalho desiste no primeiro erro, ele
morre no meio de um trabalho de uma hora. O jeito certo é **contar as falhas seguidas** e só
desistir depois de várias:

```python
falhas = 0
while True:
    try:
        lista = requests.get(f"{ESTUDIO}/api/trabalhos?aba=imagem&limite=60", timeout=30).json()
        falhas = 0
    except Exception as e:
        falhas += 1
        if falhas > 30:          # 30 tentativas de 8 s = 4 minutos de silêncio
            sys.exit(f"ERRO: o estúdio não responde há 4 minutos ({e}).")
        continue
```

**3. Procure o arquivo órfão antes de gerar de novo.** Se o estúdio cair com um trabalho
rodando, **o arquivo quase sempre já está pronto** na pasta de saída da ComfyUI — só não foi
registrado. Olhe lá antes de mandar refazer. Aqui isso já salvou um vídeo de uma hora de
placa que seria refeito à toa.

## O que pedir, e o que não pedir

Peça o que é **repetitivo e chato**: gerar uma lista de cenas, renomear em lote, juntar vídeo
com narração, refazer só as cenas que ficaram ruins, montar a versão vertical.

Não peça que ela **decida por você** o que fica bonito. Na geração de imagem a IA de código
não vê o resultado — ela monta a tarefa, você julga. O atalho automatiza o braço, não o olho.

## E o custo da IA de código?

O Claude Code e o Gemini CLI cobram pelo que você conversa com eles — alguns centavos por
atalho escrito. Mas é **uma vez por atalho**: depois você clica quantas vezes quiser, de
graça. O que você estava pagando na nuvem era por geração, para sempre.
