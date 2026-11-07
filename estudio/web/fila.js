/* A FILA: tudo que esta sendo gerado nesta maquina, venha de onde vier. (07/11/2026)
 *
 * Ele pediu: "cria um local para fila de geracao para ver o que esta sendo gerado mesmo que
 * seja o Claude.ia ou o GPT ou qualquer fluxo mande".
 *
 * Da para saber de onde veio porque TODO prompt que este painel manda leva um carimbo
 * dentro (extra_pnginfo.estudio_local). O que chega sem o carimbo veio de fora - e e
 * justamente o que ele quer enxergar.
 *
 * ⚠️ A narracao NAO entra: o VoiceStudio nao tem fila para consultar. A tela diz isso em vez
 * de deixar a pessoa achar que a lista esta completa.
 */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  let tic = null;

  function quando(seg) {
    if (!seg) return '';
    const d = Math.max(0, Math.round(Date.now() / 1000 - seg));
    if (d < 60) return 'há ' + d + ' s';
    return 'há ' + Math.floor(d / 60) + ' min ' + String(d % 60).padStart(2, '0') + ' s';
  }

  function cartao(i) {
    const el = document.createElement('div');
    el.className = 'fila-item' + (i.estado === 'rodando' ? ' rodando' : '');
    const etiqueta = i.de === 'estudio' ? 'deste painel'
      : i.de === 'musica' ? 'painel de música' : 'DE FORA';
    const modelos = (i.modelos || []).filter(Boolean).join(' · ');
    el.innerHTML =
      '<div class="fila-item-cab">' +
        '<span class="fila-estado">' + (i.estado === 'rodando' ? '● gerando' : '○ na fila') + '</span>' +
        '<span class="fila-de' + (i.de === 'fora' ? ' fora' : '') + '">' + etiqueta + '</span>' +
      '</div>' +
      '<p class="fila-titulo"></p>' +
      (modelos ? '<p class="fila-modelos"></p>' : '') +
      (i.prompt ? '<p class="fila-prompt"></p>' : '') +
      '<p class="fila-rodape"><span class="fila-quem"></span>' +
        (i.comecou ? '<span class="fila-tempo">' + quando(i.comecou) + '</span>' : '') + '</p>';
    // tudo por textContent: estes textos vem de fora (de outro programa), nunca como HTML
    $('.fila-titulo', el).textContent = i.titulo || 'trabalho';
    if (modelos) $('.fila-modelos', el).textContent = modelos;
    if (i.prompt) $('.fila-prompt', el).textContent = i.prompt;
    $('.fila-quem', el).textContent = i.quem || '';
    return el;
  }

  async function puxar() {
    let d;
    try {
      const r = await fetch('/api/fila');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      d = await r.json();
    } catch (e) {
      $('#filaQuando').textContent = 'Não consegui ler a fila: ' + String(e.message || e);
      return;
    }
    const lista = $('#filaLista'), itens = d.itens || [];
    lista.innerHTML = '';
    if (!itens.length) {
      const vazio = document.createElement('p');
      vazio.className = 'fila-vazio';
      vazio.textContent = 'Nada sendo gerado agora.';
      lista.append(vazio);
    } else {
      itens.forEach((i) => lista.append(cartao(i)));
    }
    const n = itens.filter((i) => i.estado === 'rodando' || i.estado === 'fila').length;
    const cont = $('#navFilaN');
    if (cont) { cont.textContent = n || ''; cont.hidden = !n; }
    $('#filaQuando').textContent = n
      ? n + (n === 1 ? ' trabalho' : ' trabalhos') + ' · atualiza sozinho'
      : 'atualiza sozinho';
    $('#filaAviso').textContent = d.aviso_narracao || '';
  }

  function abrir() {
    puxar();
    if (!tic) tic = setInterval(puxar, 3000);
  }
  function fechar() {
    if (tic) { clearInterval(tic); tic = null; }
  }

  // o contador da barra lateral continua vivo com a tela fechada, mas devagar: e so um numero
  setInterval(() => { if (!tic) puxar(); }, 15000);

  window.FILA = { abrir, fechar, puxar };
})();
