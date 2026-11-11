/* O idioma da tela: português (padrão) ou inglês.
 *
 * ## A regra de ouro deste arquivo
 *
 * O PORTUGUÊS FICA ESCRITO NO HTML. O inglês só troca por cima, no navegador. Três
 * consequências, e as três são de propósito:
 *
 *   1. tradução que falta não deixa buraco na tela - fica o português, que está certo;
 *   2. dá para traduzir uma tela por vez sem a tela ficar pela metade;
 *   3. quem lê o código (ou o HTML) continua lendo português, que é a língua do projeto.
 *
 * Metade traduzido seria pior que nada: a pessoa troca para inglês e vê uma tela
 * misturada, sem saber se é defeito. Com a sobra em português, o pior caso é "esta
 * parte ainda não foi traduzida" - feio, mas honesto e usável.
 *
 * ## Como marcar um texto para traduzir
 *
 *   <span data-i18n="nav.inicio">Início</span>          texto simples
 *   <h1 data-i18n-html="inicio.titulo">O que ...</h1>    quando tem <em>, <b> dentro
 *   <input data-i18n-attr="placeholder:busca.dica">      atributo (placeholder, title...)
 *
 * O texto português original é guardado na primeira troca, então voltar para o
 * português devolve exatamente o que o HTML trazia.
 *
 * ## Para quem for continuar (11/11/2026)
 *
 * Isto cobre a CASCA (topo, menu) e a tela de Início. O resto da tela continua em
 * português mesmo com o inglês escolhido - e é assim que tem de ser até alguém traduzir.
 * As mensagens que nascem no server.py NÃO passam por aqui: são outro trabalho, e o
 * maior deles.
 */
(function () {
  'use strict';

  var CHAVE = 'forja_idioma';
  var PADRAO = 'pt';

  // ------------------------------------------------------------------ o dicionário
  // Só o inglês: o português é o que já está escrito no HTML.
  var EN = {
    // ---- topo e menu
    'nav.inicio': 'Home',
    'nav.tudo': 'My creations',
    'nav.imagem': 'Image',
    'nav.video': 'Video',
    'nav.apresentador': 'Talking person',
    'nav.plano': 'One-take scene',
    'nav.canal': 'Channel',
    'nav.voz': 'Narration',
    'nav.musica': 'Music',
    'nav.fila': 'Queue',
    'nav.secoes': 'Sections',
    'topo.marca': 'JerS Forja Studio — home',
    'maq.dica': 'Your machine (opens Home)',
    'maq.verificando': 'checking…',

    // ---- o seletor de idioma
    'idioma.rotulo': 'Language',
    'idioma.pt': 'Português',
    'idioma.en': 'English',

    // ---- tela de Início
    'inicio.titulo': 'What are we <em>forging</em> today?',
    'inicio.sub': 'Images, video, talking people, narration and music — forged on your own '
      + 'graphics card. No monthly fee, no cloud, no waiting in anyone’s queue.'
  };

  var DICIONARIOS = { en: EN };

  // ------------------------------------------------------------------ o estado
  function guardado() {
    try {
      var v = localStorage.getItem(CHAVE);
      return v === 'en' || v === 'pt' ? v : PADRAO;
    } catch (e) {
      return PADRAO;   // navegador com armazenamento bloqueado: segue em português
    }
  }

  var atual = guardado();

  function t(chave, sobra) {
    var d = DICIONARIOS[atual];
    if (d && d[chave]) return d[chave];
    return sobra === undefined ? chave : sobra;
  }

  // ------------------------------------------------------------------ aplicar na tela
  function original(el, campo) {
    // Guarda o português do HTML na primeira vez, para a volta ser exata.
    var guarda = 'pt' + campo;
    if (el.dataset[guarda] === undefined) {
      el.dataset[guarda] = campo === 'Html' ? el.innerHTML : el.textContent;
    }
    return el.dataset[guarda];
  }

  function aplicar(raiz) {
    var onde = raiz || document;
    var d = DICIONARIOS[atual];

    onde.querySelectorAll('[data-i18n]').forEach(function (el) {
      var pt = original(el, 'Texto');
      var k = el.getAttribute('data-i18n');
      el.textContent = (d && d[k]) || pt;
    });

    onde.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var pt = original(el, 'Html');
      var k = el.getAttribute('data-i18n-html');
      el.innerHTML = (d && d[k]) || pt;
    });

    // "placeholder:busca.dica" ou "title:maq.dica, aria-label:topo.marca"
    onde.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (par) {
        var p = par.split(':');
        if (p.length !== 2) return;
        var attr = p[0].trim();
        var k = p[1].trim();
        var guarda = 'ptAttr' + attr.replace(/[^a-z]/gi, '');
        if (el.dataset[guarda] === undefined) el.dataset[guarda] = el.getAttribute(attr) || '';
        el.setAttribute(attr, (d && d[k]) || el.dataset[guarda]);
      });
    });

    document.documentElement.lang = atual === 'en' ? 'en' : 'pt-BR';
  }

  function trocar(novo) {
    if (novo !== 'en' && novo !== 'pt') return;
    atual = novo;
    try {
      localStorage.setItem(CHAVE, novo);
    } catch (e) { /* sem armazenamento: vale só para esta aba */ }
    aplicar();
    // Quem desenha conteúdo por JavaScript escuta isto para redesenhar. Hoje ninguém
    // escuta ainda - fica pronto para quando as outras telas forem traduzidas.
    document.dispatchEvent(new CustomEvent('idioma-mudou', { detail: { idioma: novo } }));
  }

  // ------------------------------------------------------------------ o seletor
  function montarSeletor() {
    var canto = document.getElementById('idiomaCanto');
    if (!canto) return;
    canto.innerHTML =
      '<label class="sr-only" for="idiomaSel" data-i18n="idioma.rotulo">Idioma</label>'
      + '<select id="idiomaSel" class="idioma-sel" title="Idioma / Language">'
      + '<option value="pt">PT</option><option value="en">EN</option></select>';
    var sel = document.getElementById('idiomaSel');
    sel.value = atual;
    sel.addEventListener('change', function () { trocar(sel.value); });
  }

  function comecar() {
    montarSeletor();
    aplicar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', comecar);
  } else {
    comecar();
  }

  window.I18N = {
    t: t,
    aplicar: aplicar,
    trocar: trocar,
    get idioma() { return atual; }
  };
})();
