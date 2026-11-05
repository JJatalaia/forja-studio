---
name: novela-vertical
description: Escrever ou revisar roteiro de novela vertical 9:16 (partes de ~1 min, tabela Cena | O que se vê em inglês | Fala em português). Use sempre que o o dono do canal pedir roteiro, capítulo, parte ou cena de qualquer novela/série vertical, e também para revisar o que o Gemini devolver antes de gerar os vídeos.
---

# Novela vertical 9:16 — manual de roteiro

Base: `Manual_Roteiro_Novela_Vertical` (escrito com o Gemini em 07/10/2026) + o que aprendemos gravando o capítulo 1 de
uma novela vertical de verdade. A parte do manual é a teoria; a seção "Armadilhas da gravação" é o que já quebrou na prática.

## 1. Formato
- Cada **parte** tem ~1 minuto e é postada sozinha (Reels, TikTok, Kwai, Shorts).
- **10 a 13 cenas por parte.** Cena normal ~5 s; fala longa no máximo 10 s.
- Saída **obrigatória** em tabela de 3 colunas:

| Cena | O que se vê | Fala |
|---|---|---|
| 01 | Helena freezes, her hand trembling, she looks up slowly. | **Helena:** Bianca? Você é minha irmã! |

- Coluna do meio **em inglês** (é o que a IA de vídeo lê). Coluna da fala **em português do Brasil**.
- `*Itálico*` = pensamento ou voz em off.
- Capítulo = 5 partes. Novela = 10 capítulos.

## 2. Regras inquebráveis
- **Zero gravidez:** nada de barriga, teste, bebê ou parto. A barriga sai errada e inconsistente na IA de imagem.
- **Quem fala, de frente:** sempre olhando para a câmera ou para o interlocutor. Nunca de costas — se ficar de costas, a IA mexe a boca de outro personagem.
- **Primeiro plano limpo:** ninguém na frente que pareça ser o destinatário; nenhuma mão ou corpo de terceiro entrando no quadro.
- **Sem expressão fixa** na coluna em inglês ("warm smile", "sad face"): a expressão nasce da ação do momento. Adjetivo fixo gruda em todas as cenas seguintes.
- **Toda parte termina em gancho**, no auge do suspense. A última frase é a alma da retenção.

## 3. Construção da história
- **Justificar salto de poder:** virada forte (virar sócia da noite para o dia, perdoar um inimigo) precisa de 1 linha de fala que ancore o porquê — exigência de testamento, blindagem legal, armadilha para o inimigo.
- **Objeto perdido não some:** envelope, chave, pen-drive. Se cai, alguém pega — mostre a mão sem o rosto, deixe a dúvida no ar e pague depois. Item esquecido é furo.
- **Arco visual (mostrar, não contar):** a evolução do personagem aparece na coluna em inglês.
  - Fase frágil: `trembling hands`, `looking away`, `shoulders down`.
  - Fase forte: `chin up`, `firm gaze`, `straight posture`, `unblinking`, `cold expression`.

## 4. Armadilhas da gravação (medidas aqui, não são teoria)
- **Fala longa sai enrolada.** Quebre em duas cenas. No capítulo 1 saiu "garçonessa", "à vinda", "perço".
- **Uma fala por cena.** Duas pessoas falando na mesma cena confunde a IA sobre quem fala.
- **Objeto na mão** tem que ser descrito igual em todas as cenas seguidas, senão muda sozinho.
- **Estado pós-evento vale mais que a ficha:** se o vinho sujou o vestido, toda cena seguinte descreve a mancha, sempre com as mesmas palavras.
- **Cena sequencial parte do ÚLTIMO QUADRO** da anterior, não da ficha do personagem.
- Nome próprio difícil no meio da frase costuma sair errado: prefira no começo ou no fim da fala.

## 5. Onde fica o material
- História e capítulos: `<a pasta onde voce instalou o estudio>\projetos\novela_noiva\HISTORIA.md`
- Roteiros: `ROTEIRO_CAP01.md`, `ROTEIRO_CAP02.md` na mesma pasta.
- Pacote para o Gemini escrever os capítulos 3 ao 10: `_para_gemini\` (47 .txt: instruções, capítulo 1 como ficou, e um arquivo por parte).
- Geração dos clipes: ver a skill `noiva-clipes-h3`.

## 6. Ao revisar o que o Gemini devolver
Conferir, nesta ordem, antes de mandar gerar:
1. Tem entre 10 e 13 cenas? A parte termina no gancho exato que foi pedido?
2. Alguma fala passa de ~10 s ao ler em voz alta? Quebre.
3. Alguma cena tem duas pessoas falando? Separe.
4. Sobrou menção a gravidez, bebê ou teste? Tire.
5. Alguém de costas, ou mão de terceiro no quadro? Reescreva a descrição.
6. A coluna em inglês tem expressão fixa? Troque por ação.
7. Objeto que apareceu antes continua descrito igual?
