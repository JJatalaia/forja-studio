# Usar

O painel abre em `http://127.0.0.1:8194`. A tela de Início mostra os serviços e um cartão por
aba. Este manual é aba por aba, e cada uma termina com **as armadilhas** — coisas que já
custaram horas de placa aqui e que você não tem por que repetir.

## A regra que vale para o painel inteiro

> **Uma geração por vez.**

A fila é serial de propósito. A placa não divide: duas gerações ao mesmo tempo deixam as duas
lentas e podem estourar a memória no meio. Se você mandar outra, ela espera — e isso é o
comportamento certo, não um defeito.

---

## Imagem

Escolha a IA, escreva o que quer, escolha formato e qualidade.

- **Krea 2 Turbo** é o cavalo de batalha. Faz foto realista e aguenta o dia inteiro.
- **Qwen-Image 2512** é melhor quando a imagem tem **texto escrito** ou precisa seguir uma
  instrução mais complicada.
- **Krea 2 — Transformar imagem** parte de uma imagem sua em vez do nada.

**Para a foto parecer foto**, escreva como fotógrafo, não como pintor. Diga a **lente**, a
**luz** e o **tipo de filme**:

> *Candid photograph, shot on 35mm film, 50mm lens at f/2, natural window light, Kodak Portra
> 400, visible grain, natural skin texture with pores and fine wrinkles, no retouching.*

### Armadilhas

**Nunca gere menor que o quadro final.** Se o vídeo é 1080×1920 e você gerou 768×1376, a
montagem estica 1,4× e a nitidez que você pagou vai embora. Gere no tamanho certo desde o
começo: custa o mesmo.

**Efeito de ambiente que você não controla, não peça.** Pedir "serragem no ar" ou "poeira" na
maioria das vezes devolve um chuvisco branco feio. Se quiser, ponha no **negativo**:
`dust specks, floating particles, bokeh dots`.

**Cuidado com a palavra "quente".** "Luz de lâmpada quente" tinge a cena inteira de laranja.
Se a imagem está puxando para o vermelho, procure a palavra quente no seu texto — ela costuma
estar lá.

---

## Vídeo

- **MiniMax H3 — Referências** é o principal: você dá imagens de referência e ele gera o vídeo
  **com áudio**.
- **MiniMax H3 Fast** é a versão rápida, de 8 passos, para quando você quer ver se a ideia
  presta antes de gastar.
- **LTX 2.5** vem em dois sabores, texto→vídeo e imagem→vídeo. É rápido e também faz áudio.

### Armadilhas

**Vídeo é caro em tempo, não em dinheiro.** Faça o rascunho no Fast, aprove, e só então rode
o bom. Rodar o caprichado primeiro é o jeito mais fácil de perder uma tarde.

**Conte o tempo antes de começar.** Um lote de cenas que parece rápido pode virar horas. O
painel mostra a estimativa — leia antes de mandar.

---

## Pessoa falando

Uma foto de frente, um texto, e sai alguém falando com a boca sincronizada.

**O custo real, medido:** cerca de **1 minuto de placa para cada 1 segundo de fala**. Um vídeo
de um minuto de narração é uma hora de máquina. Multiplique isso antes de prometer volume.

### Armadilhas

**A foto tem que ser de frente, com o rosto inteiro e bem iluminado.** Rosto de lado, cortado
ou escuro estraga a sincronia da boca, e não tem prompt que conserte.

**Se o painel cair no meio, procure o arquivo antes de refazer.** O vídeo quase sempre já está
pronto dentro da pasta de saída da ComfyUI — só não foi registrado. Aqui isso já salvou uma
hora de placa que ia ser refeita à toa.

---

## Narração

Texto vira voz no seu computador, de graça. Dá para **criar uma voz pela descrição** ("homem
idoso, voz grave, fala devagar") ou **clonar** uma voz a partir de um áudio curto.

**O português sai limpo**: medido em 98% de acerto contra o texto original.

### ⚠️ A armadilha que pode te dar prejuízo

**O motor que vem ligado por padrão é CC-BY-NC: não pode ser usado em vídeo monetizado.**
Troque para o **VoxCPM 2** (Apache-2.0) antes de publicar. A aba mostra a licença do motor
ativo — é a primeira coisa a olhar.

### Armadilha técnica

**Confira ouvindo, não só olhando o texto.** O motor às vezes continua "falando" depois que o
texto acabou. O painel corta isso sozinho conferindo com transcrição, mas num texto longo vale
ouvir antes de montar o vídeo em cima.

---

## Canal automático

A esteira inteira: você escreve o texto, ele sugere as cenas, gera as imagens, gera a voz e
monta o vídeo.

**Ele faz a conta do tempo ANTES de começar** — é de propósito. Você vê quantas horas de placa
vai custar e decide com o número na frente, em vez de descobrir no meio.

### Armadilha

**Modo automático não dispensa olhar.** Ele garante que o trabalho acontece, não que ficou
bom. Revise as cenas sugeridas antes de mandar gerar: refazer uma cena custa minutos, refazer
o vídeo todo custa horas.

---

## Quando alguma coisa trava

**A fila parou.** Veja a tela de Início: se a ComfyUI estiver em "ligando", ela está
carregando um modelo grande. Modelo de 20 GB demora minutos para subir na primeira vez.

**A memória não volta sozinha.** A ComfyUI **não devolve o modelo quando o trabalho termina** —
deixa tudo carregado esperando o próximo. Fila vazia não quer dizer memória livre. Se o
computador estiver pesado, feche a ComfyUI e abra de novo.

**Deu erro e você não entendeu.** O painel guarda o erro no trabalho; abra a lista e clique
nele. A mensagem da ComfyUI costuma dizer o nome do nó ou do arquivo que faltou.
