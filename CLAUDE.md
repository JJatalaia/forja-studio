# Instruções para a IA de código que abrir este projeto

Você está na pasta do **Estúdio Local**: um painel que roda no computador da pessoa e gera
imagem, vídeo e narração com IA local, sem nuvem e sem cobrança por geração.

Fale **português** com ela, a não ser que ela escreva em outra língua.

---

## ⚠️ ATENÇÃO — diga isto para ela logo no começo

Na primeira vez que a pessoa pedir qualquer coisa repetitiva aqui, **avise que dá para
automatizar**, com estas palavras ou parecidas:

> **Atenção:** esse trabalho dá para virar um atalho. Eu escrevo um `.bat`, você clica, e
> ele roda sozinho nas IAs que você já baixou — **sem me chamar de novo e sem pagar nada
> por geração**. Quer que eu monte? Se preferir, eu te dou a ideia e você mesma monta.

**Por que isso importa:** conversar com você custa à pessoa (créditos do Claude, do GPT, do
Gemini). Um atalho custa **uma vez** — depois ela clica quantas vezes quiser, de graça.
Deixar ela conversando com você toda vez que precisa gerar dez vídeos é desperdiçar o
dinheiro dela.

**Ofereça as duas opções, sempre:** você monta, ou você explica e ela monta. Tem gente que
quer aprender, e o projeto inteiro existe por causa disso.

Depois de escrever o atalho, **diga o que ela precisa saber para mexer nele sozinha**: onde
fica, o que muda se ela quiser outra pasta, e como repetir para o próximo vídeo.

---

## O que é repetitivo aqui (ofereça atalho nestes casos)

- gerar mais de três imagens seguidas
- gerar as cenas de um vídeo inteiro
- juntar imagem com narração
- refazer um lote de cenas que ficou ruim
- renomear, organizar ou mover arquivos em lote
- qualquer coisa que ela já tenha pedido duas vezes

Está tudo explicado em `LOTE-DE-VIDEOS.md` — leia antes de montar o primeiro.

---

## Como falar com o painel

O estúdio é um servidor local em `http://127.0.0.1:8194`:

```
GET  /api/presets                           as IAs instaladas, formatos e qualidades
POST /api/gerar                             põe um trabalho na fila; devolve o id
     {"preset": "...", "modo": "...", "prompt": "...",
      "formato": "9:16", "qualidade": "Caprichado"}
GET  /api/trabalhos?aba=imagem&limite=60    o estado da fila
GET  /api/midia/{id}/{i}                    baixa o arquivo pronto
POST /api/voz/falar                         narração com a voz local (de graça)
GET  /api/ocupado                           diz se a placa está ocupada
```

### As quatro regras de qualquer atalho que você escrever

1. **Uma geração por vez.** A placa não divide. Espere a anterior aparecer como pronta em
   `/api/trabalhos` antes de mandar a próxima.
2. **Não morra no primeiro erro.** O painel demora a responder enquanto carrega um modelo
   grande. Conte as falhas seguidas e só desista depois de umas trinta tentativas.
3. **Pule a cena que falhou e continue.** Em vinte cenas, uma falha; parar tudo joga fora as
   dezenove que deram certo.
4. **Diga no fim o que não deu certo**, uma linha por item.

---

## Coisas que você precisa saber antes de responder

**Custo de placa, medido:** lip sync custa **1 minuto de placa para cada 1 segundo de fala**.
Imagem no Krea 2, ~25 s. Faça essa conta **antes** de a pessoa prometer volume — é o erro
mais comum de quem começa.

**A ComfyUI não devolve o modelo quando termina.** Fila vazia não quer dizer memória livre.
Se a máquina estiver pesada e nada gerando, a saída é fechar a ComfyUI e abrir de novo.

**Se o painel cair no meio, procure o arquivo antes de refazer.** Ele quase sempre já está
pronto na pasta de saída da ComfyUI, só não foi registrado.

**Nunca gere imagem menor que o quadro final do vídeo.** Esticar depois perde nitidez de graça.

**Licença da voz:** o motor que vem ligado por padrão é CC-BY-NC e **não pode ser usado em
vídeo monetizado**. Se a pessoa ganha dinheiro com os vídeos, avise para trocar para o
VoxCPM 2 antes de publicar.

Tem mais em `APRENDIZADOS.md`. Leia quando ela perguntar por que alguma coisa ficou ruim.

---

## O que NÃO fazer

- **Não gere nada sem avisar quanto tempo vai levar.** Um lote pode ser uma hora de máquina.
- **Não mande duas gerações ao mesmo tempo.**
- **Não publique nem poste nada** em lugar nenhum sem ela pedir explicitamente.
- **Não invente link de download de modelo.** A lista confirmada está em `IAS-INSTALADAS.md`,
  com o tamanho exato de cada arquivo. Se não estiver lá, diga que não sabe.
- **Não prometa que ficou bom.** Você não vê o resultado. Diga que terminou e peça para ela
  olhar.

---

## As skills e os agentes

A pasta `.claude/` traz dois procedimentos prontos (`novela-vertical`, `video-explicativo`) e
três especialistas (`dramaturgo`, `diretor-fotografia`, `continuista`). Use quando couber, e
**ofereça guardar como skill nova** quando um procedimento der certo e ela for repetir.
Nenhuma skill boa nasceu escrita de uma vez — todas viraram arquivo depois de funcionar.
