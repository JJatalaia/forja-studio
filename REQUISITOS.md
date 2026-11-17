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

## A sua máquina dá? As três respostas

| | **MÍNIMA** | **BOA** | **TESTADA** | **MELHOR AINDA** |
|---|---|---|---|---|
| placa de vídeo | NVIDIA **6 GB** | NVIDIA **8 GB** | NVIDIA **16 GB** | NVIDIA **24 GB** |
| exemplos | GTX 1060, RTX 2060 | RTX 3060, 3070, 4060 | RTX 5060 Ti, 4070 Ti S | RTX 4090, 5090 |
| memória do PC | 16 GB | **32 GB** | 64 GB | 64 GB |
| disco livre | 50 GB | 130 GB | 270 GB | 270 GB |
| o que esperar | imagem, devagar | imagem bem; vídeo com paciência | tudo, nos tempos deste arquivo | tudo, sem o modelo escorrer |
| **foi medido?** | **não** | **não** | **sim, tudo** | **não** |

**A última linha é a mais importante deste arquivo.** Só a coluna TESTADA foi
cronometrada numa máquina de verdade. As outras três são **conta** feita a partir do
tamanho dos modelos — podem estar erradas na sua. Se você rodar numa delas, conte como
foi, que eu troco "estimativa" por "medido".

### O que cada palavra quer dizer

**MÍNIMA** é onde ainda funciona, não onde fica bom. Com 6 GB de placa, espere
**imagem** — e com paciência. Vídeo roda, mas tão devagar que provavelmente você
desiste antes de acabar. Não baixe os 235 GB: comece com **uma** IA de imagem e veja se
o tempo te serve.

**BOA** é onde o programa cumpre a promessa. Imagem sai rápido, vídeo sai devagar mas
sai. É onde está a maioria das placas de jogo dos últimos anos.

**TESTADA** é a máquina onde tudo foi cronometrado. Os tempos que aparecem no painel
("14–24 s", "2,2 min", "~26 min") são dela.

**MELHOR AINDA** é quando o modelo cabe inteiro na placa. Aí some a parte mais lenta de
todas: a conversa entre a placa e a memória do PC. Não é "mais rápido na mesma
proporção" — é outra experiência.

### Por que a memória do PC importa tanto

Parece detalhe, não é. Quando o modelo **não cabe na placa**, a ComfyUI não desiste: ela
usa a memória do PC como sobra. **A RAM é a rede de proteção da placa pequena** — e
quanto menor a placa, mais ela salva.

Numa máquina de 8 GB de vídeo, **32 GB de RAM mudam mais a sua vida do que trocar de
processador**. Com 16 GB, abrir o navegador junto já aperta.

### Três coisas que não são opinião

- **Tem que ser NVIDIA.** AMD e Intel Arc nunca foram testados aqui. A ComfyUI suporta;
  este projeto não foi verificado neles.
- **Mac não.** Não foi testado, e os atalhos são do Windows.
- **Abaixo de 6 GB de placa**, não recomendo nem tentar.


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

**Não some esta tabela.** Várias IAs usam o mesmo arquivo — o decodificador de imagem, o
tradutor de texto, o modelo base. Somar a coluna "sozinha" dá **240,1 GB**, e a conta
certa dá **173,7 GB**: 66 GB de diferença, em arquivos que seriam baixados duas vezes.

Por isso são três números, e cada um responde uma pergunta diferente:

| coluna | a pergunta que ela responde |
|---|---|
| **sozinha** | *"Vou instalar só esta. Quanto baixa?"* |
| **a mais** | *"Já tenho as outras. Quanto custa acrescentar esta?"* |
| **divide** | *"Quanto ela aproveita do que já está no disco?"* |
| **maior arquivo** | *"Cabe na minha placa de vídeo?"* — é o pedaço que precisa entrar na VRAM de uma vez |

`sozinha = a mais + divide`, sempre.

### Imagem

| IA | sozinha | a mais | divide | maior arquivo | para quê |
|---|---|---|---|---|---|
| Qwen-Image 2512 | **29,6 GB** | 29,3 GB | 0,2 GB | 19,0 GB | a mais caprichada; escreve texto certo na imagem |
| Z-Image Turbo | **19,3 GB** | 19,3 GB | — | 11,5 GB | a mais rápida |
| Krea 2 — Transformar imagem | **17,9 GB** | 0,1 GB | 17,8 GB | 12,2 GB | muda uma imagem que você já tem |
| Krea 2 Turbo | **17,8 GB** | — | 17,8 GB | 12,2 GB | fotos realistas, rápida |

> **As duas Krea são praticamente o mesmo download.** Tendo uma, a outra custa
> **0,1 GB**. Não faz sentido instalar só uma delas.

### Vídeo

