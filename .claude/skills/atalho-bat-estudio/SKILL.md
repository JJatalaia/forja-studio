---
name: atalho-bat-estudio
description: "Transforma trabalho repetido no Estúdio Local (127.0.0.1:8194) num .bat clicável. Use quando ele disser que vai gerar muita coisa igual - uma lista de cenas, refazer as reprovadas, juntar vídeo com narração, montar a vertical - ou quando pedir 'me faz um .bat disso', 'automatiza isso', 'gera tudo de uma vez'. Também serve de base para explicar o método a quem baixar o estúdio no GitHub. O atalho roda sozinho depois, sem IA e sem token."
requires:
  - binary: py
---

# O atalho que a IA escreve

O Estúdio Local é um servidor comum na própria máquina. Quem fala HTTP com ele comanda o
estúdio inteiro — e é isso que faz o token ficar barato: **a conversa comigo acontece uma
vez, para escrever o atalho.** Depois ele roda sozinho, quantas vezes ele quiser, sem IA
aberta e sem cobrança por geração, porque quem gera é a placa dele.

A versão em português para quem baixa o projeto está em `_github/BAT-FEITO-PELA-IA.md`, e o
mesmo resumo aparece na página inicial do estúdio (bloco "Peça para uma IA fazer o trabalho
repetido"). Esta skill é a versão para mim: o que escrever, e onde já se errou.

## Antes de escrever qualquer coisa

1. **Pergunte o que é repetitivo**, não o que é bonito. Eu não vejo a imagem: monto a
   tarefa, ele julga o resultado. Automatizar o braço, nunca o olho.
2. **Leia `/api/presets` antes de escolher a IA.** Os nomes, formatos e qualidades vêm de
   lá; nunca chute um preset nem um rótulo de qualidade.
3. **Confira a fila** em `http://127.0.0.1:8188/queue` antes de começar: a regra dele é uma
   geração por vez, e um lote só começa com a fila vazia.

## Os endereços

```
GET  /api/presets                            as IAs ligadas, com formatos e qualidades
POST /api/gerar                              põe um trabalho na fila, devolve o id
     {"preset":"krea2","modo":"prompt","prompt":"...","formato":"9:16","qualidade":"Normal"}
GET  /api/trabalhos?aba=imagem&limite=60     estado (concluido / rodando / fila / erro / cancelado)
GET  /api/midia/{id}/{i}                     baixa o arquivo pronto
POST /api/voz/falar                          narração com a voz local
GET  /api/ocupado                            a placa está ocupada?
GET  /api/estimativa?preset=...&duracao=...  quanto tempo vai levar (e o tamanho que SAI)
```

O estado de pronto é **`concluido`**, não `pronto` — errei isso uma vez e a galeria ficou
sem miniatura nenhuma.

## As armadilhas que já custaram caro

**Uma geração por vez.** A placa não divide. Mande a próxima só quando a anterior aparecer
como `concluido`. Duas ao mesmo tempo deixam as duas lentas e podem estourar a memória.

**O estúdio pisca.** Carregando um modelo grande ele demora a responder. Um atalho que
desiste no primeiro erro morre no meio de um trabalho de uma hora. Conte falhas **seguidas**
e só desista depois de ~30 tentativas de 8 s (uns 4 minutos de silêncio).

**Arquivo órfão.** Se o estúdio cair com um trabalho rodando, o arquivo quase sempre já está
na pasta de saída da ComfyUI, só não foi registrado. Procure lá **antes** de mandar refazer:
isso já salvou um vídeo de uma hora de placa.

**A barra-um em caminho do Windows.** `"referencias\1_rosto.png"` dentro de uma string normal
de Python vira silenciosamente `chr(1)`. Não dá erro, só gera no lugar errado. Use string
crua (`r"..."`) ou `os.path.join`. Aconteceu 4 vezes num dia só.

**O .bat precisa de CRLF** e o `.ps1` precisa de UTF-8 **com BOM**, senão o acento sai torto
e o arquivo não roda. Escreva o .bat com quebra de linha do Windows.

**`start /min` + `exit` num .bat esconde o erro:** a janela fecha antes de a pessoa ler o que
deu errado. Em atalho que pode falhar, termine com `pause`.

## O formato da entrega

Sempre dois arquivos, no padrão dele:

- o trabalho de verdade em Python, na pasta do seu projeto;
- um `.bat` curto na **Área de Trabalho**, que só chama o Python e dá `pause` no fim.

```bat
@echo off
chcp 65001 >nul
title Gerar as cenas
py "C:\Users\<voce>\Videos\meu-canal\gerar_cenas.py" %*
pause
```

O Python é que faz o laço, espera cada geração terminar, conta as falhas e procura o órfão.
O .bat é só o botão.

## Como terminar

Diga em português o que o atalho faz, onde ele ficou, e **o que ele NÃO faz** — se ele não
escolhe a melhor imagem, se não publica, se não apaga nada, fale. E lembre que da segunda vez
em diante não precisa falar comigo: é só clicar.
