/* Estúdio Local — Canal automático.

   A esteira inteira numa tela: texto -> voz -> tempos -> cenas -> imagens -> pessoa
   falando -> montagem. Arquivo separado do app.js pelo mesmo motivo do voz.js: se
   quebrar, o resto do estúdio continua de pé.

   A regra que manda no desenho: a CONTA DE TEMPO aparece ANTES de a fila começar.
   Um vídeo de 75 s de fala custa mais de uma hora de placa; seis custam a noite. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LETRAS_SEG = 13.2, MIN_POR_SEG = 1.05;
  const ETAPAS = [
    ['texto', 'texto'], ['voz', 'voz'], ['tempos', 'tempos'], ['cenas', 'cenas'],
    ['apoio', 'imagens'], ['pessoa', 'pessoa falando'], ['montagem', 'montagem'],
  ];

  const E = { iniciado: false, videos: [], sel: new Set(), pasta: '', cenasDe: null, relogio: null };

  async function pedir(caminho, corpo) {
    const op = corpo === undefined ? { method: 'GET' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) };
    const r = await fetch(caminho, op);
    if (!r.ok) throw new Error((await r.text()) || ('Erro ' + r.status));
    return r.json();
  }

  function erro(msg) {
    const el = $('#canalErro');
    el.hidden = !msg;
    el.textContent = msg || '';
  }

  const fmtMin = (m) => (m >= 60 ? (Math.floor(m / 60) + ' h ' + Math.round(m % 60) + ' min')
    : (Math.round(m) + ' min'));

  // ------------------------------------------------------------------ abrir
  async function abrir() {
    montarUmaVez();
    await carregar();
    if (!E.relogio) E.relogio = setInterval(() => { if (!$('#vCanal').hidden) verFila(); }, 15000);
  }

  async function carregar() {
    try {
      const d = await pedir('/api/canal/listar');
      E.videos = d.videos || [];
      E.pasta = d.pasta || '';
      $('#canalPasta').textContent = d.existe ? d.pasta
        : 'Não achei a pasta do canal: ' + d.pasta;
      erro(d.existe ? '' : 'A pasta do canal não existe. Ajuste "canal_dir" nas preferências do estúdio.');
      render();
      mostrarFila(d.fila);
    } catch (e) {
      erro(String(e.message || e).slice(0, 300));
    }
  }

  async function verFila() {
    try {
      mostrarFila(await pedir('/api/canal/fila'));
    } catch (e) { /* a fila some do painel; não vale estourar a tela por isso */ }
  }

  function mostrarFila(f) {
    const cx = $('#canalFila');
    if (!f || !f.rodando) { cx.hidden = true; return; }
    cx.hidden = false;
    $('#canalFilaAgora').textContent = 'Fazendo vídeo agora' + (f.agora ? ': ' + f.agora : '');
    $('#canalFilaDetalhe').textContent = 'rodando há ' + fmtMin(f.desde / 60)
      + ' · a pessoa falando é a parte longa, cerca de 1 minuto de placa por segundo de fala'
      + (f.por_fora ? ' · começado fora desta aba, por isso o botão de parar não aparece' : '');
    // so da para parar o que foi comecado AQUI: matar um processo que a aba nao abriu
    // deixaria arquivo pela metade sem ninguem saber.
    $('#canalFilaParar').hidden = !!f.por_fora;
  }

  // ------------------------------------------------------------------ lista
  function render() {
    const cx = $('#canalLista');
    if (!E.videos.length) {
      cx.innerHTML = '<p class="fraco">Nenhum vídeo ainda. Clique em "Vídeo novo" e cole a narração.</p>';
      return;
    }
    cx.innerHTML = E.videos.map((v) => {
      const bolinhas = ETAPAS.map(([k, rot]) => {
        let classe = v.etapas[k] ? 'ok' : 'falta';
        let txt = rot;
        if (k === 'apoio' && v.apoio_quer) {
          txt = v.apoio_tem + '/' + v.apoio_quer + ' imagens';
          if (v.apoio_tem && v.apoio_tem < v.apoio_quer) classe = 'meio';
        }
        return `<span class="etapa ${classe}" title="${esc(txt)}"><i></i>${esc(txt)}</span>`;
      }).join('');
      const falta = v.minutos_faltando > 0
        ? `<span class="canal-falta">${esc(fmtMin(v.minutos_faltando))} de placa</span>` : '';
      const avisoAvatar = v.falta_avatar
        ? '<span class="canal-aviso">falta a foto da pessoa</span>' : '';
      return `<div class="canal-item ${v.pronto ? 'pronto' : ''}">
        <label class="canal-escolher">
          <input type="checkbox" data-sel="${esc(v.nome)}" ${E.sel.has(v.nome) ? 'checked' : ''}
                 ${v.pronto ? 'disabled' : ''}>
        </label>
        <div class="canal-item-corpo">
          <div class="canal-item-cab">
            <b>${esc(v.nome)}</b>
            ${v.pronto ? '<span class="canal-selo ok">pronto</span>' : ''}
            ${avisoAvatar}${falta}
          </div>
          <p class="canal-frase">${esc(v.primeira_linha || '(sem texto)')}</p>
          <div class="canal-etapas">${bolinhas}</div>
          <p class="canal-num">${esc(v.letras)} letras · ${esc(v.segundos)} s de narração
            ${v.segundos_medido ? '<span class="medido">medido</span>' : '<span class="fraco">estimado</span>'}</p>
        </div>
        <div class="canal-item-bts">
          <button type="button" class="bt-sec mini" data-cenas="${esc(v.nome)}">
            <span data-ic="imagem"></span>Cenas</button>
        </div>
      </div>`;
    }).join('');
    if (window.ic) $$('#canalLista [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });
    barra();
  }

  function barra() {
    const n = E.sel.size;
    $('#canalBarra').hidden = !n;
    if (!n) return;
    const min = E.videos.filter((v) => E.sel.has(v.nome))
      .reduce((s, v) => s + (v.minutos_faltando || 0), 0);
    const fim = new Date(Date.now() + min * 60000);
    $('#canalBarraTxt').innerHTML = `<b>${n}</b> escolhido${n > 1 ? 's' : ''} · `
      + `<b>${esc(fmtMin(min))}</b> de placa · termina por volta de `
      + `<b>${fim.getHours().toString().padStart(2, '0')}:${fim.getMinutes().toString().padStart(2, '0')}</b>`;
  }

  // ------------------------------------------------------------------ vídeo novo
  function contarTexto() {
    const n = $('#canalTexto').value.trim().length;
    const s = n / LETRAS_SEG;
    $('#canalLetras').textContent = n.toLocaleString('pt-BR');
    $('#canalSegundos').textContent = s.toFixed(0) + ' s';
    $('#canalPlaca').textContent = fmtMin(s * MIN_POR_SEG) + ' de placa';
    // o aviso dos 40 s é regra de roteiro do canal, não capricho: vídeo único, sem parte 2
    const d = $('#canalDica');
    if (s > 45) {
      d.hidden = false;
      d.textContent = 'Passou de 45 segundos. Vídeo longo demais costuma pedir corte — '
        + 'e nunca "parte 1 / parte 2", porque quem cai na parte 2 não entende nada.';
    } else { d.hidden = true; }
  }

  async function criar() {
    const titulo = $('#canalTituloIn').value.trim();
    const texto = $('#canalTexto').value.trim();
    if (!titulo || !texto) { erro('Precisa do título e do texto.'); return; }
    const bt = $('#canalCriar');
    bt.disabled = true;
    try {
      const v = await pedir('/api/canal/criar', { titulo, texto });
      $('#canalNovo').hidden = true;
      $('#canalTituloIn').value = '';
      $('#canalTexto').value = '';
      contarTexto();
      erro('');
      await carregar();
      abrirCenas(v.nome);   // o passo seguinte natural: escolher as imagens
    } catch (e) {
      erro(String(e.message || e).slice(0, 300));
    } finally {
      bt.disabled = false;
    }
  }

  // ------------------------------------------------------------------ cenas
  function linhaCena(gatilho, prompt, primeira) {
    return `<div class="cena-linha">
      <span class="cena-n">${primeira ? '★' : ''}</span>
      <input class="cena-gatilho" placeholder="palavra do texto" value="${esc(gatilho || '')}">
      <input class="cena-prompt" placeholder="descrição da imagem, em inglês" value="${esc(prompt || '')}">
      <button type="button" class="ic-bt" data-tirar aria-label="Tirar esta linha"><span data-ic="lixo"></span></button>
    </div>`;
  }

  function abrirCenas(nome) {
    E.cenasDe = nome;
    const v = E.videos.find((x) => x.nome === nome);
    $('#cenasSub').textContent = nome + (v ? ' · ' + v.segundos + ' s de narração' : '');
    $('#cenasStatus').textContent = '';
    $('#cenasTabela').innerHTML = [0, 1, 2, 3, 4, 5].map((i) => linhaCena('', '', i === 0)).join('');
    if (window.ic) $$('#cenasTabela [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });
    $('#dlgCenas').showModal();
  }

  function lerCenas() {
    return $$('#cenasTabela .cena-linha').map((l, i) => ({
      gatilho: $('.cena-gatilho', l).value.trim(),
      prompt: $('.cena-prompt', l).value.trim(),
      prioritario: i === 0,
    })).filter((x) => x.gatilho && x.prompt);
  }

  async function sugerir() {
    const bt = $('#cenasSugerir');
    bt.disabled = true;
    $('#cenasStatus').textContent = 'Lendo o texto… (a IA de texto é local; se a placa estiver ocupada ela usa o processador e demora mais)';
    try {
      const d = await pedir('/api/canal/cenas/sugerir',
        { nome: E.cenasDe, quantas: Number($('#cenasQuantas').value) || 6 });
      $('#cenasTabela').innerHTML = d.itens.map((x, i) => linhaCena(x.gatilho, x.prompt, i === 0)).join('');
      if (window.ic) $$('#cenasTabela [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });
      $('#cenasStatus').textContent = 'Confira as palavras: se alguma não existir no texto, aquela imagem é pulada.';
    } catch (e) {
      $('#cenasStatus').textContent = String(e.message || e).slice(0, 300);
    } finally {
      bt.disabled = false;
    }
  }

  async function gravarCenas() {
    const itens = lerCenas();
    if (!itens.length) { $('#cenasStatus').textContent = 'Preencha pelo menos uma linha.'; return; }
    const bt = $('#cenasGravar');
    bt.disabled = true;
    try {
      const d = await pedir('/api/canal/cenas/gravar', { nome: E.cenasDe, itens });
      // o relato diz quais entraram e quais foram puladas — é a informação que importa
      $('#cenasStatus').textContent = (d.relato || '').split('\n').slice(-6).join('\n')
        || 'Gravado.';
      await carregar();
    } catch (e) {
      $('#cenasStatus').textContent = String(e.message || e).slice(0, 400);
    } finally {
      bt.disabled = false;
    }
  }

  // ------------------------------------------------------------------ fila
  async function fazer() {
    const nomes = [...E.sel];
    if (!nomes.length) return;
    let conta;
    try {
      conta = await pedir('/api/canal/conta', { nomes });
    } catch (e) { erro(String(e.message || e)); return; }
    const semFoto = conta.sem_avatar || [];
    let aviso = `Vou fazer ${nomes.length} vídeo(s).\nTempo de placa: ${fmtMin(conta.minutos)}`
      + `\nTermina por volta de ${conta.termina}.`;
    if (semFoto.length) {
      aviso += `\n\n${semFoto.length} sem a foto da pessoa — esses param antes do vídeo:\n  `
        + semFoto.join('\n  ');
    }
    aviso += '\n\nPode começar?';
    if (!window.confirm(aviso)) return;
    try {
      mostrarFila(await pedir('/api/canal/fila', { nomes }));
      E.sel.clear();
      render();
    } catch (e) {
      erro(String(e.message || e).slice(0, 300));
    }
  }

  // ------------------------------------------------------------------ montar
  function montarUmaVez() {
    if (E.iniciado) return;
    E.iniciado = true;
    if (window.ic) $$('#vCanal [data-ic], #dlgCenas [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });

    $('#canalAtualizar').addEventListener('click', carregar);
    $('#canalNovoBt').addEventListener('click', () => {
      $('#canalNovo').hidden = !$('#canalNovo').hidden;
      if (!$('#canalNovo').hidden) $('#canalTituloIn').focus();
    });
    $('#canalCancelar').addEventListener('click', () => { $('#canalNovo').hidden = true; });
    $('#canalTexto').addEventListener('input', contarTexto);
    $('#canalCriar').addEventListener('click', criar);
    $('#canalLimparSel').addEventListener('click', () => { E.sel.clear(); render(); });
    $('#canalFazer').addEventListener('click', fazer);
    $('#canalFilaParar').addEventListener('click', async () => {
      if (!window.confirm('Parar a fila? O vídeo que está sendo feito agora é interrompido.')) return;
      mostrarFila(await pedir('/api/canal/fila', { parar: true }));
    });

    $('#canalLista').addEventListener('click', (ev) => {
      const c = ev.target.closest('[data-cenas]');
      if (c) { abrirCenas(c.dataset.cenas); return; }
    });
    $('#canalLista').addEventListener('change', (ev) => {
      const s = ev.target.closest('[data-sel]');
      if (!s) return;
      if (s.checked) E.sel.add(s.dataset.sel); else E.sel.delete(s.dataset.sel);
      barra();
    });

    $('#cenasSugerir').addEventListener('click', sugerir);
    $('#cenasGravar').addEventListener('click', gravarCenas);
    $('#cenasFechar').addEventListener('click', () => $('#dlgCenas').close());
    $('#cenasMais').addEventListener('click', () => {
      $('#cenasTabela').insertAdjacentHTML('beforeend', linhaCena('', '', false));
      if (window.ic) $$('#cenasTabela [data-ic]').forEach((el) => { if (!el.firstElementChild) el.innerHTML = window.ic(el.dataset.ic); });
    });
    $('#cenasTabela').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-tirar]');
      if (b) b.closest('.cena-linha').remove();
    });
    contarTexto();
  }

  window.CANAL = { abrir, carregar };
})();
