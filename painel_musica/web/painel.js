'use strict';
/* Painel de música do Forja Studio (aba Música) — interface de 2026-09-23, no pacote desde 14/11/2026.
   14/11/2026: a tela só mostra as IAs que o servidor lista (GET /api/fichas, filtrado por PAINEL_MOTORES). Nada
   aqui escolhe uma IA pelo nome: a IA padrão é a primeira da lista. O que depende de algo que pode faltar na
   máquina (modelo não baixado, cover sem o transcritor, "Tirar voz" sem o nó, equalizador sem o pedalboard)
   vem do GET /api/status e a tela esconde ou avisa.
   - uma biblioteca só ("Suas músicas"), com o selo da IA que gerou cada faixa;
   - escolha da IA em cartões, com "Saiba mais" lendo a ficha (GET /api/fichas → estudio/fichas.json);
   - "Apagar" apaga do HD de verdade, sempre com confirmação na tela;
   - as consultas param quando a aba (ou a aba Música do Estúdio) não está visível.
   O arquivo se chama painel.js (e não app.js, nome da tela antiga) para o navegador nunca misturar as duas telas.
   Etapa 1 (23/09 à noite): "✍️ Escrever letra com IA" e "✨ Melhorar descrição do estilo" (IA de texto do Estúdio, pelo
   POST /api/texto do painel), idioma da letra e "Música de referência" (estilo por áudio) no ACE-Step Oficial e no XL.
   Treblo v3 (26/09): IA na nuvem, paga (100 créditos por música). Selo e saldo no cartão (GET /api/treblo/saldo),
   cover com "Fidelidade ao original" (1–5), letra opcional no cover e confirmação antes de gastar os créditos.
   Musicful (26/09): outra IA na nuvem, paga (1 música do plano da API por pedido; costuma vir em 2 versões). Selo, saldo
   (GET /api/musicful/saldo) e "Trocar chave" no cartão, como a Treblo (o diálogo da chave serve às duas); seletor
   "Modelo" (MFV3.0/2.0/1.5X); não faz cover; confirmação antes de gerar. */

const $ = id => document.getElementById(id);
const EMBED = document.documentElement.classList.contains('embed');
const TREBLO = 'treblo-v3', CUSTO_TREBLO = 100;  // nuvem, paga
const MUSICFUL = 'musicful';                      // nuvem, paga (1 música do plano por pedido)
const COVER = new Set(['ace-step-official', 'yue2-int8', TREBLO]);
const XL = new Set(['ace-xl-turbo', 'ace-xl-sft']);
const MOTORES_REF = new Set(['ace-step-official', 'ace-xl-turbo', 'ace-xl-sft']);  // aceitam "música de referência"
// O endereço do estúdio que embute esta tela (vem em ?estudio=...; sem ele, o padrão de sempre).
const ORIGEM_ESTUDIO = (() => {
  try { return new URL(new URLSearchParams(location.search).get('estudio') || 'http://127.0.0.1:8194').origin; }
  catch { return 'http://127.0.0.1:8194'; }
})();
const IDIOMAS_TEXTO = {pt: 'pt-BR', en: 'en', es: 'es'};
const NOMES_IDIOMA = {pt: 'Português', en: 'Inglês', es: 'Espanhol'};
const NOTAS_TOM = {C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si'};

const ICONES = {
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  musica: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  tocar: '<path d="M7 4v16l13-8z"/>',
  pausar: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  baixar: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  apagar: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  letra: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  reusar: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  semvoz: '<path d="M12 2a3 3 0 0 0-3 3v5"/><path d="M15 9.3V5a3 3 0 0 0-2-2.8"/><path d="M19 10v2a7 7 0 0 1-.6 2.8"/><path d="M5 10v2a7 7 0 0 0 11.4 5.4"/><path d="M12 19v3"/><path d="m2 2 20 20"/>',
  anterior: '<path d="M19 20 9 12l10-8z"/><path d="M5 19V5"/>',
  proxima: '<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>',
  aleatorio: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
  repetir: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  fechar: '<path d="M18 6 6 18M6 6l12 12"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  enviar: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
  parar: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
  onda: '<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>',
  eq: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  alerta: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
};
const ic = nome => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ''}</svg>`;
const esc = texto => String(texto ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function preencherIcones(raiz = document) {
  raiz.querySelectorAll('[data-ic]').forEach(n => { if (!n.dataset.icOk) { n.insertAdjacentHTML('afterbegin', ic(n.dataset.ic)); n.dataset.icOk = '1'; } });
}
function el(tag, classe, texto) { const n = document.createElement(tag); if (classe) n.className = classe; if (texto != null) n.textContent = texto; return n; }
function botao(classe, icone, texto, titulo) {
  const b = el('button', classe); b.type = 'button';
  b.innerHTML = (icone ? ic(icone) : '') + (texto ? `<span>${esc(texto)}</span>` : '');
  if (titulo) { b.title = titulo; b.setAttribute('aria-label', titulo); }
  return b;
}
function lerLocal(chave) { try { return localStorage.getItem('musica.' + chave); } catch { return null; } }
function salvarLocal(chave, valor) { try { localStorage.setItem('musica.' + chave, valor); } catch { /* sem armazenamento: tudo bem */ } }
const num = (valor, casas = 1) => Number(valor).toLocaleString('pt-BR', {maximumFractionDigits: casas});
function tempo(segundos) {
  if (!Number.isFinite(segundos) || segundos <= 0) return '';
  const s = Math.round(segundos), m = Math.floor(s / 60);
  return m ? `${m}:${String(s % 60).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`;
}
function duracaoTexto(segundos) {
  const s = Math.round(segundos || 0);
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m} min ${r} s` : `${m} min`;
}
const data = epoch => new Date(epoch * 1000).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'});

const E = {
  modo: 'create', motor: lerLocal('motor') || '', referencia: null, seed: 23001,
  painelOk: false, online: false, aceOnline: false, teste: false, enviando: false, jobs: [], fichas: {}, ordem: [], assinatura: '',
  // o que esta máquina tem (GET /api/status): modelos que faltam por IA, cover do YuE2, "Tirar voz", motor instalado
  faltam: {}, coverYue: true, separador: false, motorInstalado: true, comfyRecado: '',
  tocando: null, fila: [], aleatorio: false, repetir: false, vozAntesSa3: null,
  refEstilo: null,                               // música de referência escolhida {name, label, url}
  desfazer: {letra: [], estilo: []},             // textos de antes da IA de texto (botão "Desfazer")
  pedidoLetra: null, pedidoEstilo: null, variacaoLetra: 0, textoAtivo: null,
  saldos: {}, saldoEm: {}                        // saldo de cada IA na nuvem, por id (o servidor guarda por 60 s)
};

// Toda consulta leva a versão da tela: o servidor reconhece uma tela antiga guardada no navegador (sem este cabeçalho)
// e pede F5 em vez de executar o que ela manda. Igual ao VERSAO_TELA do server.py e ao ?v= do index.html.
const VERSAO_TELA = '20261114q';
// Servidores de 23/09 em diante já sabem letra com IA e música de referência; só o Equalizador (27/09 e) espera o reinício.
const VERSOES_COM_ETAPA1 = new Set(['20260923b', '20260926u', '20260926m', '20260926d', '20260927f', '20260927c', '20260927a']);
async function api(caminho, opcoes = {}) {
  let resposta, texto;
  const pedido = {...opcoes, headers: {...(opcoes.headers || {}), 'X-Painel-Tela': VERSAO_TELA}};
  try { resposta = await fetch('/api/' + caminho, pedido); }
  catch (e) { if (e?.name === 'AbortError') throw e; throw new Error('Sem conexão com o painel de música.'); }
  try { texto = await resposta.text(); }
  catch (e) { if (e?.name === 'AbortError') throw e; throw new Error('A resposta do painel chegou incompleta. Tente de novo.'); }
  let corpo = {};
  try { corpo = texto ? JSON.parse(texto) : {}; } catch { throw new Error(`O painel respondeu de um jeito inesperado (código ${resposta.status}).`); }
  if (!resposta.ok) {
    const falha = new Error(typeof corpo.error === 'string' ? corpo.error : `Não deu certo (código ${resposta.status}).`);
    falha.tecnico = typeof corpo.erro_tecnico === 'string' ? corpo.erro_tecnico : '';
    throw falha;
  }
  return corpo;
}
const postar = (caminho, dados) => api(caminho, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados || {})});
function erro(mensagem = '', tecnico = '') {
  const caixa = $('erro'); caixa.textContent = mensagem; caixa.hidden = !mensagem;
  if (mensagem && tecnico) { const d = el('details', 'tecnico'); d.append(el('summary', '', 'Detalhe técnico'), el('pre', '', tecnico)); caixa.append(d); }
}
let timerAviso = null;
function aviso(texto, tipo = 'ok') {
  let t = document.querySelector('.toast');
  if (!t) { t = el('div', 'toast'); t.setAttribute('role', 'status'); document.body.append(t); }
  t.className = 'toast ' + tipo; t.textContent = texto; t.hidden = false;
  clearTimeout(timerAviso); timerAviso = setTimeout(() => { t.hidden = true; }, 4500);
}

/* ---------------------------------------------------------------- janelas */
function abrirJanela(dlg, html) {
  dlg.innerHTML = html; preencherIcones(dlg);
  dlg.querySelectorAll('[data-fechar]').forEach(b => { b.onclick = () => dlg.close(); });
  if (!dlg.open) dlg.showModal();
}
for (const dlg of document.querySelectorAll('dialog')) dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });
function confirmar(titulo, texto, rotulo = 'Confirmar', perigo = false) {
  return new Promise(resolve => {
    const dlg = $('dlgConfirmar');
    abrirJanela(dlg, `<div class="janela-corpo"><div class="janela-cab">${perigo ? `<span class="conf-ic">${ic('alerta')}</span>` : ''}
      <div><h2 id="confirmarTitulo">${esc(titulo)}</h2><p class="fraco">${esc(texto)}</p></div></div>
      <div class="janela-acoes"><button type="button" class="bt-sec" data-nao>Cancelar</button>
      <button type="button" class="${perigo ? 'bt-perigo' : 'gerar curto'}" data-sim>${esc(rotulo)}</button></div></div>`);
    let resposta = false;
    dlg.querySelector('[data-sim]').onclick = () => { resposta = true; dlg.close(); };
    dlg.querySelector('[data-nao]').onclick = () => dlg.close();
    dlg.addEventListener('close', () => resolve(resposta), {once: true});
  });
}

/* ---------------------------------------------------------------- fichas e cartões das IAs */
function notas(valor, rotulo, classe) {
  const v = Number(valor) || 0;
  return `<span class="notas ${classe}" title="${rotulo}: ${v} de 5">${rotulo} <i>${[1, 2, 3, 4, 5].map(n => `<b class="${n <= v ? 'on' : ''}"></b>`).join('')}</i></span>`;
}
function nomeIa(id) { return E.fichas[id]?.nome || id; }
const motoresDaTela = () => E.ordem.filter(id => id !== 'separador');
// Esta IA faz cover NESTA máquina? (o cover do YuE2 precisa de um arquivo a mais, que pode não ter sido baixado)
const fazCover = id => COVER.has(id) && !(id === 'yue2-int8' && !E.coverYue);
const algumaFazCover = () => motoresDaTela().some(fazCover);
const algumaAceitaRef = () => motoresDaTela().some(id => MOTORES_REF.has(id));
function motorPadrao(cover = false) {
  const lista = motoresDaTela();
  return (cover ? lista.find(fazCover) : null) || lista.find(id => !(E.faltam[id] || []).length) || lista[0] || '';
}
const listaDeNomes = ids => ids.map(nomeIa).join(', ').replace(/, ([^,]*)$/, ' e $1');
function desenharMotores() {
  const caixa = $('motores');
  if (!E.ordem.length) { caixa.innerHTML = '<p class="nota">Não deu para ler as fichas das IAs. Confira o arquivo estudio\\fichas.json.</p>'; return; }
  caixa.replaceChildren();
  for (const id of E.ordem) {
    if (id === 'separador') continue;
    const f = E.fichas[id], sel = id === E.motor, bloq = E.modo === 'cover' && !fazCover(id);
    const falta = (E.faltam[id] || []).length > 0;
    const card = el('div', 'ia-card' + (sel ? ' sel' : '') + (bloq ? ' bloq' : ''));
    const escolher = el('button', 'ia-escolher'); escolher.type = 'button';
    escolher.setAttribute('role', 'radio'); escolher.setAttribute('aria-checked', String(sel)); escolher.disabled = bloq;
    escolher.innerHTML = `<span class="ia-topo"><span class="ia-nome">${esc(f.nome)}</span>${sel ? `<span class="ia-check">${ic('ok')}</span>` : ''}</span>
      <span class="ia-resumo">${esc(f.resumo_curto)}</span>
      <span class="ia-meta">${notas(f.nota_velocidade, 'Velocidade', 'v')}${notas(f.nota_qualidade, 'Qualidade', 'q')}</span>
      ${NUVEM[id] ? `<span class="ia-nuvem">${esc(NUVEM[id].selo)}</span><span class="ia-saldo${E.saldos[id] && (!E.saldos[id].tem_chave || E.saldos[id].erro) ? ' falta' : ''}" id="saldo-${id}">${esc(textoSaldo(id))}</span>` : ''}
      ${bloq ? '<span class="ia-aviso">Não faz cover</span>' : ''}
      ${falta ? '<span class="ia-aviso">Falta baixar: abra o Início do estúdio e baixe esta IA</span>' : ''}`;
    escolher.onclick = () => { if (!bloq) { E.motor = id; aplicarMotor(); } };
    const rodape = el('div', 'ia-rodape');
    rodape.innerHTML = `<span class="tags">${(f.tags || []).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span>`;
    const saiba = botao('ia-saiba', 'info', 'Saiba mais', 'Saiba mais sobre ' + f.nome); saiba.onclick = () => abrirFicha(id);
    rodape.append(saiba);
    if (NUVEM[id]) {  // campo para trocar a chave da API (a tela nunca recebe a chave atual)
      const chave = botao('ia-saiba', '', E.saldos[id] && !E.saldos[id].tem_chave ? 'Colocar chave' : 'Trocar chave',
        `Colocar ou trocar a chave da API da ${NUVEM[id].nome}`);
      chave.onclick = () => trocarChave(id); rodape.append(chave);
    }
    card.append(escolher, rodape); caixa.append(card);
  }
}
/* IAs na nuvem (pagas): selo, saldo e chave. A chave nunca vem para a tela: só "tem_chave". */
const NUVEM = {
  [TREBLO]: {nome: 'Treblo', rota: 'treblo', selo: `Nuvem · paga · ${CUSTO_TREBLO} créditos`,
    arquivo: 'API\\treblo_api_key.txt', onde: 'site da Treblo → Account → API Keys', exemplo: 'sksonauto_...',
    saldo: s => `Saldo: ${num(s.creditos, 0)} créditos` + (s.creditos_avulsos ? ` (+${num(s.creditos_avulsos, 0)} avulsos)` : '')},
  [MUSICFUL]: {nome: 'Musicful', rota: 'musicful', selo: 'Nuvem · paga',
    arquivo: 'API\\musicful_api_key.txt', onde: 'musicful.ai → API → API Key', exemplo: 'chave da API (letras e números)',
    saldo: s => `Saldo: ${num(s.musicas, 2)} ${Number(s.musicas) === 1 ? 'música' : 'músicas'}`}
};
function textoSaldo(id) {
  const s = E.saldos[id], n = NUVEM[id];
  if (!s) return 'Saldo: consultando…';
  if (!s.tem_chave) return s.aviso || `Coloque a chave da ${n.nome} em ${n.arquivo}`;
  if (s.erro) return 'Saldo indisponível: ' + s.erro;
  return n.saldo(s);
}
function trocarChave(id) {
  const n = NUVEM[id], dlg = $('dlgChave');
  abrirJanela(dlg, `<div class="janela-corpo"><div class="janela-cab"><div>
      <h2 id="chaveTitulo">Chave da API da ${esc(n.nome)}</h2>
      <p class="fraco">Cole a chave nova (${esc(n.onde)}). O painel testa na ${esc(n.nome)} antes de salvar;
      se ela recusar, a chave atual continua valendo.</p></div></div>
    <input type="password" id="chaveNova" class="campo" autocomplete="off" spellcheck="false" placeholder="${esc(n.exemplo)}" style="width:100%">
    <p class="nota" id="chaveMsg" role="status"></p>
    <div class="janela-acoes"><button type="button" class="bt-sec" data-nao>Cancelar</button>
    <button type="button" class="gerar curto" data-sim>Testar e salvar</button></div></div>`);
  const campo = dlg.querySelector('#chaveNova'), msg = dlg.querySelector('#chaveMsg'), sim = dlg.querySelector('[data-sim]');
  campo.focus();
  dlg.querySelector('[data-nao]').onclick = () => dlg.close();
  sim.onclick = async () => {
    const chave = campo.value.trim();
    if (!chave) { msg.textContent = 'Cole a chave no campo.'; return; }
    sim.disabled = true; msg.textContent = `Testando a chave na ${n.nome}…`;
    try {
      // leva o cabeçalho da versão da tela: sem ele o servidor trataria o pedido como vindo da tela antiga
      const r = await fetch(`/api/${n.rota}/chave`, {method: 'POST', body: JSON.stringify({chave}),
        headers: {'Content-Type': 'application/json', 'X-Painel-Tela': VERSAO_TELA}});
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || j.error || 'Não deu para salvar a chave.');
      campo.value = '';
      E.saldos[id] = j; E.saldoEm[id] = Date.now(); desenharMotores(); atualizarBotao();
      dlg.close(); aviso(`Chave da ${n.nome} salva. ${textoSaldo(id)}.`);
    } catch (e) { msg.textContent = e.message; sim.disabled = false; }
  };
  campo.onkeydown = ev => { if (ev.key === 'Enter') sim.click(); };
}
async function pedirSaldo(id, forcar = false) {
  if (!NUVEM[id] || !E.ordem.includes(id) || (!forcar && Date.now() - (E.saldoEm[id] || 0) < 60000)) return;
  E.saldoEm[id] = Date.now();
  try { E.saldos[id] = await api(NUVEM[id].rota + '/saldo'); }
  catch (e) { E.saldos[id] = {tem_chave: true, erro: e.message}; }
  desenharMotores(); atualizarBotao();
}
function abrirFicha(id) {
  const f = E.fichas[id]; if (!f) return;
  const sec = (classe, titulo, texto) => texto ? `<section class="ficha-sec ${classe}"><h3>${titulo}</h3><p>${esc(texto)}</p></section>` : '';
  const podeUsar = id !== 'separador' && !(E.modo === 'cover' && !fazCover(id));
  abrirJanela($('dlgFicha'), `<div class="janela-corpo">
    <div class="janela-cab"><div><span class="ficha-cat">${esc(f.categoria || 'Música')}</span><h2 id="fichaTitulo">${esc(f.nome)}</h2>
      <p class="fraco">${esc(f.resumo_curto)}</p></div><button type="button" class="ic-bt" data-fechar aria-label="Fechar">${ic('fechar')}</button></div>
    <div class="ficha-notas">${notas(f.nota_velocidade, 'Velocidade', 'v')}${notas(f.nota_qualidade, 'Qualidade', 'q')}
      <span class="tags">${(f.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</span></div>
    <div class="ficha-grade">${sec('largo', 'O que faz', f.o_que_faz)}${sec('bom', 'Melhor para', f.melhor_para)}${sec('ruim', 'Evite para', f.evite_para)}
      ${sec('', 'Tempo típico', f.tempo_tipico)}${sec('', 'Limites', f.limites)}${sec('dica', 'Dica de prompt', f.dica_prompt)}</div>
    <div class="janela-acoes">${podeUsar && id !== E.motor ? '<button type="button" class="gerar curto" data-usar>Usar esta IA</button>' : ''}
      <button type="button" class="bt-sec" data-fechar>Fechar</button></div></div>`);
  const usar = $('dlgFicha').querySelector('[data-usar]');
  if (usar) usar.onclick = () => { E.motor = id; aplicarMotor(); $('dlgFicha').close(); };
}
document.addEventListener('click', ev => { const b = ev.target.closest('[data-ficha]'); if (b) { ev.preventDefault(); abrirFicha(b.dataset.ficha); } });