| IA | sozinha | a mais | divide | maior arquivo | para quê |
|---|---|---|---|---|---|
| MiniMax H3 — Referências | **41,4 GB** | 21,4 GB | 20,0 GB | 19,5 GB | vídeo a partir de imagens de referência, com som |
| MiniMax H3 Fast | **40,6 GB** | 20,6 GB | 20,0 GB | 20,6 GB | vídeo rápido, com som |
| LTX 2.5 — Texto para vídeo | **28,3 GB** | — | 28,3 GB | 14,3 GB | escreve e vira vídeo, com som |
| LTX 2.5 — Imagem para vídeo | **28,3 GB** | — | 28,3 GB | 14,3 GB | anima uma foto sua, com som |
| Wan 2.2 5B | **16,9 GB** | 16,9 GB | — | 9,3 GB | **a mais leve do vídeo** |

> **As duas LTX 2.5 são o mesmo download:** juntas são 28,3 GB, não 56,6.
> **As duas MiniMax H3** dividem 20 GB: juntas dão 62 GB, não 82.

### Narração e texto (não são workflow, vêm à parte)

| o quê | espaço | para quê |
|---|---|---|
| Narração com voz local | **22,0 GB** | lê o seu texto em voz alta, sem nuvem e sem mensalidade |
| IA de texto | **18,7 GB** | escreve prompt, traduz, descreve imagem |

### Começando pequeno: as três combinações que fazem sentido

| se você quer… | instale | espaço |
|---|---|---|
| **só experimentar imagem** | Z-Image Turbo | **19,3 GB** |
| **só experimentar vídeo** | Wan 2.2 5B | **16,9 GB** |
| **o mínimo que já é útil** | Z-Image Turbo + Wan 2.2 5B | **36,2 GB** |

Some ~6 GB da ComfyUI e do Python, mais a folga do Windows. **Com 50 GB livres você já
começa** — e descobre na sua máquina, com número na mão, se vale baixar o resto.

---

## 3. Placa de vídeo, IA por IA

O quadro das três configurações, lá no começo, dá a resposta curta. Aqui está o
detalhe, para quem quer saber **qual IA** vai caber na placa que tem.

A conta é esta: compare a sua VRAM com a coluna **maior arquivo** da seção 2, e tire
1 a 1,5 GB que o Windows e o próprio programa já ocupam.

| sua placa | o que cabe inteiro | o que esperar |
|---|---|---|
| **24 GB ou mais** | tudo, com folga | nada escorre para a memória do PC |
| **16 GB** ✅ *medido* | tudo, no limite | os tempos deste arquivo são daqui |
| **12 GB** | Z-Image (11,5), Krea 2 (12,2 no limite), Wan 2.2 5B (9,3) | imagem bem; vídeo escorre e fica lento |
| **8 GB** | **nenhuma inteira** — a mais leve é a Wan 2.2 5B, 9,3 GB | funciona repartindo com a RAM; espere lentidão |
| **6 GB** | nenhuma | imagem com muita paciência; vídeo, melhor nem tentar |
| **menos de 6 GB** | — | não recomendo |
| **AMD ou Intel Arc** | — | nunca testado aqui. A ComfyUI suporta; este projeto não foi verificado |
| **Mac (Apple Silicon)** | — | não testado, e os atalhos são do Windows |

**Não caber não é quebrar.** Quando o modelo não cabe, a ComfyUI usa a memória do PC
como sobra e continua trabalhando — só mais devagar. É por isso que a linha da RAM, no
quadro do começo, importa tanto quanto a da placa.

⚠️ **Um detalhe de geração que pouca gente conta:** vários destes modelos são fp8, e a
aceleração de fp8 só chegou nas placas RTX 40 e acima. Numa RTX 30 ou mais antiga eles
rodam, mas **sem esse ganho** — a lentidão é um pouco maior do que a diferença bruta de
potência faria supor.

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

## 7. Música: duas IAs, na mesma ComfyUI

Desde 14/11/2026 a aba **Música** vem no pacote (pasta `painel_musica`). Ela não instala nada
de novo: usa a **mesma ComfyUI** da imagem e do vídeo e o Python que vem com ela. São duas IAs,
baixadas pela lista de IAs do Início, como as outras:

| IA | o que faz | download |
|---|---|---|
| **YuE2 INT8** | música com letra cantada e cover | 5,0 GB (3,7 GB sem o arquivo do cover) |
| **Stable Audio 3** | trilha instrumental e efeitos | 13,9 GB |

Uma geração por vez na placa: se uma imagem ou um vídeo estiver gerando, a música espera na
fila (e o contrário também).

Sem o motor instalado, ou sem nenhuma das duas IAs baixada, a aba continua lá e **diz o que
falta** — não é defeito.

O que **não** vem: ACE-Step, MiniMax Music, as IAs pagas na nuvem e o botão "tirar a voz"
(precisa de um complemento da ComfyUI que este pacote não instala). O **equalizador** só
aparece se o pacote `pedalboard` estiver no Python da ComfyUI; sem ele, o resto funciona igual.

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

- **50 GB** livres para começar com uma IA; **270 GB** para o pacote completo.
- Placa NVIDIA: **6 GB** é o mínimo, **8 GB** já é bom, **16 GB** é o que foi medido.
- **32 GB** de RAM é o que mais ajuda quem tem placa pequena; 64 é o que foi medido.
- SSD só adianta a primeira carga de cada IA.
- Nada aqui gera na nuvem nem cobra mensalidade: quem trabalha é a sua placa.
