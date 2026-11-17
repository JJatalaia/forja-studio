"""Fonte única dos nomes das IAs de música do painel (reforma de 2026-09-23).

Os nomes, as explicações e as notas vêm de estudio\\fichas.json (ao lado desta pasta, ou do arquivo que a variável
PAINEL_FICHAS apontar), a mesma ficha que o estúdio mostra. Este módulo só:
- diz QUAIS IAs este pacote mostra (PAINEL_MOTORES; padrão: YuE2 INT8 e Stable Audio 3);
- lê essa ficha do disco (relê sozinho quando o arquivo muda);
- dá nome aos motores antigos que não existem mais na tela (músicas velhas do jobs.json);
- normaliza os jobs ao carregar (migração só na memória; o arquivo é regravado no próximo salvamento);
- limpa o sufixo técnico "instrumental only, no vocals…" e traduz as mensagens de erro mais comuns.
"""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHAS = Path(os.environ.get('PAINEL_FICHAS') or (ROOT / 'estudio' / 'fichas.json'))
# Todas as IAs que o painel SABE usar, na ordem em que aparecem na tela. O que aparece de verdade é MOTORES, logo
# abaixo: no pacote só vêm as duas que rodam com os nós de fábrica da ComfyUI.
TODOS_OS_MOTORES = ('ace-step-official', 'yue2-int8', 'ace-xl-turbo', 'ace-xl-sft', 'minimax-music3', 'stable-audio3',
                    'treblo-v3')  # treblo-v3: nuvem, paga (26/09). A Musicful saiu da tela em 11/10/2026.
MOTORES_DO_PACOTE = 'yue2-int8,stable-audio3'


def _motores_ativos():
    """Os ids da variável PAINEL_MOTORES (separados por vírgula), na ordem da tela. Id desconhecido é ignorado; lista
    vazia ou só com ids errados cai no padrão do pacote, para a tela nunca abrir sem nenhuma IA."""
    pedidos = [x.strip() for x in (os.environ.get('PAINEL_MOTORES') or MOTORES_DO_PACOTE).split(',') if x.strip()]
    ativos = tuple(m for m in TODOS_OS_MOTORES if m in pedidos)
    return ativos or tuple(m for m in TODOS_OS_MOTORES if m in MOTORES_DO_PACOTE.split(','))


MOTORES = _motores_ativos()
# O que a tela lista: as IAs ativas e, no fim, a ficha do "Tirar voz" (só é mostrada se a ComfyUI tiver esse nó).
IDS_MUSICA = MOTORES + ('separador',)
# Idioma da letra escolhido no painel → código de idioma do ACE-Step 1.5 (Oficial e XL). Sem idioma = português.
IDIOMAS_LETRA = {'pt': 'pt', 'en': 'en', 'es': 'es'}

# Cópia de segurança dos nomes: só é usada se a fichas.json não puder ser lida (arquivo sendo gravado, por exemplo).
_RESERVA = {
    'ace-step-official': 'ACE-Step 1.5 · Oficial', 'yue2-int8': 'YuE2 · INT8', 'ace-xl-turbo': 'ACE-Step 1.5 XL · Turbo',
    'ace-xl-sft': 'ACE-Step 1.5 XL · SFT', 'minimax-music3': 'MiniMax Music 3', 'stable-audio3': 'Stable Audio 3',
    'separador': 'MelBandRoFormer (Tirar voz)', 'treblo-v3': 'Treblo v3 · nuvem (paga)',
    'musicful': 'Musicful · nuvem (removida)',
}

# Motores que saíram da tela. Servem só para dar o nome certo às músicas antigas.
LEGADOS = {
    # Fluxo antigo (18/09): o mesmo modelo ACE-Step 1.5 Turbo, mas rodando dentro da ComfyUI de música.
    'ace-step-1.5-turbo': ('ace-step-official', 'ACE-Step 1.5 · Turbo (fluxo antigo na ComfyUI)'),
    # Nuvem ACEMusic: o dono mandou remover em 21/09.
    'ace-step-cloud': ('acemusic-nuvem', 'ACEMusic (nuvem, removido)'),
}

