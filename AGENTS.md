# Instruções para a IA de código que abrir este projeto

> Este arquivo é igual ao `CLAUDE.md`. Existem os dois porque cada IA procura um nome:
> o Claude Code lê `CLAUDE.md`, o Codex e outras leem `AGENTS.md`.

Você está na pasta do **Estúdio Local**: um painel que roda no computador da pessoa e gera
imagem, vídeo e narração com IA local, sem nuvem e sem cobrança por geração.

Fale **português** com ela, a não ser que ela escreva em outra língua.

---

## 🟢 A PRIMEIRA COISA: a plataforma instala sozinha, as IAs vêm DEPOIS

Se a pessoa está instalando agora, **não a mande baixar 275 GB.** A ordem é esta:

```
1.  a PLATAFORMA   →  ~5,6 GB   (a ComfyUI portátil + o Python + este pacote)
2.  as IAs         →  depois, uma por uma, pelo BOTÃO da própria tela
```

Com 5,6 GB ela já abre o estúdio, cria a conta, navega e entende o que é o programa.
Reserve **50 GB livres** para começar — a plataforma mais a primeira IA mais a folga do
Windows.

**Dentro do estúdio**, em Imagem ou Vídeo, cada IA mostra o próprio estado:

```
Z-Image Turbo       Falta instalar — 19,3 GB     ← clicável
Qwen-Image 2512     instalada
```

Ela clica, confirma, e o download roda em segundo plano. Dá para usar o estúdio enquanto
baixa, e **se parar no meio continua de onde parou**.

**O que você deve dizer a ela:**

> Instale só a plataforma primeiro — são 5,6 GB e abre em minutos. Depois, lá dentro,
> você escolhe quais IAs quer e clica em "Falta instalar". Comece por uma leve:
> **Z-Image Turbo** (19,3 GB) para imagem, ou **Wan 2.2 5B** (16,9 GB) para vídeo.
> Testa na sua máquina e decide com número na mão se vale baixar o resto.

**Erros que você NÃO deve cometer aqui:**

- ❌ Mandar baixar tudo "para garantir". São 275 GB e a maioria desiste no meio.
- ❌ Mandar baixar modelo à mão quando o botão resolve. Baixar à mão só serve para os
  arquivos que o painel não sabe de onde buscar — estão listados no `IAS-INSTALADAS.md`.
- ❌ Dizer que uma IA "não funciona" quando ela só **não foi baixada**. Olhe o cartão: se
  está escrito "Falta instalar", é isso. Não existe defeito nenhum.
- ❌ Somar o tamanho das IAs. Várias dividem os mesmos arquivos, e a soma dá muito mais
  que o download real. O `REQUISITOS.md` tem a tabela com as três colunas certas.

**Se ela pedir para você baixar:** dá para chamar as mesmas rotas que o botão usa —
`GET /api/ias` diz o estado de cada uma, `POST /api/ias/instalar {"id": "z_image_turbo"}`
começa. Mas **prefira mostrar o botão a ela**: é a tela dela, e ela precisa saber mexer
sozinha depois que você sair.

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

---

## ⛔ REGRA: teste o MOTOR, não a sua máquina

Quem instalou isto vai **usar os motores** — a ComfyUI, o VoiceStudio, cada modelo. É neles
que o programa vive. Então, antes de dizer para ela que alguma coisa funciona:

1. **Rode o motor de verdade.** Não conclua pela documentação, pela lista de ferramentas nem
   por um HTTP 200. Chame e olhe o que voltou. Exemplo real deste projeto: o `transcribe` do
   VoiceStudio **existe, aparece na lista de ferramentas e não funciona** — por dentro ele
   chama `http://127.0.0.1/transcribe`, sem a porta, e responde 403.
2. **Teste na máquina DELA, não na sua.** Se você está num computador onde tudo já está
   instalado, você não está testando nada. Confira num Python limpo, sem as bibliotecas
   extras, com o cofre trancado, com a pasta de modelos vazia.
3. **Toda dependência que não vem no pacote tem que estar no `INSTALAR.md`** — com o
   comando, o tamanho e o que deixa de funcionar sem ela.
4. **Pode falhar; não pode falhar calado.** A mensagem diz o que falta e como resolver.
5. **Conferência que você inventa AVISA, nunca impede.** Quem recusa é o motor, com o motivo
   dele. Regra calibrada em dois ou três casos é palpite com cara de lei — e já reprovou
   áudio bom aqui.

Erros que este projeto já cometeu por pular isso: um botão que funcionava só na máquina de
quem programou; uma conferência de áudio que reprovava fala boa; e o montador do pacote
aceitando código que não compila.

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
