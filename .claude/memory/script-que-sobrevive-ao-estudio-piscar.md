---
name: script-que-sobrevive-ao-estudio-piscar
description: Automacao: contar falhas em vez de morrer na primeira, e procurar o arquivo orfao
metadata:
  type: reference
---

# O script nao pode morrer quando o estudio pisca

**O estudio demora a responder** enquanto carrega um modelo grande. Script que desiste no
primeiro erro morre no meio de um trabalho de uma hora.

Conte as falhas seguidas:

    falhas = 0
    while True:
        try:
            lista = requests.get(ESTUDIO + "/api/trabalhos?aba=imagem&limite=60", timeout=30).json()
            falhas = 0
        except Exception as e:
            falhas += 1
            if falhas > 30:      # 30 tentativas de 8 s = 4 minutos de silencio
                sys.exit("ERRO: o estudio nao responde ha 4 minutos (%s)." % e)
            continue

**E procure o arquivo orfao antes de refazer.** Se o painel cair com um trabalho rodando, o
arquivo quase sempre ja esta pronto na pasta de saida da ComfyUI - so nao foi registrado.
Isso ja salvou uma hora de placa. Ver [[uma-geracao-por-vez]].