_cache = {'mtime': None, 'ias': None}


def fichas():
    """Todas as fichas (dicionário id -> ficha). Relê o arquivo só quando ele muda."""
    try:
        mtime = FICHAS.stat().st_mtime_ns
        if _cache['mtime'] != mtime:
            dados = json.loads(FICHAS.read_text(encoding='utf-8'))
            _cache.update(mtime=mtime, ias=dados.get('ias', {}))
    except (OSError, ValueError):
        pass  # mantém a última leitura boa
    return _cache['ias'] or {}


def fichas_musica():
    """As fichas das IAs de música DESTE pacote (as de PAINEL_MOTORES e a do "Tirar voz")."""
    return {k: v for k, v in fichas().items() if v.get('aba') == 'musica' and k in IDS_MUSICA}


def nome(motor_id):
    if not motor_id:
        return 'Motor não registrado'
    ficha = fichas().get(motor_id)
    if ficha and ficha.get('nome'):
        return ficha['nome']
    for legado_id, legado_nome in LEGADOS.values():
        if legado_id == motor_id:
            return legado_nome
    return _RESERVA.get(motor_id, motor_id)


def motor_do_job(job, jobs=None):
    """(motor_id, motor_nome, detalhe) de um job, sempre a partir dos ids da fichas.json."""
    s = job.get('settings') or {}
    engine = s.get('engine')
    if engine in LEGADOS:
        motor_id, motor_nome = LEGADOS[engine]
    else:
        motor_id = engine or 'yue2-int8'
        motor_nome = nome(motor_id)
    detalhe = ''
    if engine == 'separador':
        fonte_nome = s.get('fonte_motor_nome')
        if not fonte_nome and jobs and s.get('fonte') in jobs:
            fonte_nome = motor_do_job(jobs[s['fonte']])[1]
        detalhe = f'Voz removida de uma música do {fonte_nome}' if fonte_nome else 'Voz removida de uma música pronta'
    elif job.get('voz_removida') or ('voz_removida' not in job and job.get('state') == 'done' and s.get('remove_vocals')
                                     and engine in ('ace-xl-turbo', 'ace-xl-sft', 'minimax-music3', 'stable-audio3')
                                     and not re.match(r'N[ãa]o deu para tirar', job.get('finish_warning') or '')):
        # jobs antigos dos motores novos: o código de 21/09 já aplicava o separador; nos outros ele não era aplicado
        detalhe = 'Voz removida no final com o MelBandRoFormer'
    if isinstance(s.get('eq'), dict):
        # cópia feita pelo Equalizador (27/09): mesmo selo da IA da original, com o detalhe "Equalizada"
        detalhe = 'Equalizada' + (f' · {detalhe}' if detalhe else '')
    return motor_id, motor_nome, detalhe


# ---------------------------------------------------------------- sufixo "instrumental"
SUFIXO = ['instrumental only', 'no vocals', 'no singing', 'no spoken words']
# Só no FIM do texto (é onde o painel cola o sufixo, inclusive as cópias acumuladas); o resto fica como a pessoa escreveu.
_SUFIXO_FINAL = re.compile(r'(?:(?:^|[,;])\s*(?:instrumental only|no vocals?|no singing|no spoken words?)\s*)+$', re.I)


def limpar_sufixo(style):
    """Tira as frases técnicas que o painel acrescenta no modo instrumental (inclusive repetidas)."""
    return _SUFIXO_FINAL.sub('', str(style or '')).strip()


def ler_bpm(valor):
    """BPM digitado pela pessoa: aceita '120', '120.5' e '120,5' (arredonda). Fora de 30–300 ou sem número: erro em português."""
    try:
        bpm = int(round(float(str(valor).strip().replace(',', '.'))))
    except (TypeError, ValueError, OverflowError):
        raise ValueError('O BPM deve ser um número inteiro entre 30 e 300 (por exemplo, 120).') from None
    if not 30 <= bpm <= 300:
        raise ValueError('O BPM deve ser um número inteiro entre 30 e 300 (por exemplo, 120).')
    return bpm


