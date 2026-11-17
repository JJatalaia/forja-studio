/* A atualizacao de configuracao, do lado da tela (03/11/2026).

   Como ele pediu: a pessoa abre o painel e a novidade JA ESTA LA. E, se o painel ficar
   aberto, ela aparece sozinha - sem a pessoa precisar recarregar a pagina.

   Duas forcas:
     - NORMAL     : aparece uma tarja com "Atualizar agora". Quem quiser, clica.
     - OBRIGATORIA: aplica sozinha, avisa o que mudou, e recarrega a tela.

   Por que a obrigatoria recarrega a pagina: a configuracao mexe nas IAs do painel, nos
   formatos e nos textos. Com a tela velha na frente dos dados novos, a pessoa clicaria numa
   IA que nao existe mais e levaria um erro sem explicacao. Recarregar e mais honesto.

   De quanto em quanto: ao abrir e de 10 em 10 minutos. Configuracao nova nao e urgente ao
   ponto de bater no servidor toda hora, e o servidor guarda a resposta por 5 minutos de
   qualquer jeito. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DE_QUANTO = 10 * 60 * 1000;
  const E = { aplicando: false, avisada: null };

  async function pedir(caminho, corpo) {
    const r = await fetch(caminho, corpo === undefined ? undefined : {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo || {}),
    });
    let d = null;
    try { d = await r.json(); } catch (_) { /* sem JSON: cai no erro abaixo */ }
    if (!r.ok) throw new Error((d && d.erro) || `O estúdio respondeu ${r.status}.`);
    return d;
  }

  function onde() {
    return $('#atualizacaoTarja');
  }

  function limpar() {
    const t = onde();
    if (t) t.innerHTML = '';
  }

  function tarja(estado) {
    const t = onde();
    if (!t) return;
    const quando = estado.publicada_em
      ? new Date(estado.publicada_em * 1000).toLocaleDateString('pt-BR',
          { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';
    t.innerHTML =
      '<div class="atu-tarja" role="status">' +
        '<div class="atu-txt">' +
          '<p class="atu-titulo">' + esc(estado.titulo || 'Configuração nova disponível') + '</p>' +
          (estado.texto ? '<p class="atu-sub">' + esc(estado.texto) + '</p>' : '') +
          '<p class="atu-pe">versão ' + esc(estado.versao) + (quando ? ' · ' + quando : '') +
            ' · mexe em: ' + esc((estado.arquivos || []).join(', ') || 'configuração') + '</p>' +
        '</div>' +
        '<div class="atu-bts">' +
          '<button type="button" class="bt-sec" id="atuDepois">Depois</button>' +
          '<button type="button" class="gerar" id="atuAgora">Atualizar agora</button>' +
        '</div>' +
      '</div>';
    $('#atuAgora').addEventListener('click', () => aplicar(false));
    $('#atuDepois').addEventListener('click', () => {
      E.avisada = estado.versao;   // nao insiste nesta versao ate recarregar a pagina
      limpar();
    });
  }

  function trabalhando(texto) {
    const t = onde();
    if (t) {
      t.innerHTML = '<div class="atu-tarja atu-indo" role="status"><div class="atu-txt">'
        + '<p class="atu-titulo">' + esc(texto) + '</p></div></div>';
    }
  }

  async function aplicar(obrigatoria) {
    if (E.aplicando) return;
    E.aplicando = true;
    trabalhando(obrigatoria ? 'Atualizando a configuração…' : 'Baixando a configuração nova…');
    try {
      const r = await pedir('/api/atualizacao/aplicar', {});
      if (r.nada_a_fazer) { limpar(); return; }
      const t = onde();
      if (t) {
        t.innerHTML = '<div class="atu-tarja atu-pronto" role="status"><div class="atu-txt">'
          + '<p class="atu-titulo">Pronto: configuração ' + esc(r.versao) + ' aplicada.</p>'
          + '<p class="atu-sub">' + esc((r.arquivos || []).join(', '))
          + (r.recarregar_pediu_reinicio
             ? ' — feche e abra o estúdio para ela valer por completo.' : '') + '</p>'
          + '</div></div>';
      }
      // recarrega para a tela nascer junto com os dados novos
      setTimeout(() => location.reload(), obrigatoria ? 2500 : 1800);
    } catch (e) {
      const t = onde();
      if (t) {
        t.innerHTML = '<div class="atu-tarja atu-erro" role="alert"><div class="atu-txt">'
          + '<p class="atu-titulo">Não consegui atualizar.</p>'
          + '<p class="atu-sub">' + esc(e.message || e) + '</p></div>'
          + '<div class="atu-bts"><button type="button" class="bt-sec" id="atuDeNovo">'
          + 'Tentar de novo</button></div></div>';
        const bt = $('#atuDeNovo');
        if (bt) bt.addEventListener('click', () => { E.aplicando = false; aplicar(obrigatoria); });
      }
    } finally {
      E.aplicando = false;
    }
  }

  async function conferir() {
    if (E.aplicando) return;
    let estado;
    try {
      estado = await pedir('/api/atualizacao/estado');
    } catch (_) {
      return;   // estudio velho ou servidor fora: nao enche o saco de ninguem
    }
    if (!estado || !estado.tem_nova) { limpar(); return; }
    if (estado.obrigatoria) {
      aplicar(true);
      return;
    }
    if (estado.versao !== E.avisada) tarja(estado);
  }

  function comecar() {
    conferir();
    setInterval(conferir, DE_QUANTO);
    // voltou para a aba depois de um tempo: confere na hora, sem esperar os 10 minutos
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) conferir();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', comecar);
  } else {
    comecar();
  }

  window.ATUALIZACAO = { conferir, aplicar };
})();
