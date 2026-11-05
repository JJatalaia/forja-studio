# As skills e os agentes

Este projeto vem com uma pasta `.claude/`. Se você usa o **Claude Code**, ela é lida sozinha e
você ganha ajudantes que já sabem fazer o trabalho do jeito que funciona aqui. Se você não
usa, pode apagar: o painel funciona igual.

É a mesma ideia de [BAT-FEITO-PELA-IA.md](BAT-FEITO-PELA-IA.md) — a IA de código como peão do
estúdio — só que em vez de você explicar tudo de novo a cada conversa, a instrução já está
escrita e versionada.

## A diferença entre skill e agente

**Skill** é um procedimento: o passo a passo de fazer uma coisa inteira, do começo ao fim.
Você chama pelo nome e ela conduz.

**Agente** é um especialista: um parecer sobre uma parte. Ele não executa o trabalho todo —
ele olha o que você fez e aponta o que está errado, do ponto de vista dele. Vários podem
olhar a mesma cena e discordar, e é justamente aí que eles valem.

## As skills

### `novela-vertical`
Escrever ou revisar roteiro de novela vertical 9:16, em partes de cerca de 1 minuto, na tabela
**Cena | O que se vê (em inglês) | Fala (em português)** — que é o formato que as IAs de vídeo
entendem sem brigar.

Traz uma seção de **armadilhas da gravação**: as coisas que já quebraram na prática e que não
estão em manual nenhum.

### `atalho-bat-estudio`
Transformar trabalho repetido num **`.bat` que você clica**: gerar uma lista de cenas, refazer
só as que ficaram ruins, juntar vídeo com narração, montar a versão vertical.

É a skill que põe em prática o [BAT-FEITO-PELA-IA.md](BAT-FEITO-PELA-IA.md): ela já sabe os
endereços do estúdio, sabe esperar uma geração terminar antes da próxima, e sabe as armadilhas
que custaram caro aqui — o estúdio que **pisca** quando carrega um modelo grande, o **arquivo
órfão** que já está pronto quando parece perdido, e o `.bat` que precisa de CRLF para não sair
com acento torto.

Você paga a conversa **uma vez**. O atalho roda para sempre, sem IA aberta.

### `video-explicativo`
Monta um vídeo explicativo no estilo Vox — narração por cima de imagens, sem rosto — do zero,
só com o que roda local.

## Os agentes

### `dramaturgo`
Roteirista de série curta brasileira. Olha arco emocional, diálogo natural com sotaque, gancho
de fim de trecho e os "ecos" que pagam no final. Serve para quando a cena está correta e mesmo
assim não emociona.

### `diretor-fotografia`
Traduz a cena em linguagem de câmera que a IA executa bem: enquadramento, lente, movimento,
luz, cor. É o agente que resolve o problema mais comum de todos — **a imagem parece de IA**.
A receita curta: diga a **lente**, a **luz** e o **tipo de filme**, e pare de descrever o lugar
em adjetivo.

### `continuista`
O script supervisor. Confere o que muda de uma cena para a outra: roupa, sujeira, machucado,
curativo, cabelo, objeto na mão, posição, hora do dia. É o erro mais fácil de cometer e o mais
difícil de ver sozinho, porque você olhou cada cena isolada e elas estavam todas certas.

## Como usar

Com o Claude Code aberto na pasta do projeto:

```
"Usa a skill novela-vertical e escreve a parte 3 do capítulo 1."
"Chama o continuista para conferir estas 8 cenas antes de eu gerar."
"Passa o diretor-fotografia nesse prompt, a imagem está parecendo de IA."
```

## O que não veio junto, e por quê

O dono deste projeto tem outras skills e agentes que **não estão aqui**: são sobre o jogo que
ele joga e sobre a novela específica dele — analisar vídeo de guerra de um servidor de MMO,
montar o placar, escrever a narração daquele canal. Não serviriam a mais ninguém.

Se você quiser os seus, o caminho é o mesmo: peça para a IA de código escrever a skill
descrevendo o **seu** procedimento, e guarde em `.claude/skills/`. É assim que estes
nasceram — nenhum foi escrito de uma vez; todos viraram arquivo **depois** de o trabalho dar
certo na mão.
