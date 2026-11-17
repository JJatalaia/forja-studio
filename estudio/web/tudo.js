/* Estúdio Local — Minhas criações (02/11/2026).

   Antes, para saber "o que eu fiz hoje", era preciso visitar quatro abas: cada uma guardava
   a sua galeria. Esta tela junta tudo numa lista só, da mais nova para a mais velha, com um
   filtro por tipo e a mesma busca por prompt das outras.

   Os cartões aqui são de propósito mais simples que os da aba de origem: só Ver e Baixar,
   que funcionam como link puro. Reusar e Remover continuam na aba onde a criação nasceu,
   porque é lá que vive o motor que faz essas duas coisas. Dois botões que funcionam valem
   mais que quatro em que dois não fazem nada. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const POR_VEZ = 40;
  const E = { ligado: false, jobs: [], tipo: '', busca: '', mostrar: POR_VEZ, carregando: false, timer: null };

  const ehVid = (n) => /\.(mp4|webm|mov|mkv)$/i.test(String(n || ''));
  const ehSom = (n) => /\.(mp3|wav|flac|ogg|m4a)$/i.test(String(n || ''));

  // de qual aba veio a criação: é o mesmo critério das outras telas, escrito aqui de novo
  // para esta tela não quebrar se o app.js mudar por dentro.
  function tipoDe(j) {
    if (j.aba === 'imagem') return 'imagem';
    if (j.preset === 'apresentador') return 'apresentador';
    if (j.preset === 'h3_contexto') return 'plano';
    return 'video';
  }
  const NOME_TIPO = { imagem: 'Imagem', video: 'Vídeo', apresentador: 'Pessoa falando', plano: 'Plano-sequência' };
  const CLASSE_TIPO = { imagem: 't-imagem', video: 't-video', apresentador: 't-voz', plano: 't-video' };

  async function pedir(caminho) {
    const r = await fetch(caminho);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  function cartao(j) {
    const art = document.createElement('article');
    const tipo = tipoDe(j);
    art.className = 'card ' + (CLASSE_TIPO[tipo] || 't-imagem');
    art.dataset.id = j.id;
    const saidas = j.saidas || [];
    const url = '/api/midia/' + encodeURIComponent(j.id) + '/0';
    const pronto = j.estado === 'concluido' && saidas.length > 0;
    const arq = pronto ? saidas[0].arquivo : '';
    const midia = pronto
      ? (ehVid(arq) ? '<video src="' + url + '" preload="metadata" controls playsinline></video>'
        : ehSom(arq) ? '<audio src="' + url + '" preload="none" controls></audio>'
          : '<img src="' + url + '" alt="" loading="lazy">')
      : '<div class="sem-midia">' + esc({ erro: 'deu erro', cancelado: 'cancelada',
        fila: 'na fila', rodando: 'gerando…' }[j.estado] || 'sem arquivo') + '</div>';
    const quando = j.criado ? new Date(j.criado * 1000).toLocaleString('pt-BR',
      { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    art.innerHTML =
      '<div class="midia">' + midia + '</div>' +
      '<div class="info">' +
        '<p class="selo-tipo">' + esc(NOME_TIPO[tipo] || tipo) + '</p>' +
        '<p class="prompt">' + esc((j.prompt || '(sem prompt)').slice(0, 150)) + '</p>' +
        '<p class="meta fraco">' + esc(quando) + '</p>' +
        (pronto
          ? '<div class="bts"><a class="bt-sec" href="' + url + '" target="_blank" rel="noopener">Ver</a>' +
            '<a class="bt-sec" href="' + url + '" download="' + esc(arq) + '">Baixar</a></div>'
          : '') +
      '</div>';
    return art;
  }

  function filtrados() {
    const b = E.busca.trim().toLowerCase();
    return E.jobs.filter((j) => {
      if (E.tipo && tipoDe(j) !== E.tipo) return false;
      if (b && !String(j.prompt || '').toLowerCase().includes(b)) return false;
      return true;
    });
  }

  function pintarFiltro() {
    const caixa = $('#tudoFiltro');
    if (!caixa) return;
    const conta = {};
    E.jobs.forEach((j) => { const t = tipoDe(j); conta[t] = (conta[t] || 0) + 1; });
    const itens = [['', 'Todas', E.jobs.length]]
      .concat(Object.keys(NOME_TIPO).filter((t) => conta[t]).map((t) => [t, NOME_TIPO[t], conta[t]]));
    caixa.innerHTML = itens.map(([v, r, n]) =>
      '<button type="button" data-v="' + v + '"' + (v === '' ? ' class="todas"' : '') +
      ' aria-pressed="' + (E.tipo === v) + '">' + esc(r) + ' <span>' + n + '</span></button>').join('');
  }

  function pintar() {
    const grade = $('#tudoGrade'), vazio = $('#tudoVazio'), conta = $('#tudoConta');
    if (!grade) return;
    const vis = filtrados(), mostrar = vis.slice(0, E.mostrar);
    grade.innerHTML = '';
    mostrar.forEach((j) => grade.appendChild(cartao(j)));
    if (vazio) vazio.hidden = vis.length > 0;
    const filtrando = E.tipo || E.busca.trim();
    if (conta) {
      conta.textContent = E.jobs.length
        ? E.jobs.length + (E.jobs.length === 1 ? ' criação' : ' criações')
          + (filtrando ? ' · ' + vis.length + ' com esses filtros' : '')
        : 'Nenhuma criação ainda.';
    }
    const mais = $('#tudoMaisBox');
    if (mais) mais.hidden = vis.length <= E.mostrar;
  }

  async function abrir() {
    ligar();
    if (E.carregando) return;
    E.carregando = true;
    try {
      const lista = await pedir('/api/trabalhos?limite=3000');
      E.jobs = (Array.isArray(lista) ? lista : []).sort((a, b) => (b.criado || 0) - (a.criado || 0));
    } catch (e) {
      const conta = $('#tudoConta');
      if (conta) conta.textContent = 'Não consegui ler a lista de criações agora.';
      E.carregando = false;
      return;
    }
    E.carregando = false;
    pintarFiltro();
    pintar();
    agendarRecarga();
  }

  /* Enquanto houver coisa gerando, esta tela se atualiza sozinha a cada 10 s. Sem isto o
     cartao ficava "gerando..." para sempre: a lista so era lida ao ABRIR a aba, e quem ja
     estava nela nao via a geracao terminar (visto na pratica em 02/11/2026). */
  function agendarRecarga() {
    clearTimeout(E.timer);
    const vivo = E.jobs.some((j) => j.estado === 'rodando' || j.estado === 'fila');
    if (!vivo) return;
    E.timer = setTimeout(() => {
      const vista = $('#vTudo');
      if (!vista || vista.hidden || document.hidden) { agendarRecarga(); return; }
      abrir();
    }, 10000);
  }

  function ligar() {
    if (E.ligado) return;
    E.ligado = true;
    const caixa = $('#tudoFiltro');
    if (caixa) {
      caixa.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        E.tipo = b.dataset.v || '';
        E.mostrar = POR_VEZ;
        $$('#tudoFiltro button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        pintar();
      });
    }
    const busca = $('#tudoBusca');
    if (busca) {
      busca.addEventListener('input', () => { E.busca = busca.value; E.mostrar = POR_VEZ; pintar(); });
    }
    const mais = $('#tudoMais');
    if (mais) mais.addEventListener('click', () => { E.mostrar += POR_VEZ; pintar(); });
  }

  window.TUDO = { abrir };
})();
