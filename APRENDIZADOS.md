# O que a gente aprendeu apanhando

Isto é o resumo das anotações de 40 dias fazendo vídeo nesta montagem. Cada item aqui custou
tempo de placa ou um vídeo refeito. **São números medidos, não estimativa** — quando não deu
para medir, está escrito que não deu.

É provavelmente a parte mais útil deste repositório. Instalar qualquer um instala; o que
demora a aprender é isto.

---

## Custo de máquina (medido)

| trabalho | custo real |
|---|---|
| **pessoa falando (lip sync)** | **~1 minuto de placa para cada 1 segundo de fala** |
| imagem no Krea 2, modelo já carregado | ~25 s |
| imagem no Qwen 2512, caprichado | ~400 s |
| vídeo no LTX 2.5 | 3 a 6,6 min |
| montagem final (ffmpeg) | ~28 s |

**Multiplique antes de prometer volume.** Um vídeo com 1 minuto de narração é uma hora de
máquina só no lip sync. Foi a conta que mais surpreendeu aqui.

**Carregar o modelo é parte do custo.** A primeira geração depois de trocar de IA pode levar
4 minutos só subindo o modelo de 20 GB. Gere tudo da mesma IA de uma vez; alternar entre duas
IAs grandes é o jeito mais fácil de desperdiçar uma tarde.

---

## Memória: a armadilha que ninguém vê

**A ComfyUI não devolve o modelo quando o trabalho termina.** Ela deixa tudo carregado na RAM
e na placa esperando o próximo pedido. Então:

> **Fila vazia não quer dizer memória livre.**

Medido aqui num dia qualquer: duas ComfyUI **paradas**, sem nada na fila, segurando **36 GB de
RAM** e 12 dos 16 GB da placa. Fechar as duas devolveu tudo.

Se o computador está pesado e nada está gerando, **feche a ComfyUI e abra de novo**.

---

## Imagem: por que fica com cara de IA

### Editar não é gerar
Editor existe para **obedecer a uma instrução**, não para fazer foto bonita. Se o que importa
é a foto, **gere do zero**. Se o que importa é preservar uma pessoa, aí sim edite. Trocar isso
de lugar é a causa número um de "ficou parecendo avatar".

### Nunca gere menor que o quadro final
Se o vídeo é 1080×1920 e a imagem saiu 768×1376, a montagem estica 1,4× e a nitidez vai
embora. Gerar no tamanho certo custa o mesmo.

### Fale como fotógrafo
Diga a **lente**, a **luz** e o **tipo de filme** — e pare de empilhar adjetivo:

> *Candid photograph, shot on 35mm film, 50mm lens at f/2, Kodak Portra 400, natural window
> light, visible grain, natural skin texture with pores and fine wrinkles, no retouching.*

### Efeito de ambiente que você não controla, não peça
"Serragem no ar" virou um chuvisco branco feio. Se não quiser, ponha no negativo:
`dust specks, floating particles, bokeh dots`.

### Cuidado com a palavra "quente"
"Luz de lâmpada quente" tinge a cena inteira de laranja. Imagem puxando para o vermelho? A
palavra está no seu texto.

### Modelo rápido é rápido porque abriu mão de alguma coisa
Versões "Lightning", "Turbo" e "distilled" rodam em 4 passos em vez de 40 — e **o preço é o
realismo**. Não é defeito de configuração: é o que você instalou. Aumentar os passos num
modelo destilado normalmente **não melhora**, às vezes piora. Se precisa de foto de verdade,
o caminho é outro modelo, não outro ajuste.

---

## Consistência: a mesma pessoa em todas as cenas

**Ficha de personagem em três painéis — close, frente e costas — em fundo CINZA.**

Fundo branco é o conselho que circula por aí, e **está errado para cabelo e barba brancos**:
o branco come o contorno. Cinza médio separa sem queimar.

**Trocar o fundo não é trocar de lugar.** Se você travar tudo para a pessoa não mudar, ela sai
colada no cenário novo como adesivo — mesma pose, mesma roupa, mesmo enquadramento. O que se
trava entre cenas é a **identidade**, não a pose.

**Mande o lugar como imagem, não como texto.** Uma folha com o cenário vazio, outra com a
ficha da pessoa, e o texto cuidando só de lente/luz/filme. Separado, cada folha carrega uma
coisa e elas param de brigar.

> ⚠️ Honestidade: este método melhorou muito o resultado aqui, mas **ainda não está resolvido**.
> O dono olhou e disse que não ficou bom o bastante. Está escrito porque o caminho é esse;
> não porque chegou ao fim.

---

## Voz

**Confira ouvindo, não olhando.** O motor às vezes continua "falando" depois que o texto
acabou — medido: 7,7 s certos e 32 s de falatório. O painel corta isso sozinho conferindo com
transcrição, mas num texto longo ouça antes de montar o vídeo em cima.

**Número por extenso.** "Jó 38" lido como "Jó trinta e oito" está **certo**, mas qualquer
conferência automática que compare palavra por palavra vai acusar erro. Compare letras, com os
números escritos por extenso dos dois lados.

**Medida sem instrumento não é medida.** Mediram-se aqui 98% de acerto no português — mas a
primeira medição dizia que o áudio estava embaralhado, e o áudio estava perfeito: o medidor é
que estava quebrado. **Resultado que você não consegue reproduzir não é resultado.**

---

## Fila e automação

**Uma geração por vez.** A placa não divide.

**O estúdio pisca, e o seu script não pode morrer por isso.** Quando um modelo grande está
carregando, o painel demora a responder. Conte as falhas seguidas e só desista depois de
várias — desistir no primeiro erro mata um trabalho de uma hora.

**Procure o arquivo órfão antes de refazer.** Se o painel cair com um trabalho rodando, o
arquivo quase sempre já está pronto na pasta de saída da ComfyUI, só não foi registrado. Isso
já salvou uma hora de placa aqui.

---

## Licença: a armadilha cara

**O motor de voz que vem ligado por padrão no VoiceStudio é CC-BY-NC — não pode ser usado em
vídeo monetizado.** Troque para o **VoxCPM 2** (Apache-2.0) antes de publicar qualquer coisa.

E tem a confusão que circula em vídeo de YouTube: esse motor **não é** um serviço pago
"craqueado". É um projeto aberto, com licença própria, que você precisa respeitar.

Sobre o programa em si: o VoiceStudio é **AGPL-3.0**. Este projeto **conversa com ele pela
rede** e nunca copia o código dele para dentro. Se você for mexer, mantenha a regra:
**chamar, nunca copiar.**

---

## A lição que vale mais que todas

**Meça, não ache.**

Quase toda decisão deste projeto mudou quando alguém foi contar. A escolha das IAs que ficaram
no painel saiu de contar 2.253 trabalhos, não de opinião — e o resultado foi que **uma IA de
69 GB tinha sido usada 4 vezes na vida**. A ficha do painel dizia que um modelo era "para
ilustração", e era justamente ele que fazia as fotos realistas aprovadas.

Ficha de modelo descreve a intenção. Só o teste descreve o resultado.
