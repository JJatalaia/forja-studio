---
name: uma-geracao-por-vez
description: A fila e serial de proposito: a placa nao divide
metadata:
  type: project
---

# Uma geracao por vez

A fila do painel e serial **de proposito**. A placa nao divide: duas geracoes ao mesmo tempo
deixam as duas lentas e podem estourar a memoria no meio.

Se voce mandar outra, ela espera. Isso e o comportamento certo, nao um defeito.

**Ao automatizar:** o seu script tem que esperar a anterior aparecer como pronta em
`/api/trabalhos` antes de mandar a proxima. Ver [[script-que-sobrevive-ao-estudio-piscar]].
