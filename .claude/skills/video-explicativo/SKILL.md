---
name: video-explicativo
description: Monta vídeo explicativo estilo Vox (narração + imagens por cima, sem rosto) do zero, só com o que roda local. Use quando o o dono do canal pedir "vídeo explicativo", "estilo Vox", "vídeo para explicar/anunciar algo no canal", ou quiser avisar o público sobre uma mudança. Faz o roteiro, descreve cena a cena, gera a narração no ElevenLabs com a voz dele e as cenas no Krea 2 + LTX 2.5.
---

# Vídeo explicativo estilo Vox — tudo local

Equivalente ao fluxo que ele viu num vídeo do Max Carrau, mas **sem Higgsfield** (US$ 4,62 por clipe, ver
[[higgsfield-api-seedance-2026-10-05]]). Aqui: Krea 2 + LTX 2.5 + ElevenLabs. Custo de nuvem perto de zero
(só os créditos do texto no ElevenLabs, ~1 crédito por letra).

## 1. O roteiro (o que mais importa)
- **Duração alvo:** 60 a 75 s. Mais que isso cai muito a retenção num anúncio de mudança.
- **Regra das 14 letras:** 14 letras ≈ 1 segundo de narração. 60 s ≈ 850 letras.
- **Estrutura:**
  1. **Gancho (0–3 s):** a frase mais forte, já dizendo a mudança. Nada de "fala galera".
  2. **O problema (3–20 s):** como era antes e o que incomodava. Concreto, com número se tiver.
  3. **A virada (20–40 s):** o que mudou e POR QUÊ. Aqui mora a verdade do vídeo.
  4. **O que vem (40–60 s):** o que o público vai ver a partir de agora.
  5. **Chamada (últimos 5 s):** uma só, clara.
- **Tom:** primeira pessoa, frases curtas, como quem conversa. Sem palavra difícil. Sem "nesse vídeo eu vou falar sobre".
- Cada frase do roteiro vira **uma cena**. Frase curta = corte rápido = retenção.

## 2. A tabela de cenas
| Cena | Tempo | Narração (português) | Imagem (inglês, para o Krea 2) | Movimento (para o LTX) |
|---|---|---|---|---|
| 01 | 0–4 s | A frase da narração | descrição da imagem em inglês | push-in lento |

- **Imagem em inglês**, sempre: é o que a IA lê.
- Prefira **imagem concreta** a imagem abstrata: um microfone sendo desligado diz mais que "mudança".
- Repita o estilo em todas as cenas (mesma paleta, mesma luz), senão o vídeo parece remendo.

## 3. Produzir (tudo na máquina)
| Passo | Ferramenta | Tempo |
|---|---|---|
| Narração | ElevenLabs, voz **"Jer Eu mesmo"** (a voz dele) pela aba Pessoa falando ou pelo script | segundos |
| Imagem de cada cena | **Krea 2** (`projetos\fz_clipe\gerar.py --preset krea2`) | ~20 s cada |
| Animar a cena | **LTX 2.5 i2v** (5 s, 16:9 ou 9:16) | ~6 min cada |
| Legenda palavra por palavra | `projetos\fz_clipe\legenda.py` | ~1 min |
| Montagem | ffmpeg: corta cada cena no tempo da narração, junta, põe legenda e logo | ~2 min |

**Atalho quando o prazo aperta:** não animar tudo. Imagem parada com movimento de câmera no ffmpeg
(zoom lento de 1.0 a 1.08) fica quase igual e derruba o tempo de 1 h para ~10 min.

## 4. Antes de publicar
1. Ler o roteiro em voz alta: tropeçou, a frase é longa demais.
2. Os 3 primeiros segundos seguram sozinhos? Se não, troca o gancho.
3. Alguma cena ficou "ilustrativa demais" (nuvem, cérebro, lâmpada)? Troca por algo concreto do mundo dele.
4. O vídeo responde "o que muda para quem assiste?" Se não responde, falta.

**Onde salvar:** `<sua pasta de videos>\explicativos\<nome do vídeo>\` (escolha a sua pasta).
