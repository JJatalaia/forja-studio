# O que a sua máquina precisa ter

Leia isto **antes de baixar**. São 235,7 GB de modelos: é melhor descobrir agora que o seu
disco não aguenta do que no meio do download.

Uma coisa que você precisa saber para ler o resto com desconfiança saudável: **tudo aqui foi
medido numa máquina só.** Onde está escrito *medido*, foi cronometrado. Onde está escrito
*estimativa*, é conta feita a partir do tamanho dos modelos — pode estar errado na sua
máquina. Ninguém testou isto numa placa de 8 GB, numa AMD ou num Mac.

A máquina de referência, onde tudo foi medido:

| peça | o que é |
|---|---|
| placa de vídeo | NVIDIA RTX 5060 Ti, **16 GB** de VRAM |
| memória | 64 GB |
| disco | HD comum (não SSD) |
| sistema | Windows 11 Pro |

---

## 1. Quanto de disco, de acordo com o que você quer fazer

Você **não precisa baixar tudo**. O instalador deixa você escolher. Estes números já
descontam os modelos que mais de uma IA usa em comum — não é soma simples.

| se você quer… | arquivos | espaço |
|---|---|---|
| **só imagem** | 11 | **66,5 GB** |
| **só vídeo** (inclui pessoa falando e plano-sequência) | 19 | **128,6 GB** |
| **imagem + vídeo** | 30 | **195,1 GB** |
| **+ narração com voz local** | +5 | **+22,0 GB** |
| **+ IA de texto** (escreve prompt, traduz, descreve imagem) | +3 | **+18,7 GB** |
| **tudo** | **38** | **235,7 GB** |

Fora os modelos, reserve mais:

| para quê | espaço |
|---|---|
| a ComfyUI portátil e o Python | ~6 GB |
| o que você criar (imagens e vídeos) | quanto você quiser — vídeo come rápido |
| folga para o Windows respirar | 20 GB |

**Conta final honesta:** para o pacote completo, tenha **270 GB livres**, não 235.

---

## 2. Quanto cada IA ocupa, uma por uma

A coluna **maior arquivo** é a que manda na sua placa de vídeo: é o pedaço que precisa caber
na VRAM de uma vez. O total é o que ocupa no disco.

### Imagem

| IA | disco | maior arquivo | para quê |
|---|---|---|---|
| Qwen-Image 2512 | 29,6 GB | 19,0 GB | a mais caprichada; texto escrito certo na imagem |
| Z-Image Turbo | 19,3 GB | 11,5 GB | a mais rápida |
| Krea 2 Turbo | 17,8 GB | 12,2 GB | fotos realistas, rápida |
| Krea 2 — Transformar imagem | 17,9 GB | 12,2 GB | muda uma imagem que você já tem |

### Vídeo

| IA | disco | maior arquivo | para quê |
|---|---|---|---|
| MiniMax H3 — Referências | 41,4 GB | 19,5 GB | vídeo a partir de imagens de referência, com som |
| MiniMax H3 Fast | 40,6 GB | 20,6 GB | vídeo rápido, com som |
| LTX 2.5 — Texto para vídeo | 28,3 GB | 14,3 GB | escreve e vira vídeo, com som |
| LTX 2.5 — Imagem para vídeo | 28,3 GB | 14,3 GB | anima uma foto sua, com som |
| Apresentador | 27,6 GB | 15,5 GB | uma foto de frente falando o seu texto |
| Wan 2.2 5B | 16,9 GB | 9,3 GB | a mais leve do vídeo |

> As duas LTX 2.5 dividem quase tudo: juntas são 28,3 GB, não 56.
> As duas MiniMax H3 também: juntas dão bem menos que a soma.

---

## 3. Placa de vídeo

**Medido:** tudo acima roda numa **RTX 5060 Ti de 16 GB**.

**Estimativa** (conta a partir do maior arquivo de cada IA, somando a folga que o Windows
e o próprio programa ocupam):

| sua placa | o que esperar |
|---|---|
| **16 GB ou mais** | tudo funciona. É o único caso que foi realmente testado. |
| **12 GB** | imagem deve ir bem; vídeo provavelmente escorre para a memória do PC e fica lento. |
| **8 GB** | a ComfyUI consegue repartir o modelo com a memória do PC, mas **espere muita lentidão**. Nunca foi testado. |
| **menos de 8 GB** | não recomendo nem tentar com vídeo. |
| **AMD ou Intel Arc** | nunca foi testado. A ComfyUI suporta, este projeto não foi verificado. |
| **Mac (Apple Silicon)** | não foi testado, e os atalhos `.bat` são do Windows. |

Quando o modelo não cabe na placa, a ComfyUI **não desiste**: ela usa a memória do PC como
sobra. Não quebra — fica lento. Quanto, só medindo na sua máquina.

---

## 4. Memória do PC (RAM)

**Medido:** 64 GB, e nunca faltou.

**Estimativa:** **32 GB** é o que eu chamaria de mínimo confortável, porque é para a RAM que
o modelo escorre quando não cabe na placa. Com 16 GB, abrir o navegador junto já aperta.

---

## 5. Disco: SSD ou HD?

Funciona nos dois. A diferença aparece na **primeira vez** que você usa cada IA, quando ela
carrega os modelos do disco:

- **medido num HD comum:** a primeira geração do LTX 2.5 leva **4 a 5 minutos** (carregando
  27 GB); depois de carregado, 5 segundos de vídeo em 720p saem em **2,2 minutos**.
- num SSD, essa primeira espera cai muito. As gerações seguintes são iguais nos dois.

Ou seja: SSD melhora a espera do começo, não a velocidade de gerar.

---

## 6. Internet

São **235,7 GB** para baixar, dos sites originais (Hugging Face e afins). Numa conexão de
300 Mb/s isso dá umas **2 horas**; numa de 50 Mb/s, umas **11 horas**. O instalador continua
de onde parou se cair.

---

## 7. Música: não vem neste pacote

O estúdio de música (letra com IA, instrumental, cover) **não faz parte deste download**. Ele
é um painel separado que depende de contas e de configuração que não viajam aqui.

Para você ter ideia do tamanho, se um dia ele for incluído: a parte de música ocupa cerca de
**17 GB** na máquina de referência.

Quando você instalar só o que está neste pacote, a aba **Música** simplesmente não aparece no
painel — não é defeito.

---

## 8. Vozes na nuvem (ElevenLabs): opcional, e com a sua conta

O estúdio sabe conversar com o ElevenLabs para narração, **mas nenhuma chave vem com ele**.

- Se você **não** puser chave nenhuma: a aba Narração funciona normal com a **voz local, de
  graça**, gerada na sua máquina. É assim que vem.
- Se você **quiser** usar o ElevenLabs, põe a **sua própria chave** no painel (Narração →
  *Vozes na nuvem*). Aí as vozes com ☁ aparecem, e **gastam crédito da sua conta**, não da
  de ninguém.

A chave fica num arquivo texto na **sua** máquina, dentro da pasta `API`, que já está no
`.gitignore` — ela nunca vai parar num repositório por acidente.

---

## 9. Resumo em cinco linhas

- **270 GB** livres para o pacote completo (ou 100 GB se você só quiser imagem).
- Placa NVIDIA de **16 GB** é o que foi testado; 8 GB deve funcionar devagar.
- **32 GB** de RAM como mínimo confortável; 64 é o que foi medido.
- SSD só adianta a primeira carga de cada IA.
- Nada aqui gera na nuvem nem cobra mensalidade: quem trabalha é a sua placa.
