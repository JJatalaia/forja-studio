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
        '<span class="fila-estado">' + (i.estado === 'rodando' ? '● gerando'
          : '○ na fila' + (i.numero ? ' · ' + i.numero + 'º' : '')) + '</span>' +
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

  // ------------------------------------------------------------ o historico
  // "Deixa um historico do que foi gerado sempre e uma opcao de limpar o historico."
  // O historico da ComfyUI rotaciona (ela guarda os ultimos e joga o resto fora); este
  // acumula no nosso arquivo, e inclui o que veio de FORA, que o painel nunca registrou.
  function quandoData(seg) {
    if (!seg) return '';
    const d = new Date(seg * 1000), hoje = new Date();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === hoje.toDateString()) return 'hoje ' + hm;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + hm;
  }

  function cartaoHist(i) {
    const el = document.createElement('div');
    el.className = 'fila-hist-item' + (i.deu_certo ? '' : ' falhou');
    const img = (i.arquivos || []).find((a) => /\.(png|jpe?g|webp|gif)$/i.test(a.nome || ''));
    el.innerHTML =
      (img ? '<img class="fila-hist-mini" loading="lazy" alt="">' : '<div class="fila-hist-mini vazia"></div>') +
      '<div class="fila-hist-txt">' +
        '<p class="fila-hist-titulo"></p>' +
        '<p class="fila-hist-sub"></p>' +
      '</div>' +
      '<span class="fila-de' + (i.de === 'fora' ? ' fora' : '') + '"></span>';
    if (img) el.querySelector('img').src = img.url;
    el.querySelector('.fila-hist-titulo').textContent =
      (i.deu_certo ? '' : '⚠️ ') + (i.titulo || 'trabalho');
    el.querySelector('.fila-hist-sub').textContent =
      [quandoData(i.quando), (i.arquivos || []).length ? (i.arquivos.length + ' arquivo' +
        (i.arquivos.length === 1 ? '' : 's')) : '', i.prompt].filter(Boolean).join(' · ');
    el.querySelector('.fila-de').textContent =
      i.de === 'estudio' ? 'deste painel' : i.de === 'musica' ? 'música' : 'DE FORA';
    return el;
  }

  async function puxarHist() {
    let d;
    try {
      const r = await fetch('/api/fila/historico');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      d = await r.json();
    } catch (e) {
      $('#filaHistN').textContent = '';
      return;
    }
    const lista = $('#filaHistLista'), itens = d.itens || [];
    lista.innerHTML = '';
    $('#filaHistN').textContent = d.total ? '(' + d.total + ')' : '';
    if (!itens.length) {
      const v = document.createElement('p');
      v.className = 'fila-vazio';
      v.textContent = d.limpo_em
        ? 'Histórico limpo. O que for gerado daqui para a frente entra aqui.'
        : 'Nada gerado ainda.';
      lista.append(v);
      return;
    }
    itens.forEach((i) => lista.append(cartaoHist(i)));
  }

  function pedirLimpar() {
    const n = ($('#filaHistN').textContent || '').replace(/[()]/g, '') || '0';
    $('#filaLimparN').textContent = n + (n === '1' ? ' trabalho' : ' trabalhos');
    $('#filaLimparConfirma').hidden = false;
    $('#filaLimparStatus').textContent = '';
  }

  async function limparMesmo() {
    const st = $('#filaLimparStatus'), bt = $('#filaLimparSim');
    bt.disabled = true;
    st.className = 'nota';
    st.textContent = 'Limpando…';
    try {
      const r = await fetch('/api/fila/historico/limpar', { method: 'POST' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      $('#filaLimparConfirma').hidden = true;
      st.className = 'nota laudo-ok';
      st.textContent = '✅ ' + d.apagados + ' da lista. Os arquivos continuam no disco.';
      await puxarHist();
    } catch (e) {
      st.className = 'nota laudo-ruim';
      st.textContent = String(e.message || e).slice(0, 200);
    } finally {
      bt.disabled = false;
    }
  }

  function ligarBotoes() {
    if (ligarBotoes.feito) return;
    ligarBotoes.feito = true;
    $('#filaLimpar').addEventListener('click', pedirLimpar);
    $('#filaLimparNao').addEventListener('click', () => {
      $('#filaLimparConfirma').hidden = true;
      $('#filaLimparStatus').textContent = '';
    });
    $('#filaLimparSim').addEventListener('click', limparMesmo);
  }

  function abrir() {
    ligarBotoes();
    puxar();
    puxarHist();
    if (!tic) tic = setInterval(() => { puxar(); puxarHist(); }, 3000);
  }
  function fechar() {
    if (tic) { clearInterval(tic); tic = null; }
  }

  // o contador da barra lateral continua vivo com a tela fechada, mas devagar: e so um numero
  setInterval(() => { if (!tic) puxar(); }, 15000);

  window.FILA = { abrir, fechar, puxar, puxarHist };
})();