/* ---------------------------------------------------------------- formulário */
const PRONTOS = Object.fromEntries((window.estilosProntos || []).map(p => [p.id, p]));
const GENEROS = {}, EXEMPLOS = {};
(function montarGeneros() {
  const sel = $('genero');
  sel.append(new Option('Personalizado (escreva abaixo)', 'custom'));
  const g1 = document.createElement('optgroup'); g1.label = 'Estilos prontos';
  for (const p of window.estilosProntos || []) g1.append(new Option(p.rotulo, p.id));
  const g2 = document.createElement('optgroup'); g2.label = 'Gêneros (dos exemplos do YuE2)';
  for (const g of window.generosMusica || []) {
    const id = 'yue2_' + g.valor.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    GENEROS[id] = g; g2.append(new Option(g.rotulo, id));
  }
  const rotuloGenero = Object.fromEntries((window.generosMusica || []).map(g => [g.valor, g.rotulo]));
  const g3 = document.createElement('optgroup'); g3.label = 'Exemplos completos (texto em inglês)';
  for (const x of window.yue2StyleExamples || []) {
    EXEMPLOS[x.id] = x;
    g3.append(new Option(`${rotuloGenero[x.genre] || x.genre} · exemplo ${x.id.replace('demo_', '')} · canção original em ${(window.idiomasExemplo || {})[x.language] || x.language}`, x.id));
  }
  sel.append(g1, g2, g3); sel.value = 'custom';
})();
function textoDoGenero(id) { return PRONTOS[id]?.texto || GENEROS[id]?.valor || EXEMPLOS[id]?.prompt || ''; }
const todosOsTextos = () => [...Object.values(PRONTOS).map(p => p.texto), ...Object.values(GENEROS).map(g => g.valor), ...Object.values(EXEMPLOS).map(x => x.prompt)];