# ---------------------------------------------------------------- migração ao carregar
_SEM_VOZ_FADE = re.compile(r'^(painel_.+_sem_voz_\d+)_fade_[0-9a-f]{8}\.flac$')


def migrar(jobs):
    """Normaliza todos os jobs na memória. Devolve quantos mudaram (o arquivo só é regravado no próximo salvamento)."""
    mudou = 0
    for job in jobs.values():
        antes = json.dumps(job, sort_keys=True, ensure_ascii=False)
        s = job.setdefault('settings', {})
        if not s.get('engine'):
            # Os 2 jobs sem motor são de 18/09, quando só existia o YuE2 (têm a partitura do FZScoreGuard, que só o YuE2 usa).
            s['engine'] = 'yue2-int8'
            s['engine_deduzido'] = True
        if 'style_original' not in s:
            s['style_original'] = limpar_sufixo(s.get('style', ''))
        if job.get('state') != 'running':
            for chave in ('ace_payload', 'nm_phase', 'cloud_phase', 'nm_aviso', 'aviso_fila'):
                job.pop(chave, None)
        # Versões antigas com "tirar voz" + final suave: o "_sem_voz" sem o final suave ficava órfão no HD.
        # Anota como intermediário para o "Apagar" levar junto (só se nenhuma lista do job já o citar).
        citados = {a.get('filename') for chave in ('audio', 'original_audio', 'intermediarios') for a in job.get(chave) or []}
        for a in job.get('audio') or []:
            m = _SEM_VOZ_FADE.match(a.get('filename', ''))
            if m and m[1] + '.flac' not in citados:
                job.setdefault('intermediarios', []).append({**a, 'filename': m[1] + '.flac'})
        motor_id, motor_nome, detalhe = motor_do_job(job, jobs)
        job['motor_id'], job['motor_nome'] = motor_id, motor_nome
        if detalhe.startswith('Voz removida no final') and 'voz_removida' not in job:
            job['voz_removida'] = True  # música antiga que já saiu sem voz: a tela não oferece "Tirar voz" de novo
        if json.dumps(job, sort_keys=True, ensure_ascii=False) != antes:
            mudou += 1
    return mudou


# ---------------------------------------------------------------- mensagens de erro em português
_ANTIGAS = {
    'Geracao interrompida ou servidor reiniciado.': 'Geração interrompida ou servidor reiniciado.',
    'Geracao cancelada.': 'Geração cancelada.',
    'Geracao falhou no ACE-Step.': 'A geração falhou no ACE-Step.',
    'A geracao terminou sem audio.': 'A geração terminou sem áudio.',
    'Separador de voz falhou.': 'O separador de voz falhou.',
    'Separador de voz nao gerou audio.': 'O separador de voz não gerou áudio.',
    'Separador de voz demorou demais.': 'O separador de voz demorou demais.',
    'A musica original nao existe mais.': 'A música original não existe mais.',
    'Painel reiniciado durante a separacao de voz. Tente de novo.': 'O painel foi reiniciado durante a separação de voz. Tente de novo.',
    'Fade-out indisponivel; audio original preservado.': 'Final suave indisponível; ficou o áudio original.',
    'Final suave indisponivel; audio original preservado.': 'Final suave indisponível; ficou o áudio original.',
    'Final suave indisponivel; original preservado.': 'Final suave indisponível; ficou o áudio original.',
    'Envio interrompido. Confira o servidor antes de tentar novamente.': 'O envio foi interrompido. Confira o servidor antes de tentar de novo.',
}
GENERICO = 'A IA de música informou um erro técnico (veja o detalhe técnico).'
# Sinais de que o texto já está em português (acentos ou palavras comuns das mensagens do painel).
_PORTUGUES = re.compile(
    r'[ãõçáéíóúâêôà]|\b(?:n[aã]o|m[uú]sicas?|[aá]udios?|arquivos?|escolha|preencha|confira|tente|envie|ou|para|uma?|que|'
    r'de|da|das|dos|na|nas|nos|em|fila|placa|voz|letra|estilo|motor|painel|deve|entre|ficar|fora|intervalo|permitido|'
    r'cancelad[oa]|retirad[oa]|erro|falhou|servidor|reiniciado|modo|teste|limite|aguarde|espere)\b', re.I)
