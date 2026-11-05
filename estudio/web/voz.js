/* Estúdio Local — Narração (voz local, de graça, pelo VoiceStudio).

   Arquivo SEPARADO do app.js de propósito: se isto aqui quebrar, o resto do estúdio continua
   inteiro. O app.js só sabe duas coisas a respeito: a rota '#/voz' existe e, ao entrar nela,
   chama VOZ.abrir(). Nada mais.

   Conversa só com o nosso servidor (/api/voz/*), que por sua vez fala com o VoiceStudio.
   Nenhuma chamada à internet, nenhuma chave, nenhum texto saindo da máquina. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Pontos de partida e emoções: são os mesmos nomes que o VoiceStudio usa na janela dele.
  const ESTILOS = ['narrador', 'conversa', 'âncora', 'sussurro', 'animado', 'sério', 'triste', 'surpreso'];
  const EMOCOES = ['neutro', 'caloroso', 'animado', 'sério', 'triste', 'suave', 'firme'];
  // Letras por segundo MEDIDO na voz do senhor (13,2). É estimativa: o áudio é que confirma,
  // e por isso a tela mostra os dois números lado a lado depois de gerar.
  const LETRAS_SEG = 13.2;
  const SELOS = {
    ok: ['ok', 'pode publicar'], limite: ['alerta', 'tem limite'],
    duvida: ['alerta', 'licença não conferida'], proibido: ['alerta', 'só rascunho'],
  };

  const E = { iniciado: false, estado: null, vozes: [], pagina: 'falar', estilo: null,
    emocao: null, arquivoRef: null, ocupado: false };

  // ------------------------------------------------------------------ rede
  async function pedir(caminho, corpo, formulario) {
    const op = corpo === undefined ? { method: 'GET' }
      : formulario ? { method: 'POST', body: corpo }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) };
    const r = await fetch(caminho, op);
    if (!r.ok) throw new Error((await r.text()) || ('Erro ' + r.status));
    return r.json();
  }

  function avisar(msg, tipo) {   // reusa o aviso do estúdio quando existe
    if (window.aviso) { window.aviso(msg, tipo || 'aviso'); return; }
    console.log(msg);
  }

  // ------------------------------------------------------------------ abrir a tela
  async function abrir() {
    montarUmaVez();
    await checar();
  }

  async function checar() {
    let est;
    try {
      est = await pedir('/api/voz/estado');
    } catch (e) {
      est = { no_ar: false, detalhe: String(e.message || e) };
    }
    E.estado = est;
    E.vozes = est.vozes || [];
    const ligado = !!est.no_ar;
    $('#vozOff').hidden = ligado;
    $('#vozTela').hidden = false;
    $('#vVoz').classList.toggle('voz-desligada', !ligado);
    if (!ligado) {
      $('#vozOffDetalhe').textContent = est.detalhe
        ? 'Detalhe técnico: ' + String(est.detalhe).slice(0, 180)
        : 'Procurei em ' + (est.url || 'http://127.0.0.1:3900') + ' e não houve resposta.';
      return;
    }
    const p = $('#vozMaq');
    p.classList.add('ligado');
    $('span', p).textContent = est.gpu ? 'no ar · ' + est.gpu : 'no ar';
    // qual motor esta ligado e se ELE pode ser publicado: e daqui que as vozes herdam o selo
    const m = est.motor, el = $('#vozMotor');
    el.hidden = !m;
    if (m) {
      el.className = 'voz-motor ' + (m.licenca === 'ok' ? 'ok' : 'alerta');
      el.innerHTML = '<b>' + esc(String(m.nome).split('(')[0].trim()) + '</b><br>'
        + esc(m.licenca_txt || '');
    }
    encherVozes();
    encherIdiomas();
  }

  function encherVozes() {
    const sel = $('#vozVoz'), antes = sel.value;
    if (!E.vozes.length) {
      sel.innerHTML = '<option value="">Nenhuma voz ainda — crie ou clone uma</option>';
      marcarVoz(null);
      return;
    }
    sel.innerHTML = E.vozes.map((v) =>
      `<option value="${esc(v.id)}">${esc(v.nome)}${v.motor ? ' · ' + esc(v.motor) : ''}</option>`).join('');
    // guarda a escolha anterior; senão, a primeira da lista (que vem ordenada pela licença:
    // as liberadas para publicar aparecem antes das proibidas, de propósito)
    sel.value = E.vozes.some((v) => v.id === antes) ? antes : E.vozes[0].id;
    marcarVoz(sel.value);
  }

  function marcarVoz(id) {
    const v = E.vozes.find((x) => x.id === id);
    const chip = $('#vozChipVoz'), selo = $('#vozChipLic'), lic = $('#vozLicenca');
    chip.textContent = v ? v.nome : 'Nenhuma voz escolhida';
    if (!v) { selo.hidden = true; lic.textContent = ''; return; }
    const [classe, curto] = SELOS[v.licenca] || SELOS.duvida;
    selo.hidden = false;
    selo.className = 'voz-selo ' + classe;
    selo.textContent = curto;
    lic.className = 'voz-licenca ' + classe;
    lic.textContent = v.licenca_txt || '';
  }

  function encherIdiomas() {
    const sel = $('#vozIdioma');
    if (sel.options.length) return;
    const lista = (E.estado.idiomas || []).slice();
    // Português na frente, sempre. É o idioma de quem usa este estúdio, e deixar "Automático"
    // escolhendo foi o que fez a voz sair embaralhada nos testes que rodaram por aí.
    const pt = lista.filter((l) => /^pt/i.test(l.codigo));
    const resto = lista.filter((l) => !/^pt/i.test(l.codigo));
    const todos = pt.length ? pt.concat(resto) : [{ codigo: 'pt', nome: 'Português' }].concat(resto);
    sel.innerHTML = todos.map((l) => `<option value="${esc(l.codigo)}">${esc(l.nome)}</option>`).join('');
    sel.value = (todos.find((l) => /^pt.?br/i.test(l.codigo)) || todos[0]).codigo;
  }

  // ------------------------------------------------------------------ montar (uma vez só)
  function montarUmaVez() {
    if (E.iniciado) return;
    E.iniciado = true;

    $('#vozEstilos').innerHTML = ESTILOS.map((s) =>
      `<button type="button" aria-pressed="false" data-estilo="${esc(s)}">${esc(s)}</button>`).join('');
    $('#vozEmocoes').innerHTML = EMOCOES.map((s) =>
      `<button type="button" aria-pressed="false" data-emocao="${esc(s)}">${esc(s)}</button>`).join('');
    if (window.ic) $$('#vVoz [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });

    $('#vozReprocurar').addEventListener('click', checar);
    $('#vozLigar').addEventListener('click', async () => {
      const bt = $('#vozLigar');
      bt.disabled = true;
      $('#vozOffDetalhe').textContent = 'Ligando… a primeira vez leva uns 30 segundos.';
      try {
        const r = await pedir('/api/voz/ligar', {});
        $('#vozOffDetalhe').textContent = r.recado || '';
        await checar();
      } catch (e) {
        $('#vozOffDetalhe').textContent = String(e.message || e).slice(0, 250);
      } finally { bt.disabled = false; }
    });
    $$('.voz-lado-bt').forEach((b) => b.addEventListener('click', () => trocarPagina(b.dataset.tela)));

    // --- texto para fala
    const ta = $('#vozTexto');
    ta.addEventListener('input', contar);
    contar();
    $('#vozLimpar').addEventListener('click', () => { ta.value = ''; contar(); ta.focus(); });
    $('#vozFalar').addEventListener('click', falar);
    $('#vozVoz').addEventListener('change', (ev) => marcarVoz(ev.target.value));
    $('#vozVel').addEventListener('input', (ev) =>
      { $('#vozVelVal').textContent = Number(ev.target.value).toFixed(2).replace('.', ',') + '×'; });
    $('#vozSteps').addEventListener('input', (ev) =>
      { $('#vozStepsVal').textContent = ev.target.value; });

    $('#vozEmocoes').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-emocao]');
      if (!b) return;
      const igual = E.emocao === b.dataset.emocao;
      E.emocao = igual ? null : b.dataset.emocao;   // clicar de novo desmarca
      $$('#vozEmocoes button').forEach((c) => c.setAttribute('aria-pressed', String(!igual && c === b)));
    });
    $('#vozIrCriar').addEventListener('click', () => {
      trocarPagina('desenhar');
      const d = $('#vozDesc');
      const i = instrucao();
      if (i && !d.value.includes(i)) d.value = (d.value + ', ' + i).trim();
      d.focus();
      descreverAgora();
    });

    // --- criar voz pela descrição
    $('#vozEstilos').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-estilo]');
      if (!b) return;
      const igual = E.estilo === b.dataset.estilo;
      E.estilo = igual ? null : b.dataset.estilo;
      $$('#vozEstilos button').forEach((c) => c.setAttribute('aria-pressed', String(!igual && c === b)));
    });
    let t = null;
    $('#vozDesc').addEventListener('input', () => { clearTimeout(t); t = setTimeout(descreverAgora, 700); });
    $('#vozCriar').addEventListener('click', criarVoz);

    // --- clonar
    const up = $('#vozUp'), inp = $('input', up);
    inp.addEventListener('change', () => pegarArquivo(inp.files[0]));
    up.addEventListener('dragover', (ev) => { ev.preventDefault(); up.classList.add('sobre'); });
    up.addEventListener('dragleave', () => up.classList.remove('sobre'));
    up.addEventListener('drop', (ev) => {
      ev.preventDefault(); up.classList.remove('sobre');
      pegarArquivo(ev.dataTransfer.files[0]);
    });
    $('#vozClonar').addEventListener('click', clonar);
  }

  function trocarPagina(nome) {
    E.pagina = nome;
    $$('.voz-lado-bt').forEach((b) =>
      b.toggleAttribute('aria-current', b.dataset.tela === nome));
    $$('.voz-pagina').forEach((p) => { p.hidden = p.dataset.pagina !== nome; });
  }

  // A entrega: o que esta escrito na caixa manda; os botoes sao so atalhos para ela.
  function instrucao() {
    const livre = ($('#vozInstruct') && $('#vozInstruct').value.trim()) || '';
    if (livre) return livre;
    return E.emocao ? ('fale de um jeito ' + E.emocao) : '';
  }

  // ------------------------------------------------------------------ texto para fala
  function contar() {
    const n = $('#vozTexto').value.trim().length;
    $('#vozLetras').textContent = n.toLocaleString('pt-BR');
    const s = n / LETRAS_SEG;
    $('#vozEstimado').textContent = s < 60 ? s.toFixed(1).replace('.', ',') + ' s'
      : Math.floor(s / 60) + 'min ' + Math.round(s % 60) + 's';
  }

  async function falar() {
    if (E.ocupado) return;
    const texto = $('#vozTexto').value.trim();
    if (!texto) { avisar('Escreva o texto da narração primeiro.', 'aviso'); return; }
    const bt = $('#vozFalar');
    E.ocupado = true;
    bt.disabled = true;
    $('span:last-child', bt).textContent = 'Gerando…';
    try {
      const r = await pedir('/api/voz/falar', {
        texto, voz: $('#vozVoz').value || null, idioma: $('#vozIdioma').value || 'pt',
        // os nomes sao os que o motor realmente aceita (conferidos na lista de ferramentas
        // dele): instruct = a entrega, speed = velocidade, steps = capricho.
        // A ENTREGA nao vai aqui: o motor so a aceita ao CRIAR ou CLONAR a voz
        // (conferido em 30/10 - generate_speech devolve 400 com ela).
        speed: Number($('#vozVel').value), steps: Number($('#vozSteps').value),
      });
      mostrarAudio(r);
    } catch (e) {
      avisar(String(e.message || e).slice(0, 300), 'erro');
    } finally {
      E.ocupado = false;
      bt.disabled = false;
      $('span:last-child', bt).textContent = 'Gerar narração';
    }
  }

  function mostrarAudio(r) {
    $('#vozSaida').hidden = false;
    const a = $('#vozAudio');
    a.src = r.url + '?t=' + Date.now();
    a.load();
    $('#vozBaixar').href = r.url;
    $('#vozBaixar').setAttribute('download', r.arquivo || 'narracao.wav');
    const real = r.segundos;
    const partes = [];
    if (real != null) partes.push('<b>' + String(real).replace('.', ',') + ' s</b> de verdade');
    if (r.estimado != null && real != null) {
      const dif = real - r.estimado;
      partes.push((Math.abs(dif) < 0.3 ? 'bate com a estimativa'
        : (dif > 0 ? '+' : '') + dif.toFixed(1).replace('.', ',') + ' s contra a estimativa'));
    }
    partes.push('gerado em ' + String(r.demorou).replace('.', ',') + ' s');
    $('#vozSaidaInfo').innerHTML = partes.join(' · ');
    // o número real é o que serve para encaixar o @segundo da narração; deixa visível em cima
    if (real != null) {
      const el = $('#vozReal');
      el.hidden = false;
      el.textContent = '· real: ' + String(real).replace('.', ',') + ' s';
    }
  }

  // ------------------------------------------------------------------ criar voz
  async function descreverAgora() {
    const d = $('#vozDesc').value.trim(), alvo = $('#vozEntendeu');
    if (d.length < 3) { alvo.textContent = ''; return; }
    let r;
    try {
      r = await pedir('/api/voz/descrever', { descricao: d });
    } catch (e) { alvo.textContent = ''; return; }
    const ent = Object.entries(r.entendeu || {});
    const ign = r.ignorou || [];
    let html = '';
    if (ent.length) html += '<span class="ok">Entendi: ' + esc(ent.map(([k, v]) => k + ' ' + v).join(', ')) + '</span>';
    // Isto é o ouro desta tela: dizer QUAL palavra não valeu nada, ENQUANTO ele escreve,
    // em vez de ele esperar a geração para descobrir.
    if (ign.length) html += '<span class="alerta">Não entendi: ' + esc(ign.join(', ')) + ' — troque por algo concreto.</span>';
    alvo.innerHTML = html;
  }

  async function criarVoz() {
    const desc = $('#vozDesc').value.trim();
    if (!desc) { avisar('Descreva a voz primeiro.', 'aviso'); return; }
    const bt = $('#vozCriar'), st = $('#vozCriarStatus');
    bt.disabled = true;
    st.textContent = 'Criando a voz… a primeira vez é a mais demorada.';
    try {
      const r = await pedir('/api/voz/desenhar', {
        descricao: E.estilo ? desc + ', entrega de ' + E.estilo : desc,
        nome: $('#vozDescNome').value.trim() || null,
        entrega: instrucao() || null,
      });
      E.vozes = r.vozes || E.vozes;
      encherVozes();
      $('#vozVoz').value = r.id;
      marcarVoz(r.id);
      st.textContent = 'Pronto. A voz já está escolhida — vá em "Texto para fala" e ouça.';
      trocarPagina('falar');
    } catch (e) {
      st.textContent = String(e.message || e).slice(0, 300);
    } finally {
      bt.disabled = false;
    }
  }

  // ------------------------------------------------------------------ clonar
  function pegarArquivo(f) {
    if (!f) return;
    E.arquivoRef = f;
    $('.up-txt', $('#vozUp')).textContent = f.name + ' · ' + Math.round(f.size / 1024) + ' KB';
  }

  async function clonar() {
    if (!E.arquivoRef) { avisar('Envie o áudio de referência.', 'aviso'); return; }
    const tr = $('#vozTransc').value.trim();
    if (!tr) { avisar('Escreva o que está falado no áudio — sem isso a voz sai embaralhada.', 'aviso'); return; }
    const bt = $('#vozClonar'), st = $('#vozClonarStatus');
    const fd = new FormData();
    fd.append('arquivo', E.arquivoRef);
    fd.append('transcricao', tr);
    fd.append('nome', $('#vozClonNome').value.trim());
    fd.append('idioma', $('#vozIdioma').value || 'pt');
    if (instrucao()) fd.append('entrega', instrucao());
    bt.disabled = true;
    st.textContent = 'Clonando… pode levar alguns minutos.';
    try {
      const r = await pedir('/api/voz/clonar', fd, true);
      E.vozes = r.vozes || E.vozes;
      encherVozes();
      $('#vozVoz').value = r.id;
      marcarVoz(r.id);
      st.textContent = 'Pronto. Ouça um trecho curto antes de gerar a narração inteira.';
      trocarPagina('falar');
    } catch (e) {
      st.textContent = String(e.message || e).slice(0, 300);
    } finally {
      bt.disabled = false;
    }
  }

  window.VOZ = { abrir, checar };
})();

/* ---------------------------------------- vozes na nuvem: a chave de QUEM USA (03/11/2026)
   O pacote do GitHub nao leva chave nenhuma. Quem tiver conta no ElevenLabs poe a propria
   aqui; quem nao tiver nem precisa abrir isto, porque a voz local e de graca e e o padrao.
   A tela nunca MOSTRA a chave de volta - so diz se existe uma guardada. */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);

  async function falar(caminho, corpo) {
    const r = await fetch(caminho, corpo === undefined ? undefined : {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    let d = null;
    try { d = await r.json(); } catch (_) { /* sem JSON */ }
    if (!r.ok) throw new Error((d && (d.erro || d.mensagem)) || `O estúdio respondeu ${r.status}.`);
    return d;
  }

  function recado(texto, tipo) {
    const m = $('#nuvemMsg');
    if (!m) return;
    m.textContent = texto || '';
    m.className = 'nuvem-msg' + (tipo ? ' ' + tipo : '');
  }

  function selo(tem) {
    const s = $('#nuvemSelo');
    if (s) {
      s.classList.toggle('on', !!tem);
      s.title = tem ? 'Uma chave está guardada nesta máquina.' : 'Sem chave: só voz local.';
    }
    const i = $('#nuvemChave');
    if (i) i.placeholder = tem ? 'uma chave já está guardada — cole outra para trocar'
                               : 'cole a chave aqui';
  }

  async function olhar() {
    try {
      const d = await falar('/api/chave-nuvem');
      selo(d && d.tem);
    } catch (_) { /* estudio velho: o bloco so fica quieto */ }
  }

  function ligar() {
    const bloco = $('#nuvemBloco');
    if (!bloco) return;
    olhar();
    $('#nuvemSalvar').addEventListener('click', async () => {
      const campo = $('#nuvemChave');
      const chave = (campo.value || '').trim();
      if (!chave) { recado('Cole a chave antes de salvar.', 'ruim'); return; }
      recado('Conferindo a chave com o ElevenLabs…');
      try {
        const d = await falar('/api/chave-nuvem', { chave });
        campo.value = '';
        selo(d.tem);
        recado(d.mensagem, d.ok ? 'bom' : 'ruim');
        if (d.ok && window.VOZ && window.VOZ.recarregarVozes) window.VOZ.recarregarVozes();
      } catch (e) {
        recado(String(e.message || e), 'ruim');
      }
    });
    $('#nuvemTirar').addEventListener('click', async () => {
      if (!confirm('Remover a chave do ElevenLabs desta máquina?\n\n'
                   + 'A narração continua funcionando com a voz local, de graça.')) return;
      try {
        const d = await falar('/api/chave-nuvem', { chave: '' });
        $('#nuvemChave').value = '';
        selo(false);
        recado(d.mensagem, 'bom');
        if (window.VOZ && window.VOZ.recarregarVozes) window.VOZ.recarregarVozes();
      } catch (e) {
        recado(String(e.message || e), 'ruim');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }
})();