function resumoPT(texto) {
  let resto = ' ' + texto.toLowerCase() + ' ';
  const achados = [], usados = new Set();
  const id = $('genero').value;
  if (GENEROS[id]) achados.push(GENEROS[id].rotulo.toLowerCase());
  else if (EXEMPLOS[id]) achados.push(((window.generosMusica || []).find(g => g.valor === EXEMPLOS[id].genre)?.rotulo || EXEMPLOS[id].genre).toLowerCase());
  const bpm = texto.match(/\b(\d{2,3})\s*bpm\b/i);
  if (bpm) achados.push(bpm[1] + ' BPM');
  const tom = texto.match(/\b([A-G])(#|b)?\s*(major|minor)\b/i);
  if (tom) achados.push(`tom de ${NOTAS_TOM[tom[1].toUpperCase()]}${tom[2] === '#' ? ' sustenido' : tom[2] ? ' bemol' : ''} ${tom[3].toLowerCase() === 'major' ? 'maior' : 'menor'}`);
  for (const [en, pt] of window.termosEstilo || []) {
    const alvo = en.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z0-9])${alvo}s?(?=[^a-z0-9]|$)`, 'i');
    if (re.test(resto)) {
      if (!usados.has(pt)) { achados.push(pt); usados.add(pt); }
      resto = resto.replace(new RegExp(`${alvo}s?`, 'gi'), ' ');
    }
    if (achados.length >= 14) break;
  }
  for (const [re, idioma] of window.idiomasCanto || []) if (re.test(texto)) { achados.push('canto em ' + idioma); break; }
  return achados;
}
let timerResumo = null;
function atualizarResumo() {
  clearTimeout(timerResumo);
  timerResumo = setTimeout(() => {
    const texto = $('estilo').value.trim(), caixa = $('resumoEstilo');
    if (!texto) { caixa.textContent = ''; return; }
    const itens = resumoPT(texto);
    const instr = $('voz').value === 'instrumental' ? ' No modo instrumental, as partes que pedem voz saem do texto automaticamente.' : '';
    caixa.innerHTML = itens.length ? `O que isso pede: <b>${esc(itens.join(' · '))}</b>.${esc(instr)}` : (instr ? esc(instr.trim()) : '');
  }, 250);
}
$('genero').onchange = async () => {
  const id = $('genero').value, novo = textoDoGenero(id);
  if (!novo) { atualizarResumo(); return; }
  const atual = $('estilo').value.trim().replace(/,\s*(?:male|female) vocals\s*$/i, '');
  if (atual && atual !== novo && !todosOsTextos().includes(atual)) {
    const ok = await confirmar('Trocar a descrição?', 'A descrição que você escreveu será trocada pelo estilo escolhido.', 'Trocar');
    if (!ok) { $('genero').value = 'custom'; return; }
  }
  $('estilo').value = novo; atualizarResumo(); sugerirEstilo();
};
$('estilo').addEventListener('input', () => { if ($('genero').value !== 'custom' && $('estilo').value.trim() !== textoDoGenero($('genero').value)) $('genero').value = 'custom'; atualizarResumo(); sugerirEstilo(); });

/* "Combina com" (28/09): enquanto digita o estilo, mostra estilos/instrumentos/clima/BPM parecidos; clicar acrescenta o termo
   (em inglês, que a IA entende melhor) no fim da descrição. Rótulo em português no botão. */
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function sugerirEstilo() {
  const caixa = $('sugEstilo'), dados = window.sugestoesEstilo;
  const texto = $('estilo').value;
  if (!caixa || !dados || !texto.trim()) { if (caixa) caixa.hidden = true; return; }
  const termos = texto.split(',').map(t => t.trim()).filter(Boolean);
  const ultimo = termos[termos.length - 1] || '';
  const ja = new Set(termos.map(semAcento));
  const vistos = new Set(), lista = [];
  const pega = ([valor, rotulo]) => {
    const k = semAcento(valor);
    if (ja.has(k) || vistos.has(k) || semAcento(texto).includes(k)) return;
    vistos.add(k); lista.push([valor, rotulo]);
  };
  // 1) famílias do último termo primeiro, depois as de qualquer termo já escrito
  const fams = dados.familias.filter(f => f.chave.test(ultimo)).concat(dados.familias.filter(f => termos.some(t => f.chave.test(t))));
  for (const f of fams) f.itens.forEach(pega);
  // 2) gêneros do YuE2 que contêm a palavra digitada (ex.: "pop" -> City pop, Country pop, Dance pop...)
  const palavra = semAcento(ultimo).split(/\s+/).filter(p => p.length >= 3).pop();
  if (palavra) for (const g of window.generosMusica || []) {
    const [valor, rotulo] = Array.isArray(g) ? g : [g.valor, g.rotulo];
    if (semAcento(valor).includes(palavra) || semAcento(rotulo).includes(palavra)) pega([valor.toLowerCase(), rotulo]);
  }
  if (!lista.length) dados.gerais.forEach(pega);
  const mostrar = lista.slice(0, 14);
  if (!mostrar.length) { caixa.hidden = true; return; }
  caixa.replaceChildren(el('span', 'sug-rot', 'Combina com:'));
  for (const [valor, rotulo] of mostrar) {
    const b = el('button', 'sug-chip', '+ ' + rotulo); b.type = 'button'; b.title = `Acrescenta “${valor}” na descrição`;
    b.onclick = () => {
      const atual = $('estilo').value.replace(/[\s,]+$/, '');
      $('estilo').value = atual ? `${atual}, ${valor}` : valor;
      $('estilo').dispatchEvent(new Event('input')); $('estilo').focus();
    };
    caixa.append(b);
  }
  caixa.hidden = false;
}
$('voz').onchange = () => { aplicarMotor(); atualizarResumo(); };
$('limparLetra').onclick = async () => {
  if ($('letra').value.trim() && !await confirmar('Limpar a letra?', 'Só limpa este formulário; as músicas já geradas não mudam.', 'Limpar')) return;
  $('letra').value = ''; $('letra').focus();
};
function atualizarSliders() {
  const pct = input => Math.round(100 * (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)));
  $('criatividadeValor').value = pct($('criatividade')) + '%';
  $('orientacaoTextoValor').value = pct($('orientacaoTexto')) + '%';
  $('influenciaValor').value = Math.round(Number($('influencia').value) * 100) + '%';
  $('proximidadeValor').value = Math.round(Number($('proximidade').value) * 100) + '%';
  $('refForcaValor').value = Math.round(Number($('refForca').value) * 100) + '%';
  $('fidelidadeValor').value = num($('fidelidade').value);
}
for (const id of ['criatividade', 'orientacaoTexto', 'influencia', 'proximidade', 'refForca', 'fidelidade']) $(id).addEventListener('input', atualizarSliders);
$('planejamento').onchange = () => aplicarMotor();
$('trecho').onchange = () => { const inteira = $('trecho').value === 'full'; $('inicio').disabled = inteira; if (inteira) $('inicio').value = 0; };

function definirModo(modo) {
  E.modo = modo;
  if (modo === 'cover' && !algumaFazCover()) modo = E.modo = 'create';
  if (modo === 'cover' && !fazCover(E.motor)) E.motor = motorPadrao(true);
  aplicarMotor();
}
$('modoCriar').onclick = () => definirModo('create');
$('modoCover').onclick = () => definirModo('cover');

function aplicarMotor() {
  if (E.ordem.length && (!E.fichas[E.motor] || !motoresDaTela().includes(E.motor))) E.motor = motorPadrao(E.modo === 'cover');
  if (E.modo === 'cover' && !algumaFazCover()) E.modo = 'create';
  const m = E.motor, cover = E.modo === 'cover';
  $('modoCover').hidden = !algumaFazCover();  // nenhuma IA desta máquina faz cover: o botão nem aparece
  const ace = m === 'ace-step-official', yue = m === 'yue2-int8', xl = XL.has(m), mm3 = m === 'minimax-music3', sa3 = m === 'stable-audio3';
  const treblo = m === TREBLO, musicful = m === MUSICFUL;
  $('modoCriar').setAttribute('aria-pressed', String(!cover)); $('modoCover').setAttribute('aria-pressed', String(cover));
  $('modoNota').textContent = cover
    ? `Recria uma música a partir de um áudio seu, no estilo que você descrever. Aqui quem faz cover: ${listaDeNomes(motoresDaTela().filter(fazCover))}.`
    : 'Cria uma música nova a partir do estilo e da letra.';
  $('blocoReferencia').hidden = !cover; $('passoEstilo').textContent = cover ? '4' : '3';
  // Música de referência (estilo por áudio): só em "Criar música" e só nos motores do ACE-Step 1.5.
  const refPode = !cover && MOTORES_REF.has(m), comRef = refPode && !!E.refEstilo;
  // a Musicful não usa música de referência; e sem nenhuma IA que aceite (o pacote só com YuE2 e Stable Audio), o bloco some
  $('blocoRefEstilo').hidden = cover || musicful || !algumaAceitaRef();
  $('refEstiloConteudo').hidden = !refPode;
  $('refSemSuporte').hidden = refPode;
  $('refSemSuporte').textContent = refPode ? '' : `${nomeIa(m)} não aceita música de referência. Escolha o ${nomeIa('ace-step-official')} ou um dos ACE-Step 1.5 XL (Turbo ou SFT).`
    + (E.refEstilo ? ' A referência escolhida fica guardada para quando você voltar ao ACE-Step.' : '');
  $('refSelo').hidden = !E.refEstilo;
  $('notaRefMotor').textContent = !refPode ? '' : ace
    ? 'No ACE-Step Oficial a música sai com o tamanho do trecho da referência. Com referência, o planejamento musical fica desligado.'
    : 'No ACE-Step 1.5 XL a referência usa um recurso experimental da ComfyUI. Com referência, o planejamento musical fica desligado.';
  $('rotuloGenero').textContent = cover ? 'Estilo da nova versão' : 'Estilo musical';
  $('linhaOrientacao').hidden = !yue; $('linhaTrecho').hidden = !yue; $('linhaInfluencia').hidden = !ace;
  $('linhaFidelidade').hidden = !(treblo && cover);
  $('linhaVariacao').hidden = treblo || musicful;  // Treblo e Musicful não têm "variação" (semente)
  // Musicful: escolhe o modelo e não tem campo de duração (ela decide o tamanho da música)
  $('linhaModelo').hidden = !musicful; $('linhaDuracao').hidden = musicful;
  if (!yue) { $('trecho').value = 'full'; $('trecho').onchange(); }
  // O Stable Audio 3 não canta: a voz vai para Instrumental e VOLTA para a escolhida ao trocar de IA.
  if (sa3 && $('voz').value !== 'instrumental') { E.vozAntesSa3 = $('voz').value; $('voz').value = 'instrumental'; }
  else if (!sa3 && E.vozAntesSa3) { $('voz').value = E.vozAntesSa3; E.vozAntesSa3 = null; }
  $('voz').disabled = sa3;
  // O dono reprovou o instrumental do ACE-Step Oficial (24/09): nele a opção some e a voz volta para Masculina.
  const semInstr = ace && !sa3;
  $('voz').querySelector('[value=instrumental]').disabled = semInstr;
  $('voz').querySelector('[value=instrumental]').hidden = semInstr;
  if (semInstr && $('voz').value === 'instrumental') $('voz').value = 'male';
  $('notaVoz').hidden = !sa3 && !semInstr;
  $('notaVoz').textContent = semInstr ? `O ${nomeIa('ace-step-official')} não faz instrumental. Para instrumental, escolha outra IA da lista.`
    : !sa3 ? '' : `Voz em "Instrumental" porque o ${nomeIa('stable-audio3')} não canta.`
    + (E.vozAntesSa3 ? ` Ao escolher outra IA, a voz volta para "${E.vozAntesSa3 === 'female' ? 'Feminina' : 'Masculina'}".` : '');
  $('voz').querySelector('[value=instrumental]').textContent = yue ? 'Instrumental (experimental)' : 'Instrumental (sem voz)';
  const instrumental = $('voz').value === 'instrumental';
  $('blocoLetra').hidden = instrumental;
  $('notaLetraTreblo').hidden = !(treblo && cover);
  $('linhaTirarVoz').hidden = !instrumental || sa3 || !E.separador;  // "Tirar voz" precisa de um nó que pode não existir
  // Stable Audio 3: a IA de texto embutida na ComfyUI ficou desligada; quem melhora a descrição é o botão ✨.
  $('linhaPlanejamento').hidden = cover || mm3 || sa3 || comRef || treblo || musicful;
  $('textoPlanejamento').textContent = yue ? 'Planejar melodia e acordes' : 'Planejamento musical';
  $('notaPlanejamento').textContent = yue ? 'Compõe a partitura da melodia antes de cantar; o painel confere a partitura antes de sintetizar.'
    : 'Uma IA pequena pensa a estrutura da música antes de gerar.';
  $('rotuloDuracao').textContent = (yue || mm3) ? 'Duração máxima' : treblo ? 'Duração aproximada' : 'Duração';
  for (const o of $('duracao').options) {
    if (o.value === 'auto') { o.textContent = yue ? 'Automática (até 6 min)' : treblo ? 'Automática (a Treblo decide)' : (ace && cover) ? 'A do áudio original' : 'Padrão · 2 minutos'; continue; }
    const n = Number(o.value), base = n < 60 ? n + ' segundos' : (n / 60) + (n === 60 ? ' minuto' : ' minutos');
    o.textContent = (yue ? 'Até ' : treblo ? 'Cerca de ' : '') + base + (sa3 && n > 190 ? ' (máx. 3 min 10 s)' : '')
      + (treblo && cover && n > 180 ? ' (no cover, máx. 3 min)' : treblo && n > 300 ? ' (máx. 5 min)' : '');
  }
  $('linhaAce').hidden = !(ace || xl); $('linhaPassos').hidden = !ace; $('linhaBpm').hidden = !(ace || xl);
  $('linhaProximidade').hidden = !(ace && cover);
  $('linhaCriatividade').hidden = !(yue || (ace && !cover && !comRef && $('planejamento').checked));
  $('linhaOrientacaoTexto').hidden = !yue;
  $('avancado').hidden = [...$('avancado').querySelectorAll('.opcoes > div')].every(d => d.hidden);
  salvarLocal('motor', m);
  desenharMotores(); atualizarBotao();
  if (NUVEM[m]) pedirSaldo(m);
}
function atualizarBotao() {
  const rodando = E.jobs.some(j => j.state === 'running');
  // A IA de música fica em espera para economizar memória e o servidor liga sozinha ao gerar (garantir_servicos):
  // basta o painel responder. Só avisa quanto tempo a 1ª geração vai levar a mais.
  const pronto = E.painelOk;
  const emEspera = E.motor === 'ace-step-official' ? !E.aceOnline : !E.online;
  const faltaModelo = (E.faltam[E.motor] || []).length > 0;
  const treblo = E.motor === TREBLO, musicful = E.motor === MUSICFUL, saldo = E.saldos[E.motor];
  $('gerar').textContent = rodando ? 'Adicionar à fila' : (E.modo === 'cover' ? 'Gerar cover' : 'Gerar música');
  $('gerar').disabled = E.enviando || !pronto || E.teste;
  $('notaGerar').textContent = E.teste ? 'Modo de teste: gerar está desligado.'
    : !pronto ? 'Sem conexão com o painel de música.'
    : !E.motorInstalado ? 'O motor (ComfyUI) ainda não está instalado. Instale pelo Início do estúdio antes de gerar.'
    : faltaModelo ? `Falta baixar o modelo do ${nomeIa(E.motor)}. Abra o Início do estúdio e baixe essa IA na lista de IAs.`
    : !E.online && E.comfyRecado ? 'A ComfyUI não ligou: ' + E.comfyRecado
    : NUVEM[E.motor] && saldo && !saldo.tem_chave ? `${textoSaldo(E.motor)} para gerar com a ${NUVEM[E.motor].nome}.`
    : treblo ? `A Treblo gera na nuvem (não usa a placa nem espera o vídeo). Cada música usa ${CUSTO_TREBLO} créditos; o painel pergunta antes.`
    : musicful ? 'A Musicful gera na nuvem (não usa a placa nem espera o vídeo). Cada pedido usa 1 música do seu plano e costuma vir em 2 versões; o painel pergunta antes.'
    : emEspera ? 'A ComfyUI está desligada. Ao gerar, o painel pede ao estúdio para ligar (a 1ª música leva 1 a 2 min a mais).'
    : 'Uma geração por vez na placa: se uma imagem ou um vídeo estiver gerando, a música espera na fila.';
}

/* referência do cover */
async function desenharOnda(url) {
  const canvas = $('onda'), ctx = canvas.getContext('2d');
  const largura = Math.max(250, canvas.clientWidth), altura = 56;
  canvas.width = largura * 2; canvas.height = altura * 2; ctx.clearRect(0, 0, canvas.width, canvas.height);
  let audioCtx;
  try {
    audioCtx = new AudioContext();
    const bytes = await (await fetch(url)).arrayBuffer();
    const audio = await audioCtx.decodeAudioData(bytes);
    const dados = audio.getChannelData(0), barras = Math.floor(largura / 3), passo = Math.max(1, Math.floor(dados.length / barras));
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--c-musica').trim() || '#34d399';
    for (let i = 0; i < barras; i++) {
      let pico = 0; for (let j = i * passo; j < Math.min((i + 1) * passo, dados.length); j += 8) pico = Math.max(pico, Math.abs(dados[j]));
      const h = Math.max(3, pico * altura * 1.8); ctx.fillRect(i * 6, altura - h / 2, 3, h);
    }
  } catch { ctx.clearRect(0, 0, canvas.width, canvas.height); } finally { if (audioCtx) audioCtx.close(); }
}
function definirReferencia(item) {
  E.referencia = item.name; $('nomeReferencia').textContent = item.label;
  $('playerReferencia').src = item.url; $('playerReferencia').hidden = false; desenharOnda(item.url);
}
$('arquivo').addEventListener('change', async () => {
  const arquivo = $('arquivo').files[0]; if (!arquivo) return; erro();
  if (arquivo.size > 100 * 1024 * 1024) { erro('Escolha um áudio de até 100 MB.'); return; }
  E.enviando = true; atualizarBotao(); $('nomeReferencia').innerHTML = '<span class="carregando"></span> Enviando o áudio…';
  try { const d = new FormData(); d.append('file', arquivo); definirReferencia(await api('upload', {method: 'POST', body: d})); }
  catch (e) { erro(e.message, e.tecnico); $('nomeReferencia').textContent = 'Não deu para enviar o áudio.'; }
  finally { E.enviando = false; $('arquivo').value = ''; atualizarBotao(); }
});

/* ---------------------------------------------------------------- música de referência (estilo por áudio, sem treinar) */
function refAtiva() { return E.modo === 'create' && MOTORES_REF.has(E.motor) && !!E.refEstilo && !document.body.classList.contains('servidor-antigo'); }
function definirRefEstilo(item) {
  E.refEstilo = item ? {name: item.name, label: item.label || 'Música de referência', url: item.url} : null;
  $('refEscolhida').hidden = !item;
  $('nomeRefEstilo').textContent = item ? E.refEstilo.label : '';
  const player = $('playerRefEstilo');
  if (item) { player.src = item.url; player.hidden = false; }
  else { player.pause(); player.removeAttribute('src'); player.load(); player.hidden = true; }
  aplicarMotor();
}
$('arquivoRefEstilo').addEventListener('change', async () => {
  const arquivo = $('arquivoRefEstilo').files[0]; if (!arquivo) return; erro();
  if (arquivo.size > 100 * 1024 * 1024) { erro('Escolha um áudio de até 100 MB.'); $('arquivoRefEstilo').value = ''; return; }
  const anterior = E.refEstilo;
  E.enviando = true; atualizarBotao();
  $('refEscolhida').hidden = false; $('nomeRefEstilo').innerHTML = '<span class="carregando"></span> Enviando a música…';
  try { const d = new FormData(); d.append('file', arquivo); const r = await api('upload', {method: 'POST', body: d}); definirRefEstilo(r); }
  catch (e) { erro(e.message, e.tecnico); definirRefEstilo(anterior); }
  finally { E.enviando = false; $('arquivoRefEstilo').value = ''; atualizarBotao(); }
});
$('tirarRefEstilo').onclick = () => definirRefEstilo(null);
async function usarComoReferencia(job, b) {
  b.disabled = true;
  try {
    const r = await postar('referencia-da-biblioteca/' + encodeURIComponent(job.id));
    let trocou = false;
    if (E.modo !== 'create') E.modo = 'create';
    if (!MOTORES_REF.has(E.motor)) { E.motor = motoresDaTela().find(id => MOTORES_REF.has(id)) || E.motor; trocou = true; }
    definirRefEstilo(r);
    $('detRefEstilo').open = true;
    $('blocoRefEstilo').scrollIntoView({behavior: 'smooth', block: 'center'});
    aviso(`"${job.title}" virou a música de referência.` + (trocou ? ` A IA mudou para ${nomeIa(E.motor)} (só o ACE-Step aceita referência).` : ''));
  } catch (e) { aviso(e.message, 'erro'); }
  finally { b.disabled = false; }
}

/* ---------------------------------------------------------------- IA de texto (fica no Estúdio): letra e descrição do estilo */
const CAMPOS_TEXTO = {
  letra: {caixa: 'letra', barra: 'barraLetra', feito: 'Letra escrita', rodando: 'Escrevendo a letra'},
  estilo: {caixa: 'estilo', barra: 'barraEstilo', feito: 'Descrição melhorada', rodando: 'Melhorando a descrição'}
};
const nomeModeloTexto = modelo => ({rapido: 'IA rápida', principal: 'IA principal'}[modelo] || (modelo ? 'IA ' + modelo : 'IA de texto'));
const ondeTexto = onde => ({placa: 'na placa de vídeo', processador: 'no processador'}[onde] || '');
function botoesTexto() { $('escreverLetra').disabled = $('melhorarEstilo').disabled = !!E.textoAtivo; }
function barraTexto(campo, {texto = '', classe = '', tecnico = '', acoes = []} = {}) {
  const barra = $(CAMPOS_TEXTO[campo].barra);
  barra.className = 'ia-barra' + (classe ? ' ' + classe : ''); barra.replaceChildren();
  if (!texto) { barra.hidden = true; return null; }
  const t = el('span', 'ia-barra-txt');
  if (classe === 'rodando') t.innerHTML = '<span class="carregando"></span> ';
  const frase = el('span', '', texto); t.append(frase); barra.append(t);
  if (acoes.length) {
    const bts = el('span', 'ia-barra-bts');
    for (const [rotulo, fazer] of acoes) { const b = el('button', 'link', rotulo); b.type = 'button'; b.onclick = fazer; bts.append(b); }
    barra.append(bts);
  }
  if (tecnico) { const d = el('details', 'tecnico'); d.append(el('summary', '', 'Detalhe técnico'), el('pre', '', tecnico)); barra.append(d); }
  barra.hidden = false;
  return frase;
}
function acoesDepois(campo) {
  const acoes = [['Outra versão', () => campo === 'letra' ? escreverLetra(true) : melhorarEstilo(true)]];
  if (E.desfazer[campo].length) acoes.push(['Desfazer', () => desfazerTexto(campo)]);
  return acoes;
}
function desfazerTexto(campo) {
  const pilha = E.desfazer[campo]; if (!pilha.length) return;
  $(CAMPOS_TEXTO[campo].caixa).value = pilha.pop();
  if (campo === 'estilo') { $('genero').value = 'custom'; atualizarResumo(); }
  barraTexto(campo, {texto: 'Voltou o texto de antes.', acoes: acoesDepois(campo)});
}
async function rodarTexto(campo, pedido) {
  if (E.textoAtivo) return;
  const cfg = CAMPOS_TEXTO[campo], controle = new AbortController(), inicio = Date.now();
  E.textoAtivo = {campo, controle}; botoesTexto();
  const frase = barraTexto(campo, {texto: cfg.rodando + '…', classe: 'rodando', acoes: [['Cancelar', () => controle.abort()]]});
  const relogio = setInterval(() => {
    const s = Math.round((Date.now() - inicio) / 1000);
    frase.textContent = `${cfg.rodando}… ${duracaoTexto(s)}` + (s >= 15 ? ' · a primeira vez demora mais: a IA carrega do HD' : '');
  }, 1000);
  try {
    const r = await api('texto', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(pedido), signal: controle.signal});
    const caixa = $(cfg.caixa);
    E.desfazer[campo].push(caixa.value); if (E.desfazer[campo].length > 20) E.desfazer[campo].shift();
    caixa.value = r.texto;
    if (campo === 'estilo') { $('genero').value = 'custom'; atualizarResumo(); }
    const onde = ondeTexto(r.onde), seg = Number(r.segundos);
    barraTexto(campo, {texto: `${cfg.feito} pela ${nomeModeloTexto(r.modelo)}${onde ? ' ' + onde : ''}${seg > 0 ? ' em ' + duracaoTexto(seg) : ''}. Confira e ajuste se quiser.`,
      acoes: acoesDepois(campo)});
  } catch (e) {
    if (e?.name === 'AbortError') barraTexto(campo, {texto: 'Pedido cancelado. O texto da caixa não mudou.', acoes: E.desfazer[campo].length ? [['Desfazer', () => desfazerTexto(campo)]] : []});
    else barraTexto(campo, {texto: e.message, classe: 'erro', tecnico: e.tecnico});
  } finally { clearInterval(relogio); E.textoAtivo = null; botoesTexto(); }
}
function abrirPedidoLetra() {
  const u = E.pedidoLetra || {};
  const estiloAtual = $('estilo').value.trim().replace(/,\s*(?:male|female) vocals\s*$/i, '').slice(0, 600);
  const dlg = $('dlgLetra');
  abrirJanela(dlg, `<form class="janela-corpo" id="formLetra" novalidate>
    <div class="janela-cab"><div><h2 id="letraTitulo">✍️ Escrever letra com IA</h2>
      <p class="fraco">A IA de texto do estúdio escreve a letra e ela vai para a caixa de letra. Depois dá para pedir outra versão ou desfazer.</p></div>
      <button type="button" class="ic-bt" data-fechar aria-label="Fechar">${ic('fechar')}</button></div>
    <div><label class="rotulo" for="letraTema">Tema <span class="rotulo-dica">sobre o que é a música</span></label>
      <textarea id="letraTema" rows="3" maxlength="1500" placeholder="Ex.: saudade da cidade natal; esperança depois de um ano difícil; um amor que venceu a distância"></textarea></div>
    <div><label class="rotulo" for="letraEstilo">Estilo <span class="rotulo-dica">veio da descrição do estilo; pode mudar</span></label>
      <textarea id="letraEstilo" rows="2" maxlength="600" placeholder="Ex.: sertanejo romântico, rock anos 80, worship"></textarea></div>
    <div class="duas">
      <div><label class="rotulo" for="letraIdioma">Idioma</label>
        <select id="letraIdioma"><option value="pt">Português (Brasil)</option><option value="en">Inglês</option><option value="es">Espanhol</option></select></div>
      <div><label class="rotulo" for="letraModelo">IA de texto</label>
        <select id="letraModelo"><option value="principal">Caprichada (IA principal)</option><option value="rapido">Rápida (IA menor)</option></select></div>
    </div>
    <p class="nota">Se a placa estiver ocupada com uma geração, o estúdio escreve no processador com a IA rápida, sem atrapalhar. A primeira vez pode demorar mais: a IA carrega do HD.</p>
    <p class="erro-form" id="letraErro" role="alert" hidden></p>
    <div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Cancelar</button><button type="submit" class="gerar curto">Escrever a letra</button></div>
  </form>`);
  $('letraTema').value = u.tema || '';
  $('letraEstilo').value = estiloAtual || u.estilo || '';
  $('letraIdioma').value = u.idioma || $('idiomaLetra').value || 'pt';
  $('letraModelo').value = u.modelo || 'principal';
  $('formLetra').onsubmit = ev => {
    ev.preventDefault();
    const tema = $('letraTema').value.trim();
    if (!tema) { const caixa = $('letraErro'); caixa.textContent = 'Escreva o tema da música (sobre o que ela fala).'; caixa.hidden = false; $('letraTema').focus(); return; }
    E.pedidoLetra = {tema, estilo: $('letraEstilo').value.trim(), idioma: $('letraIdioma').value, modelo: $('letraModelo').value};
    E.variacaoLetra = 0;
    $('idiomaLetra').value = E.pedidoLetra.idioma;
    dlg.close(); escreverLetra(false);
  };
  setTimeout(() => $('letraTema').focus(), 50);
}
function escreverLetra(outra) {
  const p = E.pedidoLetra; if (!p) { abrirPedidoLetra(); return; }
  if (outra) E.variacaoLetra += 1;
  const contexto = {idioma: IDIOMAS_TEXTO[p.idioma] || 'pt-BR', ia: E.motor};
  if (p.estilo) contexto.estilo = p.estilo;
  const entrada = p.tema + (outra ? `\n\n(Quero outra versão, diferente das anteriores. Variação ${E.variacaoLetra}.)` : '');
  rodarTexto('letra', {tarefa: 'letra', entrada, contexto, modelo: p.modelo});
}
function melhorarEstilo(outra) {
  const atual = $('estilo').value.trim().replace(/,\s*(?:male|female) vocals\s*$/i, '');
  const base = outra && E.pedidoEstilo ? E.pedidoEstilo.base : atual;
  if (!base) {
    barraTexto('estilo', {texto: 'Escreva algumas palavras do estilo primeiro (ex.: rock anos 80, guitarra distorcida, voz rouca) e toque em Melhorar.', classe: 'erro'});
    $('estilo').focus(); return;
  }
  E.pedidoEstilo = {base};
  const contexto = {ia: E.motor};
  if ($('voz').value === 'instrumental' || E.motor === 'stable-audio3') contexto.instrumental = true;
  rodarTexto('estilo', {tarefa: 'melhorar_prompt', entrada: base, contexto});
}
$('escreverLetra').onclick = () => abrirPedidoLetra();
$('melhorarEstilo').onclick = () => melhorarEstilo(false);

$('form').onsubmit = async ev => {
  ev.preventDefault(); erro();
  if (E.enviando) return;
  const cover = E.modo === 'cover';
  if (cover && !E.referencia) { erro('Escolha o áudio de referência.'); return; }
  const voz = $('voz').value, instrumental = voz === 'instrumental';
  const base = $('estilo').value.trim().replace(/,\s*(?:male|female) vocals\s*$/i, '');
  if (!base) { erro('Descreva o estilo musical (ou escolha um estilo pronto).'); $('estilo').focus(); return; }
  const treblo = E.motor === TREBLO;
  // no cover da Treblo a letra é opcional (sem letra, ela escreve uma letra nova)
  if (!instrumental && !$('letra').value.trim() && !(treblo && cover)) { erro('Escreva a letra ou escolha "Instrumental" na voz.'); $('letra').focus(); return; }
  const musicful = E.motor === MUSICFUL, nuvem = NUVEM[E.motor];
  if (nuvem && E.saldos[E.motor] && !E.saldos[E.motor].tem_chave) { erro(textoSaldo(E.motor) + '.'); return; }
  if (treblo && !await confirmar('Gerar com a Treblo (paga)?', `Isso usa ${CUSTO_TREBLO} créditos da Treblo. Continuar?`, 'Continuar')) return;
  if (musicful && !await confirmar('Gerar com a Musicful (paga)?', 'Isso usa 1 música do seu plano Musicful. Continuar?', 'Continuar')) return;
  if ($('variacao').value === 'new') E.seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const dados = {
    mode: E.modo, engine: E.motor, title: $('titulo').value.trim(),
    style: base + (voz === 'female' ? ', female vocals' : voz === 'male' ? ', male vocals' : ''),
    lyrics: $('letra').value, genre: $('genero').value, voice: voz, seed: E.seed,
    duration: musicful || $('duracao').value === 'auto' ? 'auto' : Number($('duracao').value),
    reference: E.referencia, start: Number($('inicio').value) || 0,
    reference_duration: $('trecho').value === 'full' ? 'full' : Number($('trecho').value), reference_mode: $('orientacao').value,
    planning: $('planejamento').checked, instrumental, remove_vocals: E.separador && instrumental && $('tirarVoz').checked && E.motor !== 'stable-audio3',
    fade_out: $('finalSuave').checked, cover_strength: Number($('influencia').value), cover_noise: Number($('proximidade').value),
    ace_steps: Number($('passos').value), bpm: $('bpm').value || null,
    temperature: Number($('criatividade').value), guidance: Number($('orientacaoTexto').value),
    idioma: $('idiomaLetra').value,
    referencia_estilo: refAtiva() ? E.refEstilo.name : null,
    referencia_forca: Number($('refForca').value), referencia_inicio: Number($('refInicio').value) || 0,
    treblo_fidelidade: Number($('fidelidade').value),
    ...(musicful ? {musicful_modelo: $('modeloMusicful').value} : {})
  };
  if (dados.reference_duration === 'full') dados.start = 0;
  E.enviando = true; atualizarBotao();
  try {
    await postar('generate', dados);
    aviso(nuvem ? `Música enviada para a ${nuvem.nome} (nuvem).` : 'Música enviada para a fila.');
    if (nuvem) E.saldoEm[E.motor] = 0;
    await atualizar();
  }
  catch (e) { erro(e.message, e.tecnico); }
  finally { E.enviando = false; atualizarBotao(); }
};

/* ---------------------------------------------------------------- biblioteca */
function tipoDe(job) {
  const s = job.settings || {};
  if (job.mode === 'cover') return 'Cover';
  if (s.instrumental || s.engine === 'stable-audio3' || s.engine === 'separador') return 'Instrumental';
  return 'Com voz';
}
const estiloDe = job => (job.settings?.style_original ?? job.settings?.style ?? '').trim();
// 02/11/2026: os filtros viraram grupos de pilulas; o valor e o botao com aria-pressed=true
function valorChips(id) {
  const b = $(id).querySelector('button[aria-pressed="true"]');
  return b ? (b.dataset.v || '') : '';
}
function escolherChip(grupo, bt) {
  [...grupo.querySelectorAll('button')].forEach(x => x.setAttribute('aria-pressed', String(x === bt)));
}
function visiveis() {
  const q = $('busca').value.trim().toLocaleLowerCase('pt-BR'), tipo = valorChips('filtroTipo'), ia = valorChips('filtroIa');
  return E.jobs.filter(j => j.state !== 'running' && !j.deleted_at).filter(j => {
    if (ia && j.motor_nome !== ia) return false;
    if (tipo === 'favoritas') { if (!j.favorito) return false; }
    else if (tipo === 'erro') { if (j.state !== 'error') return false; }
    else if (tipo === 'cover') { if (j.mode !== 'cover') return false; }
    else if (tipo === 'instrumental') { if (tipoDe(j) !== 'Instrumental') return false; }
    else if (tipo === 'voz') { if (tipoDe(j) !== 'Com voz') return false; }
    if (!q) return true;
    return `${j.title} ${estiloDe(j)} ${j.motor_nome} ${j.motor_detalhe || ''}`.toLocaleLowerCase('pt-BR').includes(q);
  });
}
function atualizarFiltroIa() {
  const grupo = $('filtroIa'), atual = valorChips('filtroIa');
  const prontas = E.jobs.filter(j => !j.deleted_at && j.state !== 'running');
  const conta = new Map();
  prontas.forEach(j => conta.set(j.motor_nome, (conta.get(j.motor_nome) || 0) + 1));
  const nomes = [...conta.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const chave = nomes.map(n => n + ':' + conta.get(n)).join('|');
  if (grupo.dataset.chave === chave) return;
  grupo.dataset.chave = chave;
  const fica = nomes.includes(atual) ? atual : '';
  const bt = (v, rot, n, cls) => {
    const b = el('button', cls || '');
    b.type = 'button';
    b.dataset.v = v;
    b.setAttribute('aria-pressed', String(v === fica));
    b.innerHTML = esc(rot) + (n != null ? ` <span>${n}</span>` : '');
    return b;
  };
  grupo.replaceChildren(bt('', 'Todas as IAs', prontas.length, 'todas'),
                        ...nomes.map(n => bt(n, n, conta.get(n))));
}
function selo(job) {
  const s = el('span', 'selo' + (job.motor_id === 'acemusic-nuvem' ? ' antigo' : ''));
  s.title = 'IA que gerou: ' + job.motor_nome; s.innerHTML = `<span>${esc(job.motor_nome)}</span>`;
  return s;
}
/* Ajustes usados na música (27/09): os mesmos números dos "Ajustes avançados", só os que aquela IA usa.
   Devolve [rótulo, valor]; o cartão mostra a versão curta e a janela de detalhes a completa. */
function ajustesDe(job, completo = false) {
  const s = job.settings || {}, m = s.engine, cover = job.mode === 'cover', lista = [];
  if (s.eq) lista.push(...ajustesEq(s.eq, completo));  // cópia do Equalizador: primeiro, para caber no cartão
  const pctFaixa = (v, min, max) => Math.round(100 * (Number(v) - min) / (max - min)) + '%';
  const tem = v => v !== undefined && v !== null && v !== '';
  // voz (28/09): Masculina / Feminina / Instrumental — primeiro chip, em todos os motores
  const semVoz = s.instrumental || m === 'separador' || m === 'stable-audio3' || job.voz_removida
    || String(job.motor_detalhe || '').startsWith('Voz removida');
  if (semVoz) lista.push(['Voz', 'Instrumental']);
  else if (s.voice === 'female' || s.voice === 'male') lista.push(['Voz', s.voice === 'female' ? 'Feminina' : 'Masculina']);
  if (m === 'yue2-int8') {
    // cover: "Seguir da referência" primeiro, para aparecer no cartão (28/09: comparar qual ficou melhor)
    if (cover) lista.push(['Seguir da referência', s.reference_mode === 'full' ? 'Melodia e acordes' : 'Só a melodia']);
    if (tem(s.temperature)) lista.push(['Criatividade', pctFaixa(s.temperature, 0.7, 1.2)]);
    if (tem(s.guidance)) lista.push(['Influência do estilo e da letra', pctFaixa(s.guidance, 1, 1.5)]);
    if (cover) {
      lista.push(['Trecho da referência', !s.reference_duration || s.reference_duration === 'full' ? 'Música inteira'
        : `${num(s.reference_duration, 0)} s a partir de ${num(s.start || 0, 0)} s`]);
    } else if (tem(s.planning)) lista.push(['Planejamento musical', s.planning ? 'Ligado' : 'Desligado']);
  } else if (m === 'ace-step-official') {
    if (tem(s.ace_steps)) lista.push(['Passos', num(s.ace_steps, 0)]);
    if (cover) {
      if (tem(s.cover_strength)) lista.push(['Influência do áudio', Math.round(Number(s.cover_strength) * 100) + '%']);
      if (tem(s.cover_noise)) lista.push(['Proximidade sonora', Math.round(Number(s.cover_noise) * 100) + '%']);
    } else {
      if (tem(s.planning)) lista.push(['Planejamento musical', s.planning ? 'Ligado' : 'Desligado']);
      if (s.planning && tem(s.temperature)) lista.push(['Criatividade', pctFaixa(s.temperature, 0.7, 1.2)]);
    }
  } else if (m === TREBLO) {
    if (cover) lista.push(['Fidelidade ao original', num(s.treblo_fidelidade ?? 3) + ' de 5']);
  } else if (m === MUSICFUL) {
    lista.push(['Modelo', s.musicful_modelo || 'MFV3.0']);
  }
  if (tem(s.bpm)) lista.push(['BPM', String(s.bpm)]);
  return lista;
}
const NOMES_FAIXA_EQ = {sub: 'Sub', graves: 'Graves', medios_graves: 'Médios-graves', medios: 'Médios', presenca: 'Presença', brilho: 'Brilho'};
const dbTexto = (v, casas = 1) => (Number(v) > 0 ? '+' : '') + num(v, casas) + ' dB';
/* Ajustes do Equalizador guardados na cópia (settings.eq): o cartão mostra "EQ Rock/Metal · -11 LUFS"; a janela de
   detalhes mostra tudo. */
function ajustesEq(e, completo) {
  const lista = [['EQ', e.resumo || 'Equalizada']];
  if (!completo) return lista;
  const faixas = Object.entries(e.eq || {}).filter(([, v]) => Math.abs(Number(v)) >= 0.05).map(([k, v]) => `${NOMES_FAIXA_EQ[k] || k} ${dbTexto(v)}`);
  const c = e.compressor || {}, l = e.limitador || {};
  lista.push(['Faixas do EQ', faixas.length ? faixas.join(' · ') : 'Sem mudança no timbre'],
    ['Corte de graves', num(e.corte_graves_hz ?? 20, 0) + ' Hz'],
    ['Compressor', c.ligado ? `limiar ${num(c.limiar_db)} dB · ${num(c.razao)}:1 · ataque ${num(c.ataque_ms, 0)} ms · liberação ${num(c.liberacao_ms, 0)} ms` : 'Desligado'],
    ['Largura estéreo', num(e.largura_pct ?? 100, 0) + '%']);
  if (Number(e.ganho_db)) lista.push(['Ganho extra', dbTexto(e.ganho_db)]);
  lista.push(['Volume alvo', e.lufs_alvo == null ? 'Sem normalizar (volume original)' : num(e.lufs_alvo, 0) + ' LUFS']);
  if (e.lufs_final != null) lista.push(['Volume final', `${num(e.lufs_final)} LUFS` + (e.lufs_original != null ? ` (a original tinha ${num(e.lufs_original)} LUFS)` : '')]);
  lista.push(['Limitador', l.ligado ? `teto ${num(l.teto_db)} dBTP` : 'Desligado']);
  return lista;
}
const CURTO = {'Influência do estilo e da letra': 'Influência', 'Trecho da referência': 'Trecho', 'Planejamento musical': 'Planejamento',
  'Influência do áudio': 'Influência', 'Proximidade sonora': 'Proximidade', 'Fidelidade ao original': 'Fidelidade',
  'Completa (melodia e harmonia)': 'Completa', 'Seguir da referência': 'Cover'};
function linhaAjustes(job) {
  const lista = ajustesDe(job);
  if (!lista.length) return null;
  const p = el('p', 'mc-ajustes');
  p.innerHTML = lista.map(([k, v]) => `<span><b>${esc(CURTO[k] || k)}</b> ${esc(CURTO[v] || v)}</span>`).join('');
  p.title = lista.map(([k, v]) => `${k}: ${v}`).join('\n');
  return p;
}
function linhaMeta(job) {
  const partes = [data(job.created)];
  if (job.duracao_s) partes.push(tempo(job.duracao_s));
  if (job.elapsed) partes.push('gerada em ' + duracaoTexto(job.elapsed));
  return partes.join(' · ');
}
/* favoritos (27/09): estrela no cartão; fica guardado no jobs.json e aparece no filtro "★ Favoritas" */
function botaoFavorito(job) {
  const b = el('button', 'fav-bt' + (job.favorito ? ' on' : '')); b.type = 'button';
  const rotulo = () => job.favorito ? 'Tirar dos favoritos' : 'Marcar como favorita';
  b.textContent = job.favorito ? '★' : '☆'; b.title = rotulo(); b.setAttribute('aria-label', rotulo());
  b.setAttribute('aria-pressed', String(!!job.favorito));
  b.onclick = async ev => {
    ev.stopPropagation(); b.disabled = true;
    const novo = !job.favorito;
    try {
      await api('favorito/' + encodeURIComponent(job.id), {method: 'POST', headers: {'Content-Type': 'application/json'},
                                                           body: JSON.stringify({favorito: novo})});
      job.favorito = novo || undefined;
      for (const j of E.jobs) if (j.id === job.id) j.favorito = novo || undefined;
      aviso(novo ? '★ Adicionada aos favoritos.' : 'Tirada dos favoritos.');
      desenharBiblioteca(true);
    } catch (e) { erro(e.message); b.disabled = false; }
  };
  return b;
}
/* renomear (27/09): lápis ao lado do nome; Enter salva, Esc cancela. Só muda o nome no painel (e no arquivo baixado) */
function botaoRenomear(job, linha, nome) {
  const b = el('button', 'ic-bt renomear-bt'); b.type = 'button'; b.innerHTML = ic('editar');
  b.title = 'Editar o nome'; b.setAttribute('aria-label', 'Editar o nome de ' + job.title);
  b.onclick = ev => {
    ev.stopPropagation();
    const campo = el('input', 'renomear-campo'); campo.type = 'text'; campo.maxLength = 120; campo.value = job.title;
    campo.setAttribute('aria-label', 'Novo nome da música');
    let feito = false;
    const voltar = () => { campo.replaceWith(nome); b.hidden = false; };
    const salvar = async () => {
      if (feito) return; feito = true;
      const novo = campo.value.replace(/\s+/g, ' ').trim();
      if (!novo || novo === job.title) { voltar(); return; }
      campo.disabled = true;
      try {
        const r = await api('renomear/' + encodeURIComponent(job.id), {method: 'POST', headers: {'Content-Type': 'application/json'},
                                                                        body: JSON.stringify({titulo: novo})});
        const final = r?.titulo || novo;
        job.title = final;
        for (const j of E.jobs) if (j.id === job.id) j.title = final;
        aviso('Nome trocado para “' + final + '”.');
        desenharBiblioteca(true);
      } catch (e) { erro(e.message); feito = false; campo.disabled = false; campo.focus(); }
    };
    campo.onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); salvar(); }
      else if (e.key === 'Escape') { e.preventDefault(); feito = true; voltar(); }
    };
    campo.onblur = () => { if (!feito) salvar(); };
    campo.onclick = e => e.stopPropagation();
    nome.replaceWith(campo); b.hidden = true; campo.focus(); campo.select();
  };
  return b;
}
function cardMusica(job) {
  const card = el('article', 'mcard' + (job.state === 'error' ? ' falhou' : '') + (E.tocando === job.id ? ' tocando' : ''));
  card.dataset.id = job.id;
  const topo = el('div', 'mc-topo'); topo.append(selo(job), el('span', 'tag', job.state === 'error' ? 'Com erro' : tipoDe(job)));
  if (job.state === 'done') topo.append(botaoFavorito(job));
  const cab = el('div', 'mc-cab');
  if (job.state === 'done') {
    const tocar = el('button', 'ic-bt grande mc-play'); tocar.type = 'button';
    const tocandoEste = E.tocando === job.id && !$('audio').paused;
    tocar.innerHTML = ic(tocandoEste ? 'pausar' : 'tocar'); tocar.title = tocandoEste ? 'Pausar' : 'Ouvir ' + job.title;
    tocar.setAttribute('aria-label', tocar.title); tocar.onclick = () => alternar(job);
    cab.append(tocar);
  }
  const titulo = el('h3', 'mc-titulo');
  const nome = el('span', 'mc-nome', job.title); nome.title = job.title;
  const linhaNome = el('span', 'mc-linha-nome'); linhaNome.append(nome);
  if (job.state === 'done' || job.state === 'error') linhaNome.append(botaoRenomear(job, linhaNome, nome));
  const sub = el('small', '', linhaMeta(job)); titulo.append(linhaNome, sub); cab.append(titulo);
  card.append(topo, cab);
  if (job.motor_detalhe) card.append(el('p', 'mc-detalhe', job.motor_detalhe));
  if (job.settings?.referencia_estilo) card.append(el('p', 'mc-detalhe', `Com música de referência · força ${Math.round(Number(job.settings.referencia_forca ?? 0.3) * 100)}%`));
  const estilo = estiloDe(job); if (estilo) { const p = el('p', 'mc-estilo', estilo); p.title = estilo; card.append(p); }
  const ajustes = linhaAjustes(job); if (ajustes) card.append(ajustes);
  if (job.state === 'error') {
    card.append(el('p', 'falha', job.error || 'A geração falhou.'));
    if (job.erro_tecnico) { const d = el('details', 'tecnico'); d.append(el('summary', '', 'Detalhe técnico'), el('pre', '', job.erro_tecnico)); card.append(d); }
  }
  if (job.finish_warning) card.append(el('p', 'aviso', job.finish_warning));
  const acoes = el('div', 'mc-acoes');
  if (job.state === 'done') {
    // Baixar: menu com MP3 (320 kbps), WAV (sem perda) e o arquivo original (o servidor converte na hora)
    const base = `/api/audio/${encodeURIComponent(job.id)}?baixar=1`;
    const nome = `${job.title} - ${job.motor_nome}`.replace(/[\\/:*?"<>|]+/g, ' ');
    const ext = ((job.audio?.[0]?.filename || '').split('.').pop() || 'flac').toLowerCase();
    const menu = el('details', 'baixar-menu');
    menu.innerHTML = `<summary class="bt-fantasma" title="Baixar a música">${ic('baixar')}<span>Baixar</span></summary>
      <div class="baixar-opcoes" role="menu">
        <a role="menuitem" href="${base}&formato=mp3" download="${esc(nome)}.mp3">MP3 <small>320 kbps · menor</small></a>
        <a role="menuitem" href="${base}&formato=wav" download="${esc(nome)}.wav">WAV <small>sem perda · maior</small></a>
        ${ext === 'mp3' || ext === 'wav' ? '' : `<a role="menuitem" href="${base}" download="${esc(nome)}.${esc(ext)}">Original <small>${esc(ext.toUpperCase())} · sem perda</small></a>`}
      </div>`;
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { setTimeout(() => { menu.open = false; }, 150); }));
    acoes.append(menu);
  }
  const detalhes = botao('bt-fantasma', 'letra', 'Letra e detalhes'); detalhes.onclick = () => abrirDetalhe(job); acoes.append(detalhes);
  if (job.settings?.engine !== 'separador') { const r = botao('bt-fantasma', 'reusar', 'Usar configurações'); r.onclick = () => usarConfig(job); acoes.append(r); }
  if (podeTirarVoz(job)) { const t = botao('bt-fantasma', 'semvoz', 'Tirar voz', 'Cria uma cópia só instrumental (separador MelBandRoFormer)'); t.onclick = () => tirarVoz(job, t); acoes.append(t); }
  if (job.state === 'done' && E.comEq) {
    const q = botao('bt-fantasma', 'eq', 'Equalizar', 'Equalizador: ouça antes e depois e, se gostar, salve como uma cópia (a original não muda)');
    q.onclick = () => abrirEqualizador(job); acoes.append(q);
  }
  if (job.state === 'done' && !E.teste && algumaAceitaRef()) {
    const r = botao('bt-fantasma novo-etapa1', 'onda', 'Usar como referência', 'Usar esta música como referência de estilo numa música nova (ACE-Step)');
    r.onclick = () => usarComoReferencia(job, r); acoes.append(r);
  }
  const apagar = botao('bt-fantasma perigo direita', 'apagar', '', 'Apagar do computador: ' + job.title); apagar.onclick = () => pedirApagar(job); acoes.append(apagar);
  card.append(acoes);
  return card;
}
const podeTirarVoz = job => E.separador && job.state === 'done' && !['separador', 'stable-audio3'].includes(job.settings?.engine) && !job.voz_removida
  && !String(job.motor_detalhe || '').startsWith('Voz removida') && !E.teste;
function cardAndamento(job) {
  const card = el('article', 'mcard rodando'); card.dataset.id = job.id;
  const topo = el('div', 'mc-topo'); topo.append(selo(job), el('span', 'tag', job.queue_position ? `Na fila · ${job.queue_position}º` : 'Gerando'));
  card.append(topo, el('h3', 'mc-titulo', job.title));
  const p = job.progress || {}, pct = Number.isFinite(p.percent) ? p.percent : null;
  const segundos = Math.max(0, Math.floor(Date.now() / 1000 - (job.started || job.created)));
  const etapa = el('p', 'etapa'); etapa.textContent = p.stage || 'Preparando a geração';
  etapa.append(el('small', '', ` · ${pct != null ? pct + '% da etapa · ' : ''}${duracaoTexto(segundos)}`));
  const barra = el('div', 'barra' + (pct == null ? ' indef' : '')); const i = el('i'); if (pct != null) i.style.width = pct + '%'; barra.append(i);
  card.append(etapa, barra);
  if (job.cancelable !== false) {
    const acoes = el('div', 'mc-acoes');
    const c = botao('bt-fantasma perigo', 'parar', job.queue_position ? 'Tirar da fila' : 'Cancelar');
    c.onclick = async () => { c.disabled = true; try { await postar('cancel/' + encodeURIComponent(job.id)); await atualizar(); } catch (e) { aviso(e.message, 'erro'); c.disabled = false; } };
    acoes.append(c); card.append(acoes);
  }
  return card;
}
function desenharBiblioteca(forcar = false) {
  const rodando = E.jobs.filter(j => j.state === 'running').sort((a, b) =>
    (a.queue_position ? 1 : 0) - (b.queue_position ? 1 : 0) || (a.queue_position || 0) - (b.queue_position || 0) || a.created - b.created);
  $('andamento').replaceChildren(...rodando.map(cardAndamento));
  const lista = visiveis();
  const assinatura = JSON.stringify([lista.map(({progress, queue_position, cancelable, ...j}) => j), E.tocando, $('audio').paused, E.teste, E.comEq, E.separador, E.ordem.length]);
  $('conta').textContent = lista.length;
  $('pularBib').textContent = `Ver suas músicas (${lista.length}) ↓`;
  const lixo = E.jobs.filter(j => j.deleted_at && j.state !== 'running');
  $('avisoLixeira').hidden = !lixo.length;
  if (lixo.length && $('avisoLixeira').dataset.n !== String(lixo.length)) {
    $('avisoLixeira').dataset.n = String(lixo.length);
    $('avisoLixeira').replaceChildren(el('span', '', `${lixo.length} ${lixo.length === 1 ? 'item ficou' : 'itens ficaram'} na lixeira antiga (de antes da atualização).`));
    const b = botao('bt-sec', 'apagar', 'Esvaziar lixeira'); b.onclick = () => esvaziarLixeira(lixo); $('avisoLixeira').append(b);
  }
  if (!forcar && assinatura === E.assinatura) return;
  // editando o nome de uma música: não redesenha agora (perderia o que está sendo digitado); a próxima atualização desenha
  if (!forcar && document.querySelector('#lista .renomear-campo:not(:disabled)')) return;
  E.assinatura = assinatura;
  if (!lista.length) {
    const vazio = el('p', 'vazio', E.jobs.some(j => !j.deleted_at && j.state !== 'running') ? 'Nenhuma música com esse filtro.' : 'Nenhuma música ainda. Escolha a IA ao lado e gere a primeira.');
    $('lista').replaceChildren(vazio); return;
  }
  $('lista').replaceChildren(...lista.map(cardMusica));
}
$('busca').addEventListener('input', () => desenharBiblioteca(true));
for (const id of ['filtroTipo', 'filtroIa']) {
  $(id).addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-v]');
    if (!b) return;
    escolherChip($(id), b);
    desenharBiblioteca(true);
  });
}

function usarConfig(job) {
  const s = job.settings || {};
  E.modo = s.mode === 'cover' ? 'cover' : 'create';
  E.motor = E.fichas[s.engine] && s.engine !== 'separador' ? s.engine : (E.fichas[job.motor_id] && job.motor_id !== 'separador' ? job.motor_id : motorPadrao(E.modo === 'cover'));
  $('titulo').value = job.title || '';
  $('estilo').value = estiloDe(job); $('letra').value = s.lyrics || '';
  const duracao = String(s.duration ?? 'auto'); $('duracao').value = [...$('duracao').options].some(o => o.value === duracao) ? duracao : 'auto';
  E.vozAntesSa3 = null;  // a voz vem da música escolhida
  $('voz').value = s.instrumental ? 'instrumental' : (s.voice === 'female' ? 'female' : 'male');
  $('genero').value = [...$('genero').options].some(o => o.value === s.genre) ? s.genre : 'custom';
  $('planejamento').checked = s.planning ?? true;
  E.seed = job.seed; $('variacao').value = 'fixed';
  $('criatividade').value = s.temperature ?? 1; $('orientacaoTexto').value = s.guidance ?? 1;
  $('orientacao').value = s.reference_mode === 'full' ? 'full' : 'melody';
  $('finalSuave').checked = !!s.fade_out; $('tirarVoz').checked = s.remove_vocals ?? true;
  $('influencia').value = s.cover_strength ?? 0.5; $('proximidade').value = s.cover_noise ?? 0;
  $('passos').value = s.ace_steps ?? 8; $('bpm').value = s.bpm ?? '';
  $('idiomaLetra').value = NOMES_IDIOMA[s.idioma] ? s.idioma : 'pt';
  $('refForca').value = s.referencia_forca ?? 0.3; $('refInicio').value = s.referencia_inicio || 0;
  $('fidelidade').value = s.treblo_fidelidade ?? 3;
  $('modeloMusicful').value = ['MFV3.0', 'MFV2.0', 'MFV1.5X'].includes(s.musicful_modelo) ? s.musicful_modelo : 'MFV3.0';
  if (s.referencia_estilo) {
    definirRefEstilo({name: s.referencia_estilo, label: 'Referência desta versão', url: '/api/reference/' + encodeURIComponent(s.referencia_estilo)});
    $('detRefEstilo').open = true;
  } else definirRefEstilo(null);
  if (s.reference) definirReferencia({name: s.reference, label: 'Referência desta versão', url: '/api/reference/' + encodeURIComponent(s.reference)});
  $('trecho').value = !s.reference_duration || s.reference_duration === 'full' ? 'full' : String(s.reference_duration);
  $('trecho').onchange(); $('inicio').value = s.start || 0;
  atualizarSliders(); aplicarMotor(); atualizarResumo(); erro();
  document.querySelector('.painel').scrollTop = 0;
  if (window.innerWidth <= 980) document.querySelector('.painel').scrollIntoView({behavior: 'smooth'});
  aviso('Configurações copiadas para o formulário. Confira e clique em Gerar.');
}
async function tirarVoz(job, b) {
  b.disabled = true;
  try { await postar('separar/' + encodeURIComponent(job.id)); aviso('Pedido de "Tirar voz" enviado para a fila.'); await atualizar(); }
  catch (e) { aviso(e.message, 'erro'); b.disabled = false; }
}
/* "Copiar" no canto do Estilo e da Letra (27/09). Só aparece quando há texto de verdade para copiar. */
function blocoCopiar(titulo, texto, mostrar, indice) {
  const temTexto = !!(texto || '').trim();
  return `<div class="sub-linha"><span class="sub">${esc(titulo)}</span>${temTexto
    ? `<button type="button" class="bt-fantasma copiar-bt" data-copiar="${indice}" title="Copiar ${esc(titulo.toLowerCase())}">${ic('copiar')}<span>Copiar</span></button>` : ''}</div>
    <div class="texto-longo">${esc(temTexto ? texto : mostrar)}</div>`;
}
async function copiarTexto(texto) {
  try { await navigator.clipboard.writeText(texto); return true; }
  catch {  // dentro do iframe do estúdio a área de transferência pode ser bloqueada: usa o jeito antigo
    // o campo temporário vai DENTRO da janela aberta: com uma janela modal, o resto da página fica bloqueado
    const t = document.createElement('textarea'); t.value = texto; t.setAttribute('readonly', '');
    t.style.position = 'fixed'; t.style.opacity = '0'; t.style.left = '0'; t.style.top = '0';
    (document.querySelector('dialog[open]') || document.body).append(t); t.focus(); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
    t.remove(); return ok;
  }
}
function abrirDetalhe(job) {
  const s = job.settings || {};
  const treblo = s.engine === TREBLO, musicful = s.engine === MUSICFUL;
  const letraNuvem = job.treblo_letra || job.musicful_letra || '', nomeNuvem = treblo ? 'Treblo' : 'Musicful';
  const letra = s.instrumental ? 'Instrumental: sem letra.' : (s.lyrics || '').trim()
    || (treblo && job.mode === 'cover' ? 'Sem letra: a Treblo escreveu uma letra nova.' : 'Nenhuma letra salva.');
  const copiaEq = !!s.eq;  // cópia do Equalizador: não custou créditos de novo
  const linhas = [['Gerada por', job.motor_nome], ...(job.motor_detalhe ? [['Detalhe', job.motor_detalhe]] : []),
    ...(copiaEq && s.eq_fonte_titulo ? [['Equalizada a partir de', s.eq_fonte_titulo]] : []), ['Tipo', job.state === 'error' ? 'Com erro' : tipoDe(job)],
    ['Criada em', data(job.created)], ...(job.duracao_s ? [['Duração', tempo(job.duracao_s)]] : []),
    ...(job.elapsed ? [['Tempo para gerar', duracaoTexto(job.elapsed)]] : []), ['Variação', String(job.seed ?? '')],
    ...(!s.instrumental && s.idioma ? [['Idioma da letra', NOMES_IDIOMA[s.idioma] || s.idioma]] : []),
    ...(s.referencia_estilo ? [['Música de referência', `Sim · força ${Math.round(Number(s.referencia_forca ?? 0.3) * 100)}%`
      + (Number(s.referencia_inicio) > 0 ? ` · a partir de ${num(s.referencia_inicio, 0)} s` : '')]] : []),
    ...(treblo && !copiaEq ? [['Custo', `${job.custo_creditos || CUSTO_TREBLO} créditos da Treblo`]] : []),
    ...(treblo && job.mode === 'cover' ? [['Fidelidade ao original', num(s.treblo_fidelidade ?? 3) + ' de 5']] : []),
    ...(job.treblo_task_id ? [['Tarefa na Treblo', job.treblo_task_id]] : []),
    ...(job.treblo_tags?.length ? [['Tags da Treblo', job.treblo_tags.join(', ')]] : []),
    ...(musicful && !copiaEq ? [['Modelo da Musicful', s.musicful_modelo || 'MFV3.0'],
      ['Custo', job.musicful_irmao_de ? 'Veio no mesmo pedido da outra versão (sem custo extra)' : '1 música do plano Musicful'
        + (job.musicful_versoes > 1 ? ` (o pedido trouxe ${job.musicful_versoes} versões)` : '')]] : []),
    ...(job.musicful_ids?.length ? [['Tarefa na Musicful', job.musicful_ids.join(', ')]] : []),
    ...ajustesDe(job, true).filter(([k]) => !(treblo && k === 'Fidelidade ao original') && !(musicful && !copiaEq && k === 'Modelo')),
    ['Final suave', s.fade_out ? 'Sim' : 'Não']];
  abrirJanela($('dlgDetalhe'), `<div class="janela-corpo">
    <div class="janela-cab"><div><span class="selo"><span>${esc(job.motor_nome)}</span></span><h2 id="detalheTitulo">${esc(job.title)}</h2></div>
      <button type="button" class="ic-bt" data-fechar aria-label="Fechar">${ic('fechar')}</button></div>
    <dl class="dados">${linhas.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${job.error ? `<p class="falha">${esc(job.error)}</p>` : ''}${job.finish_warning ? `<p class="aviso">${esc(job.finish_warning)}</p>` : ''}
    ${blocoCopiar('Estilo pedido', estiloDe(job), 'Não informado', 0)}
    ${blocoCopiar('Letra', s.instrumental ? '' : (s.lyrics || '').trim(), letra, 1)}
    ${letraNuvem && letraNuvem.trim() !== (s.lyrics || '').trim() ? blocoCopiar(`Letra devolvida pela ${nomeNuvem}`, letraNuvem, '', 2) : ''}
    <div class="janela-acoes"><button type="button" class="bt-sec" data-reusar>${ic('reusar')} Usar configurações</button>
      <button type="button" class="bt-sec" data-apagar>${ic('apagar')} Apagar</button><button type="button" class="bt-sec" data-fechar>Fechar</button></div></div>`);
  const dlg = $('dlgDetalhe');
  const textosCopiar = [estiloDe(job), s.instrumental ? '' : (s.lyrics || '').trim(), letraNuvem];
  dlg.querySelectorAll('[data-copiar]').forEach(b => {
    b.onclick = async () => {
      const ok = await copiarTexto(textosCopiar[Number(b.dataset.copiar)] || '');
      if (!ok) {  // último recurso: o navegador bloqueou a cópia; seleciona o texto para o dono apertar Ctrl+C
        const caixa = b.closest('.sub-linha')?.nextElementSibling;
        if (caixa) { const faixa = document.createRange(); faixa.selectNodeContents(caixa);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(faixa); }
        aviso('O navegador bloqueou a cópia automática: o texto ficou selecionado, aperte Ctrl+C.');
      }
      b.innerHTML = ok ? `${ic('ok')}<span>Copiado</span>` : '<span>Selecionado: Ctrl+C</span>';
      setTimeout(() => { b.innerHTML = `${ic('copiar')}<span>Copiar</span>`; }, ok ? 1600 : 4000);
    };
  });
  dlg.querySelector('[data-reusar]').onclick = () => { dlg.close(); usarConfig(job); };
  dlg.querySelector('[data-apagar]').onclick = () => { dlg.close(); pedirApagar(job); };
  if (s.engine === 'separador') dlg.querySelector('[data-reusar]').remove();
}

/* ---------------------------------------------------------------- equalizador / masterizador (27/09)
   Janela "Equalizador — título": predefinições, Auto EQ, 6 faixas, corte de graves, compressor, largura estéreo, volume
   alvo (LUFS) e limitador. A prévia (trecho de até 30 s) é refeita 600 ms depois de mexer em qualquer controle e volta
   a tocar do mesmo ponto; "Ouvir original" toca o MESMO trecho da original com o volume igualado ao da equalizada
   (A/B justo: só o timbre muda). Nada é salvo sem "Salvar como cópia", que cria uma música NOVA (a original não muda).
   Tudo roda no processador (Pedalboard), fora da fila de geração. */
const EQ = {job: null, cat: null, analise: null, aj: null, modo: 'eq', cache: new Map(), controle: null, timer: null};
const EXPLICA_EQ = {
  corte: 'Tira o ronco abaixo desta frequência (quase ninguém ouve, mas gasta volume e embola).',
  limiar: 'A partir de que volume o compressor começa a segurar. Mais baixo = age mais vezes.',
  razao: 'Quanto ele segura o que passa do limiar: 2:1 é leve, 4:1 é firme, 8:1 quase um limitador.',
  ataque: 'Rapidez para segurar. Mais lento deixa passar a pancada da bateria (mais punch).',
  liberacao: 'Rapidez para soltar depois. Rápido demais faz o som "bombear".',
  largura: '100% = como está. Menos = mais no centro (0% = mono). Mais = mais aberto (cuidado acima de 130%).',
  ganho: 'Soma ao volume alvo. Deixe em 0 para ficar exatamente no alvo.',
  teto: 'Nenhum pico passa deste teto. -1 dBTP é o recomendado pelas plataformas (evita distorção no MP3).'
};
function eqControle(campo, rotulo, min, max, passo, unidade, explica) {
  const id = 'eq_' + campo.replace('.', '_');
  return `<div class="eq-campo"><label class="rotulo" for="${id}">${esc(rotulo)} <output data-saida="${campo}"></output></label>
    <input type="range" id="${id}" data-campo="${campo}" data-unidade="${unidade}" min="${min}" max="${max}" step="${passo}">
    ${explica ? `<p class="nota">${esc(explica)}</p>` : ''}</div>`;
}
function eqMontar() {
  const cat = EQ.cat, an = EQ.analise, L = cat.limites;
  const opcoes = cat.predefinicoes.map(p => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join('')
    + '<option value="personalizado">Personalizada</option>';
  const faixas = cat.faixas.map(f => `<div class="eq-banda">
      <output data-saida="eq.${f.id}"></output>
      <input type="range" class="vertical" data-campo="eq.${f.id}" data-unidade="dB" min="${L.eq[0]}" max="${L.eq[1]}" step="0.5" aria-label="${esc(f.nome)} (${esc(f.rotulo_hz)})">
      <b>${esc(f.nome)}</b><small>${esc(f.rotulo_hz)}</small>
      <div class="eq-energia" data-energia="${f.id}" title="Energia desta faixa: antes (cinza) e depois (verde), sem contar a mudança de volume"><i class="antes"></i><i class="depois"></i></div>
      <small class="eq-delta" data-delta="${f.id}"></small></div>`).join('');
  const lufs = ['-14|-14 LUFS · Spotify/YouTube (padrão)', '-11|-11 LUFS · alto', '-9|-9 LUFS · muito alto (rock/eletrônica)', '|Sem normalizar (mantém o volume)']
    .map(o => { const [v, t] = o.split('|'); return `<option value="${v}">${esc(t)}</option>`; }).join('');
  abrirJanela($('dlgEq'), `<div class="janela-corpo eq-corpo">
    <div class="janela-cab"><div><span class="selo"><span>${esc(EQ.job.motor_nome)}</span></span>
      <h2 id="eqTitulo">Equalizador — ${esc(EQ.job.title)}</h2>
      <p class="fraco">Original: <b>${num(an.lufs)} LUFS</b> · pico real ${dbTexto(an.pico_real_db)}TP · ${tempo(an.duracao_s)}. A original nunca é alterada.</p></div>
      <button type="button" class="ic-bt" data-fechar aria-label="Fechar">${ic('fechar')}</button></div>
    <div class="eq-topo">
      <div class="eq-preset"><label class="rotulo" for="eqPreset">Predefinição</label><select id="eqPreset">${opcoes}</select></div>
      <button type="button" class="bt-ia" id="eqAuto" title="Analisa o espectro da música e sugere as 6 faixas (no máximo ±6 dB)">✨ Auto EQ</button>
      <p class="nota eq-desc" id="eqPresetDesc"></p>
    </div>
    <div class="eq-motivos" id="eqMotivos" role="status" aria-live="polite" hidden></div>
    <section class="eq-faixas" aria-label="Equalizador de 6 faixas">${faixas}</section>
    <div class="eq-grade">
      <div class="eq-cartao"><h3>Corte de graves</h3>${eqControle('corte_graves_hz', 'Frequência', L.corte_graves_hz[0], L.corte_graves_hz[1], 1, 'Hz', EXPLICA_EQ.corte)}
        <h3>Largura estéreo</h3>${eqControle('largura_pct', 'Largura', L.largura_pct[0], L.largura_pct[1], 1, '%', EXPLICA_EQ.largura)}</div>
      <div class="eq-cartao"><h3><label class="checa-linha"><input type="checkbox" data-campo="compressor.ligado"> Compressor</label></h3>
        <p class="nota">Deixa o volume mais constante: segura as partes altas para as baixas aparecerem.</p>
        ${eqControle('compressor.limiar_db', 'Limiar', L.limiar_db[0], L.limiar_db[1], 0.5, 'dB', EXPLICA_EQ.limiar)}
        ${eqControle('compressor.razao', 'Razão', L.razao[0], L.razao[1], 0.1, ':1', EXPLICA_EQ.razao)}
        ${eqControle('compressor.ataque_ms', 'Ataque', L.ataque_ms[0], L.ataque_ms[1], 1, 'ms', EXPLICA_EQ.ataque)}
        ${eqControle('compressor.liberacao_ms', 'Liberação', L.liberacao_ms[0], L.liberacao_ms[1], 10, 'ms', EXPLICA_EQ.liberacao)}</div>
      <div class="eq-cartao"><h3>Volume final</h3>
        <label class="rotulo" for="eqLufs">Volume alvo</label><select id="eqLufs" data-campo="lufs_alvo">${lufs}</select>
        <p class="nota">Acerta o volume da música inteira (medido em LUFS, do jeito que Spotify e YouTube medem).</p>
        ${eqControle('ganho_db', 'Ganho extra', L.ganho_db[0], L.ganho_db[1], 0.5, 'dB', EXPLICA_EQ.ganho)}
        <h3><label class="checa-linha"><input type="checkbox" data-campo="limitador.ligado"> Limitador</label></h3>
        ${eqControle('limitador.teto_db', 'Teto', L.teto_db[0], L.teto_db[1], 0.1, 'dBTP', EXPLICA_EQ.teto)}</div>
    </div>
    <section class="eq-previa" aria-label="Prévia">
      <div class="eq-previa-linha">
        <div><label class="rotulo" for="eqInicio">Ouvir a partir de (s)</label><input id="eqInicio" type="number" min="0" step="1"></div>
        <div><label class="rotulo" for="eqDuracao">Trecho</label><select id="eqDuracao"><option value="10">10 s</option><option value="20" selected>20 s</option><option value="30">30 s</option></select></div>
        <button type="button" class="bt-sec" id="eqMaisAlto" title="Pula para a parte mais alta da música (quase sempre o refrão)">Trecho mais alto</button>
      </div>
      <div class="chips eq-ab" role="group" aria-label="Comparar antes e depois">
        <button type="button" id="eqOuvirOriginal" aria-pressed="false">${ic('tocar')} Ouvir original</button>
        <button type="button" id="eqOuvirEq" aria-pressed="false">${ic('tocar')} Ouvir equalizada</button>
      </div>
      <audio id="eqAudio" controls preload="auto"></audio>
      <p class="eq-status" id="eqStatus" role="status" aria-live="polite"></p>
      <p class="eq-volume" id="eqVolume"></p>
    </section>
    <div class="eq-rodape">
      <div class="eq-nome"><label class="rotulo" for="eqNome">Nome da cópia</label><input id="eqNome" maxlength="120"></div>
      <div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Cancelar</button>
        <button type="button" class="gerar curto" id="eqSalvar">${ic('ok')} Salvar como cópia</button></div>
    </div></div>`);
}
const eqCaminho = (obj, caminho) => caminho.split('.').reduce((o, k) => o?.[k], obj);
function eqPor(obj, caminho, valor) {
  const partes = caminho.split('.'), ultimo = partes.pop();
  partes.reduce((o, k) => (o[k] ??= {}), obj)[ultimo] = valor;
}
function eqTextoValor(campo, v) {
  if (campo.startsWith('eq.') || campo === 'ganho_db') return dbTexto(v);
  const u = $('dlgEq').querySelector(`[data-campo="${campo}"]`)?.dataset.unidade || '';
  return u === ':1' ? `${num(v)}:1` : `${num(v)} ${u}`;
}
function eqMostrarValores() {
  const dlg = $('dlgEq');
  dlg.querySelectorAll('output[data-saida]').forEach(o => { o.textContent = eqTextoValor(o.dataset.saida, eqCaminho(EQ.aj, o.dataset.saida)); });
  const comp = !!EQ.aj.compressor?.ligado, lim = !!EQ.aj.limitador?.ligado;
  dlg.querySelectorAll('[data-campo^="compressor."]:not([type=checkbox])').forEach(n => { n.disabled = !comp; });
  dlg.querySelector('[data-campo="limitador.teto_db"]').disabled = !lim;
  const p = EQ.cat.predefinicoes.find(x => x.id === EQ.aj.preset);
  $('eqPresetDesc').textContent = p ? p.descricao : 'Ajustes feitos por você (ou pelo Auto EQ).';
}
function eqAplicarNosControles() {
  $('dlgEq').querySelectorAll('[data-campo]').forEach(n => {
    const v = eqCaminho(EQ.aj, n.dataset.campo);
    if (n.type === 'checkbox') n.checked = !!v;
    else if (n.dataset.campo === 'lufs_alvo') n.value = v == null ? '' : String(v);
    else n.value = v;
  });
  $('eqPreset').value = EQ.cat.predefinicoes.some(p => p.id === EQ.aj.preset) ? EQ.aj.preset : 'personalizado';
  eqMostrarValores();
}
// Uma predefinição continua escolhida enquanto os números forem os dela; mexeu em algo, vira "Personalizada".
const eqCanon = aj => JSON.stringify([aj.corte_graves_hz, ...EQ.cat.faixas.map(f => Number(aj.eq[f.id])), aj.compressor.ligado,
  aj.compressor.limiar_db, aj.compressor.razao, aj.compressor.ataque_ms, aj.compressor.liberacao_ms, aj.largura_pct, aj.ganho_db,
  aj.lufs_alvo, aj.limitador.ligado, aj.limitador.teto_db].map(v => typeof v === 'number' ? Math.round(v * 100) / 100 : v));
function eqLerControles() {
  const aj = structuredClone(EQ.aj);
  $('dlgEq').querySelectorAll('[data-campo]').forEach(n => {
    const c = n.dataset.campo;
    eqPor(aj, c, n.type === 'checkbox' ? n.checked : c === 'lufs_alvo' ? (n.value === '' ? null : Number(n.value)) : Number(n.value));
  });
  const igual = EQ.cat.predefinicoes.find(p => eqCanon(p.ajustes) === eqCanon(aj));
  aj.preset = igual ? igual.id : 'personalizado';
  return aj;
}
function eqStatus(texto, tipo = '') { const s = $('eqStatus'); if (s) { s.textContent = texto; s.className = 'eq-status ' + tipo; } }
function eqCorpo(original) {
  return {id: EQ.job.id, ajustes: EQ.aj, original,
          inicio_s: Math.max(0, Number($('eqInicio').value) || 0), duracao_s: Number($('eqDuracao').value) || 20};
}
async function eqPrevia(original) {
  const corpo = eqCorpo(original), chave = JSON.stringify(corpo);
  if (EQ.cache.has(chave)) return EQ.cache.get(chave);
  EQ.controle?.abort();  // a prévia anterior não interessa mais (o servidor também pula a que ninguém espera)
  const controle = EQ.controle = new AbortController();
  let r;
  try {
    r = await fetch('/api/eq/previa', {method: 'POST', signal: controle.signal, body: JSON.stringify(corpo),
                                       headers: {'Content-Type': 'application/json', 'X-Painel-Tela': VERSAO_TELA}});
  } catch (e) { if (e?.name === 'AbortError') return null; throw new Error('Sem conexão com o painel de música.'); }
  if (r.status === 204) return null;
  if (!r.ok) {
    let corpoErro = {}; try { corpoErro = await r.json(); } catch { /* resposta sem JSON */ }
    const falha = new Error(typeof corpoErro.error === 'string' ? corpoErro.error : `A prévia não deu certo (código ${r.status}).`);
    falha.tecnico = corpoErro.erro_tecnico || ''; throw falha;
  }
  let info = {};
  try { info = JSON.parse(decodeURIComponent(r.headers.get('X-Eq-Info') || '%7B%7D')); } catch { info = {}; }
  let blob;
  try { blob = await r.blob(); } catch (e) { if (e?.name === 'AbortError') return null; throw new Error('A prévia chegou incompleta. Tente de novo.'); }
  if (controle.signal.aborted) return null;
  const resultado = {url: URL.createObjectURL(blob), info};
  EQ.cache.set(chave, resultado);
  while (EQ.cache.size > 12) {
    const [k, v] = EQ.cache.entries().next().value;
    if (v.url !== $('eqAudio')?.getAttribute('src')) URL.revokeObjectURL(v.url);
    EQ.cache.delete(k);
  }
  return resultado;
}
function eqMostrarInfo(info) {
  if (!info || info.lufs_depois == null) return;
  const avisos = (info.avisos || []).map(a => `<span class="aviso">${esc(a)}</span>`).join(' ');
  $('eqVolume').innerHTML = `Volume: original <b>${num(info.lufs_antes)} LUFS</b> → equalizada <b>${num(info.lufs_depois)} LUFS</b>`
    + ` · pico real ${dbTexto(info.pico_real_antes)}TP → ${dbTexto(info.pico_real_depois)}TP ${avisos}`;
  const antes = info.faixas_antes || {}, depois = info.faixas_depois || {};
  const altura = v => Math.max(4, Math.min(100, (v + 34) / 26 * 100)) + '%';
  for (const f of EQ.cat.faixas) {
    const a = antes[f.id] - info.lufs_antes, d = depois[f.id] - info.lufs_depois;  // sem contar a mudança de volume
    const barra = $('dlgEq').querySelector(`[data-energia="${f.id}"]`), n = $('dlgEq').querySelector(`[data-delta="${f.id}"]`);
    if (!barra || !n || !Number.isFinite(a) || !Number.isFinite(d)) continue;
    barra.querySelector('.antes').style.height = altura(a); barra.querySelector('.depois').style.height = altura(d);
    const delta = d - a;
    n.textContent = Math.abs(delta) < 0.1 ? '=' : dbTexto(delta);
    n.className = 'eq-delta' + (delta >= 0.1 ? ' mais' : delta <= -0.1 ? ' menos' : '');
  }
}
async function eqTocar(modo, tocar = true) {
  EQ.modo = modo;
  $('eqOuvirOriginal').setAttribute('aria-pressed', String(modo === 'original'));
  $('eqOuvirEq').setAttribute('aria-pressed', String(modo === 'eq'));
  const player = $('eqAudio'), posicao = player.getAttribute('src') ? player.currentTime : 0, tocava = !player.paused;
  eqStatus(modo === 'eq' ? 'Preparando a prévia equalizada…' : 'Preparando o mesmo trecho da original (com o mesmo volume)…', 'espera');
  let r;
  try { r = await eqPrevia(modo === 'original'); }
  catch (e) { eqStatus(e.message, 'erro'); return; }
  if (!r || EQ.modo !== modo || !$('dlgEq').open) return;  // um pedido mais novo tomou o lugar
  eqMostrarInfo(r.info);
  if (player.getAttribute('src') !== r.url) {
    player.src = r.url;
    await new Promise(ok => { player.addEventListener('loadedmetadata', ok, {once: true}); player.addEventListener('error', ok, {once: true}); });
    if (Number.isFinite(player.duration)) player.currentTime = Math.min(posicao, Math.max(0, player.duration - 0.2));
  }
  eqStatus(`${modo === 'eq' ? 'Prévia equalizada' : 'Original (volume igualado)'} · ${num(r.info.duracao_s, 0)} s a partir de ${tempo(r.info.inicio_s) || '0:00'}`
    + (r.info.segundos_previa != null ? ` · pronta em ${num(r.info.segundos_previa)} s` : ''), 'ok');
  if (tocar || tocava) player.play().catch(() => eqStatus('Aperte o play para ouvir.', ''));
}
function eqMudou() {
  EQ.aj = eqLerControles();
  $('eqPreset').value = EQ.aj.preset;
  eqMostrarValores();
  clearTimeout(EQ.timer);
  eqStatus('Mudou: refazendo a prévia…', 'espera');
  EQ.timer = setTimeout(() => eqTocar(EQ.modo, false), 600);  // se estava tocando, continua do mesmo ponto
}
function tituloEqualizada(titulo) {
  const base = String(titulo || 'Música').replace(/\s*\(equalizada(?: \d+)?\)\s*$/i, '').trim() || 'Música';
  return (base.slice(0, 106) + ' (equalizada)').slice(0, 120);
}
async function abrirEqualizador(job) {
  const dlg = $('dlgEq');
  if (E.tocando) pararPlayer();  // o player da biblioteca e a prévia não tocam juntos
  EQ.job = job; EQ.modo = 'eq';
  abrirJanela(dlg, `<div class="janela-corpo"><p><span class="carregando"></span> Analisando "${esc(job.title)}" (volume, picos e faixas)…</p>
    <div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Cancelar</button></div></div>`);
  try {
    const an = await api('eq/analise/' + encodeURIComponent(job.id));
    if (!dlg.open || EQ.job !== job) return;
    EQ.analise = an;
    EQ.cat = {faixas: an.faixas_catalogo || [], predefinicoes: an.predefinicoes || [], limites: an.limites || {}};
  } catch (e) {
    abrirJanela(dlg, `<div class="janela-corpo"><p class="falha">${esc(e.message)}</p>${e.tecnico ? `<details class="tecnico"><summary>Detalhe técnico</summary><pre>${esc(e.tecnico)}</pre></details>` : ''}
      <div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Fechar</button></div></div>`);
    return;
  }
  const inicial = EQ.cat.predefinicoes.find(p => p.id === EQ.analise.padrao) || EQ.cat.predefinicoes[0];
  EQ.aj = structuredClone(inicial.ajustes);
  eqMontar();
  eqAplicarNosControles();
  const duracao = EQ.analise.duracao_s || 0;
  $('eqInicio').max = String(Math.max(0, Math.floor(duracao - 1)));
  $('eqInicio').value = String(Math.round(EQ.analise.trecho_mais_alto_s || 0));
  $('eqNome').value = tituloEqualizada(job.title);
  dlg.querySelectorAll('[data-campo]').forEach(n => n.addEventListener(n.tagName === 'SELECT' || n.type === 'checkbox' ? 'change' : 'input', eqMudou));
  $('eqPreset').onchange = () => {
    const p = EQ.cat.predefinicoes.find(x => x.id === $('eqPreset').value);
    if (!p) { $('eqPreset').value = EQ.aj.preset; return; }  // "Personalizada" não é uma predefinição para escolher
    EQ.aj = structuredClone(p.ajustes); eqAplicarNosControles(); $('eqMotivos').hidden = true; eqMudou();
  };
  $('eqAuto').onclick = () => {
    const sug = EQ.analise.auto_eq || {};
    for (const f of EQ.cat.faixas) { const n = dlg.querySelector(`[data-campo="eq.${f.id}"]`); if (n) n.value = sug.ganhos?.[f.id] ?? 0; }
    $('eqMotivos').innerHTML = `<b>Auto EQ</b> · comparou o espectro da música com uma curva equilibrada (no máximo ±6 dB por faixa):
      <ul>${(sug.motivos || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul>`;
    $('eqMotivos').hidden = false;
    eqMudou();
  };
  const trocouTrecho = () => { clearTimeout(EQ.timer); EQ.timer = setTimeout(() => eqTocar(EQ.modo, false), 400); };
  $('eqInicio').addEventListener('change', trocouTrecho);
  $('eqDuracao').addEventListener('change', trocouTrecho);
  $('eqMaisAlto').onclick = () => {
    const dur = Number($('eqDuracao').value) || 20;
    $('eqInicio').value = String(Math.round(Math.max(0, Math.min(EQ.analise.trecho_mais_alto_s || 0, duracao - dur))));
    trocouTrecho();
  };
  $('eqOuvirOriginal').onclick = () => { const p = $('eqAudio'); if (EQ.modo === 'original' && !p.paused) p.pause(); else eqTocar('original'); };
  $('eqOuvirEq').onclick = () => { const p = $('eqAudio'); if (EQ.modo === 'eq' && !p.paused) p.pause(); else eqTocar('eq'); };
  $('eqSalvar').onclick = eqSalvar;
  eqTocar('eq', false);  // já deixa a prévia equalizada pronta (sem tocar sozinha)
}
async function eqSalvar() {
  const b = $('eqSalvar'), dlg = $('dlgEq');
  clearTimeout(EQ.timer);
  EQ.aj = eqLerControles();
  b.disabled = true; b.innerHTML = '<span class="carregando"></span> Salvando…';
  eqStatus('Processando a música inteira e criando a cópia… (a original não muda)', 'espera');
  try {
    const r = await postar('eq/salvar', {id: EQ.job.id, ajustes: EQ.aj, titulo: $('eqNome').value.trim()});
    dlg.close();
    aviso(`Cópia criada: ${r.job.title}`);
    await atualizar();
  } catch (e) {
    eqStatus(e.message, 'erro');
    b.disabled = false; b.innerHTML = `${ic('ok')} Salvar como cópia`;
  }
}
$('dlgEq').addEventListener('close', () => {
  clearTimeout(EQ.timer); EQ.controle?.abort();
  const p = $('eqAudio'); if (p) { p.pause(); p.removeAttribute('src'); p.load(); }
  for (const v of EQ.cache.values()) URL.revokeObjectURL(v.url);
  EQ.cache.clear(); EQ.job = null;
});

/* apagar do HD (sempre com confirmação) */
async function pedirApagar(job) {
  const dlg = $('dlgApagar');
  abrirJanela(dlg, '<div class="janela-corpo"><p><span class="carregando"></span> Conferindo os arquivos desta música…</p></div>');
  let previa;
  try { previa = await api(`remover/${encodeURIComponent(job.id)}/previa`); }
  catch (e) { abrirJanela(dlg, `<div class="janela-corpo"><p class="falha">${esc(e.message)}</p><div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Fechar</button></div></div>`); return; }
  const itens = previa.arquivos.map(a => `<li><span>${esc(a.tipo)}<br><small class="fraco">${esc(a.nome)}</small></span><span>${num(a.mb)} MB</span></li>`).join('');
  const mantidos = previa.mantidos.length ? `<p class="nota">${previa.mantidos.length} arquivo(s) ficam no HD porque ${previa.mantidos.length === 1 ? 'outra música usa' : 'outras músicas usam'}: ${previa.mantidos.map(m => esc(m.tipo.toLowerCase())).join(', ')}.</p>` : '';
  abrirJanela(dlg, `<div class="janela-corpo">
    <div class="janela-cab"><span class="conf-ic">${ic('apagar')}</span><div><h2 id="apagarTitulo">Apagar do computador?</h2>
      <p class="fraco">"${esc(job.title)}" (${esc(job.motor_nome)}) sai do painel e ${previa.arquivos.length ? `estes arquivos são apagados do HD (${num(previa.mb)} MB)` : 'não há arquivo para apagar'}. Não dá para desfazer.</p></div></div>
    ${itens ? `<ul class="lista-arquivos">${itens}</ul>` : ''}${mantidos}
    ${previa.teste ? '<p class="nota">Modo de teste: nada será apagado de verdade; só sai da lista desta cópia.</p>' : ''}
    <div class="janela-acoes"><button type="button" class="bt-sec" data-fechar>Cancelar</button>
      <button type="button" class="bt-perigo" data-sim>${ic('apagar')} Apagar do computador</button></div></div>`);
  dlg.querySelector('[data-sim]').onclick = async ev => {
    ev.currentTarget.disabled = true;
    if (E.tocando === job.id) pararPlayer();
    try {
      const r = await postar('remover/' + encodeURIComponent(job.id), {confirmar: true});
      dlg.close();
      aviso(r.simulado ? `Simulação: ${r.apagados} arquivo(s), ${num(r.mb)} MB (nada foi apagado).` : `Apagada: ${r.apagados} arquivo(s), ${num(r.mb)} MB liberados.`);
      await atualizar();
    } catch (e) { dlg.close(); aviso(e.message, 'erro'); await atualizar(); }
  };
}
async function esvaziarLixeira(lixo) {
  const nomes = lixo.slice(0, 5).map(j => `"${j.title}"`).join(', ') + (lixo.length > 5 ? '…' : '');
  if (!await confirmar('Esvaziar a lixeira antiga?', `Apaga do HD ${lixo.length} item(ns): ${nomes}. Não dá para desfazer.`, 'Esvaziar e apagar', true)) return;
  try { const r = await postar('esvaziar-lixeira', {confirmar: true}); aviso(`Lixeira esvaziada: ${r.removidos} item(ns), ${num(r.mb)} MB.`); await atualizar(); }
  catch (e) { aviso(e.message, 'erro'); }
}

/* ---------------------------------------------------------------- player com fila */
const audio = $('audio');
function jobPorId(id) { return E.jobs.find(j => j.id === id); }
function tocar(job) {
  E.tocando = job.id; E.fila = visiveis().filter(j => j.state === 'done').map(j => j.id);
  if (!E.fila.includes(job.id)) E.fila.unshift(job.id);
  $('playerTitulo').textContent = job.title; $('playerSelo').firstElementChild.textContent = job.motor_nome;
  $('playerStatus').textContent = ''; $('player').hidden = false; document.body.classList.add('com-player');
  audio.src = '/api/audio/' + encodeURIComponent(job.id);
  audio.play().catch(() => { $('playerStatus').textContent = 'Aperte o play para ouvir.'; });
  desenharBiblioteca(true);
}
function alternar(job) {
  if (E.tocando === job.id && audio.src) { if (audio.paused) audio.play().catch(() => {}); else audio.pause(); return; }
  tocar(job);
}
function pararPlayer() {
  audio.pause(); audio.removeAttribute('src'); audio.load(); E.tocando = null;
  $('player').hidden = true; document.body.classList.remove('com-player'); desenharBiblioteca(true);
}
function avancar(direcao) {
  E.fila = E.fila.filter(id => jobPorId(id)?.state === 'done');
  if (!E.fila.length) return;
  let i = E.fila.indexOf(E.tocando) + direcao;
  if (E.aleatorio && direcao > 0 && E.fila.length > 1) { const outros = E.fila.filter(id => id !== E.tocando); i = E.fila.indexOf(outros[Math.floor(Math.random() * outros.length)]); }
  if (i >= E.fila.length) { if (!E.repetir) { $('playerStatus').textContent = 'Fim da lista.'; return; } i = 0; }
  if (i < 0) i = E.repetir ? E.fila.length - 1 : 0;
  const job = jobPorId(E.fila[i]); if (job) tocar(job);
}
$('anterior').onclick = () => { if (audio.currentTime > 3) audio.currentTime = 0; else avancar(-1); };
$('proxima').onclick = () => avancar(1);
$('aleatorio').onclick = () => { E.aleatorio = !E.aleatorio; $('aleatorio').setAttribute('aria-pressed', String(E.aleatorio)); };
$('repetir').onclick = () => { E.repetir = !E.repetir; $('repetir').setAttribute('aria-pressed', String(E.repetir)); };
$('fecharPlayer').onclick = pararPlayer;
audio.onended = () => avancar(1);
audio.onerror = () => { if (audio.getAttribute('src')) $('playerStatus').textContent = 'Este áudio não está disponível. Escolha outra música.'; };
audio.onplay = audio.onpause = () => desenharBiblioteca(true);
// um áudio por vez (player da biblioteca e prévia da referência)
document.addEventListener('play', ev => { for (const outro of document.querySelectorAll('audio')) if (outro !== ev.target) outro.pause(); }, true);

/* ---------------------------------------------------------------- consultas (param quando nada está visível) */
let timer = null, timerSistema = null, pausado = false, emTela = true, visivelNoEstudio = true;
function conexao(texto, estado) {
  for (const id of ['conexao', 'conexaoEmbed']) { const n = $(id); n.textContent = texto; n.className = 'conexao ' + estado; }
  $('conexaoEmbed').hidden = !EMBED;
}
async function atualizar() {
  clearTimeout(timer);
  if (pausado) return;
  try {
    const [status, jobs] = await Promise.all([api('status'), api('jobs')]);
    E.painelOk = true; E.online = !!status.online; E.aceOnline = !!status.ace_online;
    // o que esta máquina tem: se mudou (um modelo acabou de baixar, a ComfyUI ligou), o formulário é redesenhado
    const antes = JSON.stringify([E.faltam, E.coverYue, E.separador, E.motorInstalado]);
    E.faltam = status.faltam || {}; E.coverYue = status.cover !== false; E.separador = !!status.separador;
    E.motorInstalado = status.motor_instalado !== false; E.comfyRecado = status.comfy_recado || '';
    if (antes !== JSON.stringify([E.faltam, E.coverYue, E.separador, E.motorInstalado])) aplicarMotor();
    // Tela nova com servidor antigo (o painel ainda não foi reiniciado): esconde a letra com IA e a música de referência.
    const servidorNovo = status.versao_tela === VERSAO_TELA;
    const comEtapa1 = servidorNovo || VERSOES_COM_ETAPA1.has(status.versao_tela);
    $('avisoReinicio').hidden = servidorNovo;
    if (!servidorNovo) {
      const avisoEl = $('avisoReinicio');
      avisoEl.dataset.original ??= avisoEl.textContent;
      avisoEl.textContent = comEtapa1 ? 'O painel de música foi atualizado (Equalizador), mas ainda está rodando a versão antiga. '
        + 'O botão "Equalizar" aparece depois que o painel for reiniciado (feche e abra o Forja Studio com nada gerando).' : avisoEl.dataset.original;
    }
    if (comEtapa1 === document.body.classList.contains('servidor-antigo')) {
      document.body.classList.toggle('servidor-antigo', !comEtapa1);
      if (!comEtapa1) definirRefEstilo(null);
      desenharBiblioteca(true);
    }
    // o botão "Equalizar" só aparece quando o servidor tem as rotas /api/eq E o pacote do equalizador (pedalboard)
    E.comEq = servidorNovo && status.equalizador !== false;
    if (status.teste && !E.teste) { E.teste = true; $('avisoTeste').hidden = false; }
    conexao(E.online ? (E.aceOnline || !status.tem_ace ? 'Música ligada' : 'Música ligada · ACE-Step em espera')
      : 'Painel ligado · a ComfyUI liga ao gerar', 'on');
    E.jobs = jobs;
    atualizarFiltroIa(); desenharBiblioteca(); atualizarBotao();
  } catch (e) {
    E.painelOk = false; E.online = false; conexao('Sem conexão com o painel', 'off'); atualizarBotao();
  } finally { agendar(); }
}
function agendar() {
  clearTimeout(timer);
  if (pausado) return;
  const rodando = E.jobs.some(j => j.state === 'running');
  timer = setTimeout(atualizar, rodando ? 2500 : 10000);
}
async function atualizarSistema() {
  clearTimeout(timerSistema);
  if (EMBED || pausado) return;  // dentro do Estúdio o cabeçalho dele já mostra a máquina
  try {
    const d = await api('system');
    const partes = [];
    if (d.gpu) partes.push(`Placa ${Math.round(d.gpu.percent)}%`, `VRAM ${num(d.gpu.used_mib / 1024)} de ${num(d.gpu.total_mib / 1024, 0)} GB`);
    partes.push(`RAM ${num(d.ram_used / 2 ** 30)} de ${num(d.ram_total / 2 ** 30, 0)} GB`, `CPU ${Math.round(d.cpu)}%`);
    $('sistema').textContent = partes.join(' · ');
  } catch { $('sistema').textContent = ''; }
  timerSistema = setTimeout(atualizarSistema, 5000);
}
// Terceiro sinal: quando o quadro não está sendo desenhado (aba Música escondida dentro do Estúdio, janela minimizada),
// o navegador para de chamar requestAnimationFrame. Sem quadros há mais de 4 s = ninguém está vendo.
let ultimoQuadro = performance.now(), semDesenho = false;
setInterval(() => {
  requestAnimationFrame(() => { ultimoQuadro = performance.now(); });  // um quadro a cada 2 s basta (sem laço contínuo)
  const agora = performance.now() - ultimoQuadro > 4500;
  if (agora !== semDesenho) { semDesenho = agora; checarVisibilidade(); }
}, 2000);
function checarVisibilidade() {
  const parar = document.hidden || !emTela || !visivelNoEstudio || semDesenho;
  if (parar && !pausado) { pausado = true; clearTimeout(timer); clearTimeout(timerSistema); }
  else if (!parar && pausado) { pausado = false; atualizar(); atualizarSistema(); }
}
document.addEventListener('visibilitychange', checarVisibilidade);
// Dentro do Estúdio, a aba Música escondida deixa este quadro fora da tela: o observador percebe e as consultas param.
if ('IntersectionObserver' in window) new IntersectionObserver(entradas => { emTela = entradas.some(e => e.isIntersecting); checarVisibilidade(); }).observe($('sentinela'));
window.addEventListener('message', ev => {
  const daqui = [ORIGEM_ESTUDIO, ORIGEM_ESTUDIO.replace('//127.0.0.1', '//localhost'), ORIGEM_ESTUDIO.replace('//localhost', '//127.0.0.1')];
  if (!daqui.includes(ev.origin) || ev.data?.tipo !== 'musica-visivel') return;
  visivelNoEstudio = !!ev.data.visivel; checarVisibilidade();
});

async function iniciar() {
  document.body.classList.add('servidor-antigo');  // até o /api/status confirmar que o servidor já é a versão nova
  preencherIcones();
  atualizarSliders();
  try { const f = await api('fichas'); E.fichas = f.ias || {}; E.ordem = f.ordem || Object.keys(E.fichas); }
  catch { E.fichas = {}; E.ordem = []; }
  // o que falta nesta máquina vem antes do primeiro desenho: a IA padrão é a primeira que já está pronta
  try { const st = await api('status'); E.faltam = st.faltam || {}; E.coverYue = st.cover !== false; E.separador = !!st.separador; E.motorInstalado = st.motor_instalado !== false; }
  catch { /* o atualizar() logo abaixo mostra a falta de conexão */ }
  aplicarMotor(); atualizarResumo();
  await atualizar(); atualizarSistema();
  for (const id of Object.keys(NUVEM)) pedirSaldo(id);
}
iniciar();