# Trechos que não contam para decidir o idioma: textos entre aspas (nomes, chaves) e caminhos de arquivo.
_CITACOES = re.compile(r"'[^']*'|\"[^\"]*\"|[A-Za-z]:[\\/][^\s,;]*|/[\w./-]+")
# Casos conhecidos (texto técnico em inglês → frase em português).
_CONHECIDOS = (
    (('<!doctype', '<html'), 'O serviço respondeu com uma página de erro em vez da música (fora do ar ou demorou demais). '
                             'Tente de novo mais tarde.'),
    (('fault failed',), 'A IA falhou dentro da ComfyUI (erro interno "Fault failed"). Tente de novo; '
                        'se repetir, reduza a duração ou gere sem outra geração junto.'),
    (('absolute audio file paths are not allowed',), 'O ACE-Step recusou o áudio de referência (caminho não permitido). '
                                                     'Envie o áudio de novo.'),
    (('out of memory', 'outofmemory', 'allocation on device'), 'Faltou memória na placa de vídeo. Espere as outras gerações '
                                                                'terminarem e tente de novo, ou reduza a duração.'),
    (('unexpected mimetype', 'attempt to decode json'), 'O ACE-Step respondeu de um jeito inesperado (provavelmente ainda '
                                                        'estava iniciando). Tente de novo.'),
    (('cannot connect', 'connection refused', 'connect call failed', 'server disconnected'),
     'O motor de música está desligado ou ainda iniciando. Tente de novo em instantes.'),
    (('errno 2]', 'no such file or directory', 'filenotfounderror'),
     'O arquivo de áudio não foi encontrado no HD (pode ter sido apagado ou movido).'),
    (('bigger than max', 'smaller than min'), 'Um valor passou do limite permitido pela IA (duração, BPM ou outro ajuste).'),
    (('value not in list',), 'A IA não aceitou uma das opções escolhidas (modelo ou arquivo não encontrado na ComfyUI).'),
    (('invalid literal for int', 'could not convert string to float'), 'Um número digitado não é válido. Use só algarismos.'),
    (('queue is full', 'server busy'), 'O ACE-Step está com a fila cheia. Espere a música atual terminar e tente de novo.'),
    (('failed validation',), 'A ComfyUI recusou o pedido (a validação falhou). Veja o detalhe técnico.'),
)


def tem_portugues(texto):
    return bool(_PORTUGUES.search(_CITACOES.sub(' ', str(texto or ''))))


def traduzir_erro(texto, generico=GENERICO):
    """Mensagem curta em português para mostrar na tela (o texto técnico original fica guardado à parte).

    Regra: casos conhecidos viram frases próprias; texto que já está em português passa igual; qualquer outro texto
    (inglês, KeyError, 'list index out of range'…) vira a frase genérica, e a tela mostra o original em "Detalhe técnico"."""
    if isinstance(texto, BaseException):
        if isinstance(texto, TimeoutError) or type(texto).__name__ in ('TimeoutError', 'ServerTimeoutError'):
            return 'O serviço demorou demais para responder. Tente de novo em instantes.'
        texto = str(texto) or type(texto).__name__
    t = str(texto or '').strip()
    if not t:
        return 'A geração falhou sem mensagem de erro.'
    if t in _ANTIGAS:
        return _ANTIGAS[t]
    b = t.lower()
    for chaves, frase in _CONHECIDOS:
        if any(c in b for c in chaves):
            return frase
    if tem_portugues(t):
        return t
    return generico
