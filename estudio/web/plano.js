/* Estúdio Local — Plano-sequência (uma tomada contínua, sem corte, com pessoa real).

   O motor já existia: o preset `h3_contexto` (MiniMax H3 Singularity + Motion Context), que
   o próprio estúdio sabe rodar. O que faltava era um LUGAR COM NOME, com a configuração à
   vista — até agora era um item perdido numa lista dentro da aba Vídeo.

   Os valores de duração, resolução e tempo NÃO estão escritos aqui: vêm do preset
   (/api/presets). Se o motor mudar, a tela muda junto, em vez de mentir. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const E = { iniciado: false, preset: null, duracao: null, resolucao: null, foto: null,
    job: null, relogio: null };

  const fmtMin = (s) => (s >= 3600 ? (Math.floor(s / 3600) + ' h ' + Math.round((s % 3600) / 60) + ' min')
    : (Math.round(s / 60) + ' min'));

  async function pedir(caminho, corpo) {
    const op = corpo === undefined ? { method: 'GET' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) };
    const r = await fetch(caminho, op);
    if (!r.ok) throw new Error((await r.text()) || ('Erro ' + r.status));
    return r.json();
  }

  function aviso(msg) {
    const el = $('#planoErro');
    el.hidden = !msg;
    el.textContent = msg || '';
  }

  // ------------------------------------------------------------------ abrir
  async function abrir() {
    montarUmaVez();
    if (!E.preset) {
      try {
        const d = await pedir('/api/presets');
        E.preset = (d.video || []).find((p) => p.id === 'h3_contexto') || null;
      } catch (e) { /* trata abaixo */ }
    }
    if (!E.preset) {
      aviso('Não achei a IA do plano-sequência (h3_contexto) na lista do estúdio. '
          + 'Ela vive na ComfyUI de vídeo — confira se ela está ligada.');
      $('#planoCorpo').hidden = true;
      return;
    }
    aviso('');
    $('#planoCorpo').hidden = false;
    render();
    carregarTomadas();
    if (!E.relogio) E.relogio = setInterval(() => { if (!$('#vPlano').hidden) verTrabalho(); }, 10000);
  }

  function render() {
    const p = E.preset;
    $('#planoNomeIA').textContent = p.nome || 'MiniMax H3 Singularity';

    const durs = p.duracoes || {};
    const ests = p.estimativa_por_duracao_s || {};
    if (!E.duracao) E.duracao = (p.padrao || {}).duracao || Object.keys(durs)[0];
    $('#planoDuracoes').innerHTML = Object.keys(durs).map((k) =>
      `<button type="button" data-dur="${esc(k)}" aria-pressed="${k === E.duracao}">
         <b>${esc(k.split(' ')[0])} s</b>
         <small>${esc(k.replace(/^[^(]*\(/, '').replace(')', ''))}</small>
         <small class="custo">${ests[k] ? esc(fmtMin(ests[k])) + ' de placa' : ''}</small>
       </button>`).join('');

    const res = p.resolucoes_mp || {};
    if (!E.resolucao) E.resolucao = (p.padrao || {}).resolucao || Object.keys(res)[0];
    $('#planoResolucoes').innerHTML = Object.keys(res).map((k) =>
      `<button type="button" data-res="${esc(k)}" aria-pressed="${k === E.resolucao}">${esc(k)}</button>`).join('');

    // A CONFIGURAÇÃO, escrita. Os três primeiros vêm do preset (não podem divergir do motor);
    // os de baixo são o que foi MEDIDO no teste que ele aprovou em 03/10.
    const seg = p.segundos_por_segmento || 8;
    const passos = (p.padrao || {}).steps;
    $('#planoConfig').innerHTML = [
      ['IA', p.nome],
      ['Pedaço de cada vez', seg + ' segundos — a cena é quebrada em pedaços desse tamanho e eles se emendam'],
      ['Passos', (passos != null ? passos : '—') + ' (plano "medium")'],
      ['Modelo', 'Minimax-h3 Singularity ref2v Pruned v1.3 int8 + LoRA turbo 4 passos'],
      ['LoRAs de realismo', 'cinema 0,5 · pessoa real 0,7'],
      ['Aprovado em 03/10', '24 s · 0,8 MP · 1216×672 · 43 min de placa · 10,5 GB de VRAM'],
      ['Emendas medidas', '0,0006 e 0,0047 (média 0,0030) — invisíveis'],
    ].map(([k, v]) => `<div class="plano-linha"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

    contar();
  }

  function contar() {
    const p = E.preset, ests = p.estimativa_por_duracao_s || {};
    const s = ests[E.duracao];
    const seg = (p.duracoes || {})[E.duracao] || 0;
    $('#planoConta').innerHTML = s
      ? `<b>${esc(seg)} s</b> de vídeo · <b>${esc(fmtMin(s))}</b> de placa · termina por volta de `
        + `<b>${new Date(Date.now() + s * 1000).toTimeString().slice(0, 5)}</b>`
      : `<b>${esc(seg)} s</b> de vídeo`;
  }

  // ------------------------------------------------------------------ gerar
  async function gerar() {
    const cena = $('#planoCena').value.trim();
    if (!cena) { aviso('Escreva a cena, em português.'); return; }
    const bt = $('#planoGerar');
    bt.disabled = true;
    aviso('');
    try {
      const corpo = { preset: 'h3_contexto', prompt: cena, modo: 'prompt',
        duracao: E.duracao, resolucao: E.resolucao };
      if (E.foto) {                       // foto é OPCIONAL: sem ela o script cria a pessoa
        const fd = new FormData();
        fd.append('arquivo', E.foto);
        const r = await fetch('/api/upload?tipo=imagem', { method: 'POST', body: fd });
        if (!r.ok) throw new Error(await r.text());
        corpo.imagem = (await r.json()).nome;
        corpo.modo = 'referencia';
      }
      const j = await pedir('/api/gerar', corpo);
      E.job = j.id;
      await verTrabalho();
    } catch (e) {
      aviso(String(e.message || e).slice(0, 300));
    } finally {
      bt.disabled = false;
    }
  }

  async function verTrabalho() {
    let lista;
    try {
      lista = await pedir('/api/trabalhos?aba=video&limite=40');
    } catch (e) { return; }
    const j = E.job ? lista.find((x) => x.id === E.job)
                    : lista.find((x) => x.preset === 'h3_contexto'
                        && !['concluido', 'erro', 'cancelado'].includes(x.estado));
    const cx = $('#planoAndamento');
    if (!j) { cx.hidden = true; return; }
    E.job = j.id;
    cx.hidden = false;
    const pr = j.progresso || {};
    const fim = ['concluido', 'erro', 'cancelado'].includes(j.estado);
    $('#planoAndTitulo').textContent = fim
      ? (j.estado === 'concluido' ? 'Pronto!' : 'Terminou como ' + j.estado)
      : 'Gerando a tomada…';
    $('#planoAndDetalhe').textContent = fim
      ? (j.erro || j.mensagem || 'O vídeo está na galeria da aba Vídeo.')
      : [pr.fase, (pr.pct != null ? Math.round(pr.pct) + '%' : null),
         'uma tomada contínua não dá para refazer um pedaço: ela sai inteira ou nada']
        .filter(Boolean).join(' · ');
    $('#planoAndBarra').style.width = (fim ? 100 : Math.max(2, Math.round(pr.pct || 0))) + '%';
    $('#planoAndamento').className = 'plano-andamento' + (fim ? (j.estado === 'concluido' ? ' ok' : ' erro') : '');
    const v = $('#planoVer');
    v.hidden = j.estado !== 'concluido';
    v.href = '/api/midia/' + j.id + '/0';
  }

  // ------------------------------------------------------------------ montar
  function montarUmaVez() {
    if (E.iniciado) return;
    E.iniciado = true;
    if (window.ic) $$('#vPlano [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });

    $('#planoDuracoes').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-dur]');
      if (!b) return;
      E.duracao = b.dataset.dur;
      $$('#planoDuracoes button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      contar();
    });
    $('#planoResolucoes').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-res]');
      if (!b) return;
      E.resolucao = b.dataset.res;
      $$('#planoResolucoes button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });

    const up = $('#planoUp'), inp = $('input', up);
    const pegar = (f) => {
      if (!f) return;
      E.foto = f;
      $('.up-txt', up).textContent = f.name + ' — a pessoa será essa';
    };
    inp.addEventListener('change', () => pegar(inp.files[0]));
    up.addEventListener('dragover', (ev) => { ev.preventDefault(); up.classList.add('sobre'); });
    up.addEventListener('dragleave', () => up.classList.remove('sobre'));
    up.addEventListener('drop', (ev) => { ev.preventDefault(); up.classList.remove('sobre'); pegar(ev.dataTransfer.files[0]); });
    $('#planoTirarFoto').addEventListener('click', () => {
      E.foto = null;
      inp.value = '';
      $('.up-txt', up).textContent = 'Clique ou arraste a foto (opcional — sem ela, o estúdio cria a pessoa)';
    });

    $('#planoGerar').addEventListener('click', gerar);
  }


  /* ---- galeria das tomadas (02/11/2026) --------------------------------------------
     Antes a tomada era gerada AQUI e aparecia na galeria da aba Video: gerava num lugar e
     colhia noutro. Agora cada tomada aparece nesta mesma tela, ao lado do formulario.
     Os cartoes sao simples de proposito: so Ver e Baixar, que funcionam como link puro.
     Reusar e Remover continuam na aba Video, onde tem o motor que faz isso. */
  const ehVid = (n) => /\.(mp4|webm|mov|mkv)$/i.test(String(n || ''));

  function cartaoTomada(j) {
    const art = document.createElement('article');
    art.className = 'card t-video';
    art.dataset.id = j.id;
    const saidas = j.saidas || [];
    const url = '/api/midia/' + encodeURIComponent(j.id) + '/0';
    const pronto = j.estado === 'concluido' && saidas.length > 0;
    const midia = pronto
      ? (ehVid(saidas[0].arquivo)
          ? '<video src="' + url + '" preload="metadata" controls playsinline></video>'
          : '<img src="' + url + '" alt="" loading="lazy">')
      : '<div class="sem-midia">' + esc({ erro: 'deu erro', cancelado: 'cancelada',
          fila: 'na fila', rodando: 'gerando…' }[j.estado] || 'sem arquivo') + '</div>';
    const seg = j.duracao ? esc(String(j.duracao)) : '';
    const quando = j.criado ? new Date(j.criado * 1000).toLocaleString('pt-BR',
      { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    art.innerHTML =
      '<div class="midia">' + midia + '</div>' +
      '<div class="info">' +
        '<p class="prompt">' + esc((j.prompt || '(sem cena escrita)').slice(0, 160)) + '</p>' +
        '<p class="meta fraco">' + [seg, quando].filter(Boolean).join(' · ') + '</p>' +
        (pronto
          ? '<div class="bts"><a class="bt-sec" href="' + url + '" target="_blank" rel="noopener">Ver</a>' +
            '<a class="bt-sec" href="' + url + '" download="' + esc(saidas[0].arquivo) + '">Baixar</a></div>'
          : '') +
      '</div>';
    return art;
  }

  async function carregarTomadas() {
    const grade = $('#planoGrade'), vazio = $('#planoVazio'), conta = $('#planoCriConta');
    if (!grade) return;
    let lista = [];
    try {
      lista = await pedir('/api/trabalhos?aba=video&limite=3000');
    } catch (e) { return; }
    const meus = (Array.isArray(lista) ? lista : [])
      .filter((j) => j.preset === 'h3_contexto')
      .sort((a, b) => (b.criado || 0) - (a.criado || 0));
    grade.innerHTML = '';
    meus.forEach((j) => grade.appendChild(cartaoTomada(j)));
    if (vazio) vazio.hidden = meus.length > 0;
    if (conta) conta.textContent = meus.length
      ? meus.length + (meus.length === 1 ? ' tomada' : ' tomadas') : '';
  }

  window.PLANO = { abrir };
})();
