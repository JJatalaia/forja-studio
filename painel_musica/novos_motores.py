"""Fila local de música e as IAs que rodam na ComfyUI: YuE2 e Stable Audio 3 (as duas do pacote) e, para quem tiver
os arquivos, ACE-Step 1.5 XL (Turbo/SFT), MiniMax Music 3 e o separador de voz MelBandRoFormer.

Desde 14/11/2026 a ComfyUI é UMA só (a mesma da imagem e do vídeo, a do estúdio). Isso muda a conta da placa:
- a fila da ComfyUI é única, então ela já garante uma geração por vez. O painel só manda uma música quando essa fila
  está VAZIA e o estúdio (/api/ocupado) diz que a placa está livre;
- fila da ComfyUI ocupada, vista daqui, é sempre trabalho DOS OUTROS (imagem, vídeo, ou alguém usando a ComfyUI
  por fora): enquanto uma música do painel está gerando, a fila nem chega a perguntar (ver `ciclo`). Por isso ela
  conta como espera "de fora" e NÃO faz o painel dizer "ocupado": senão o estúdio esperaria a música, a música
  esperaria o vídeo do estúdio, e ninguém andava;
- o /api/ocupado do painel só fala das músicas DELE. Na fila da ComfyUI ele reconhece as suas pelo clientId.

Regras que continuam (reforma de 2026-09-23):
- uma geração por vez na placa: TODA música espera na fila local. Se o estúdio não responder em 2 s, conta como livre;
- para os dois lados nunca travarem esperando um pelo outro, uma música que está esperando o vídeo NÃO conta como
  "ocupado" no /api/ocupado; antes de mandar para a placa o painel se anuncia, espera 1,5 s e confere de novo;
- "Tirar qualquer voz no final" vale para todos os motores que cantam: depois de gerar, passa o áudio no
  MelBandRoFormer e guarda só o instrumental (o original fica salvo em original_audio).
Os fluxos de API ficam em workflows/musica_*_api.json (gerados por workflows/converter_musica.py).

Etapa 1 da frente "painel de música" (2026-09-23 à noite):
- "Música de referência" no ACE-Step 1.5 XL: nó experimental ReferenceTimbreAudio ("Set Reference Audio") da ComfyUI
  0.36, com força ajustável (ver aplicar_referencia_xl);
- Stable Audio 3: a IA de texto embutida na ComfyUI (TextGenerate, nó 52:35) fica SEMPRE desligada; quem melhora a
  descrição agora é o botão "Melhorar descrição do estilo" (IA de texto do Estúdio, POST 8194/api/texto);
- o clientId enviado à ComfyUI vem do painel (p.CLIENTE): uma cópia de teste em outra porta não rouba o progresso do
  painel de verdade.
"""
import asyncio
import contextlib
import copy
import json
import random
import re
import shutil
import time
import uuid

from aiohttp import ClientError, ClientSession, ClientTimeout

import catalogo

# Os endereços da ComfyUI e do estúdio vêm do painel (p.BASE e p.ESTUDIO, lidos das variáveis PAINEL_*).
# O clientId enviado à ComfyUI é o do painel (p.CLIENTE): o progresso chega pelo WebSocket que ele já escuta.
CONFIRMAR_S = 1.5

# Os nomes que aparecem na tela vêm da fichas.json (catalogo.nome); aqui fica só o que o código precisa.
ENGINES = {
    'ace-xl-turbo': {'api': 'musica_ace_xl_turbo_api.json', 'tipo': 'ace'},
    'ace-xl-sft': {'api': 'musica_ace_xl_sft_api.json', 'tipo': 'ace'},
    'minimax-music3': {'api': 'musica_minimax_music_3_api.json', 'tipo': 'mm3'},
    'stable-audio3': {'api': 'musica_stable_audio_3_api.json', 'tipo': 'sa3'},
}
SEPARAR = 'musica_separar_voz_api.json'
# Motores da ComfyUI de música que aceitam "música de referência" (o ACE-Step Oficial fica em ace_backend.py).
REFERENCIA_XL = {'ace-xl-turbo', 'ace-xl-sft'}
ESCURO = re.compile(r'\b(metal|dark|sombri|tens[oa]|sad|triste|minor|menor|doom|grunge|horror|melanc)', re.I)

# Estado do despacho, lido pelo /api/ocupado.
DESPACHO = {'intencao': None, 'aguardando_outro': False, 'motivo': '', 'comfy_fora_desde': None}


def eh_novo(job):
    """Jobs acompanhados por esta fila (motores novos, separador e YuE2 enviados depois de 23/09)."""
    engine = job.get('settings', {}).get('engine')
    return engine in ENGINES or engine == 'separador' or bool(job.get('fila_local'))


def na_fila(job):
    return job.get('nm_phase') == 'queued' or job.get('ace_phase') == 'queued' or job.get('fase_final') == 'pendente'


def ocupado_local(p):
    """Há música do painel usando (ou prestes a usar) a placa agora?"""
    for j in p.JOBS.values():
        if j.get('state') != 'running' or j.get('fase_final') == 'pendente':
            continue
        nome = catalogo.nome(j.get('settings', {}).get('engine'))
        if j.get('fase_final') in ('separando', 'finalizando'):
            return True, 'Finalizando uma música (' + nome + ')'
        if j.get('nm_phase') in ('gerando', 'separando'):
            return True, 'Gerando música: ' + nome
        if j.get('ace_phase') in ('liberado', 'submitting', 'generating', 'baixado'):
            if j.get('ace_fora_desde') and j.get('ace_phase') in ('submitting', 'generating'):
                continue  # o /health do ACE-Step falhou: o processo parou e a placa está livre (ace_backend.acompanhar)
            return True, 'Gerando música: ' + nome
        if not eh_novo(j) and not j.get('ace_phase') and j.get('settings', {}).get('engine') == 'yue2-int8':
            return True, 'Gerando música: ' + nome  # YuE2 enviado pelo código antigo
    return False, ''


async def enqueue_separar(p, fonte_id):
    """Cria uma versão 'sem voz' de uma música pronta da biblioteca."""
    fonte = p.JOBS.get(fonte_id)
    if not fonte or fonte.get('state') != 'done' or not fonte.get('audio'):
        raise ValueError('Música não encontrada ou ainda não terminou.')
    if fonte.get('settings', {}).get('engine') == 'stable-audio3':
        raise ValueError('O Stable Audio 3 já gera só instrumental: não há voz para tirar.')
    fonte_motor_id, fonte_motor_nome, _ = catalogo.motor_do_job(fonte, p.JOBS)
    estilo = fonte['settings'].get('style_original') or catalogo.limpar_sufixo(fonte['settings'].get('style', ''))
    s = {'engine': 'separador', 'fonte': fonte_id, 'fonte_motor_id': fonte_motor_id, 'fonte_motor_nome': fonte_motor_nome,
         'style': estilo, 'style_original': estilo, 'lyrics': '', 'instrumental': True, 'mode': 'create', 'fade_out': False}
    async with p.LOCK:
        jid = 'nm-' + uuid.uuid4().hex
        job = dict(id=jid, title=(fonte['title'] + ' (sem voz)')[:120], mode='create', created=time.time(),
                   seed=fonte.get('seed', 0), state='running', settings=s, nm_phase='queued')
        p.JOBS[jid] = job
        p.save_jobs()
    return job


async def rodar_separador(p, job):
    fonte = p.JOBS.get(job['settings']['fonte'])
    if not fonte or not fonte.get('audio'):
        raise ValueError('A música original não existe mais.')
    job.update(nm_phase='separando', started=time.time())
    p.save_jobs()
    job['original_audio'] = copy.deepcopy(fonte['audio'][:1])  # é o arquivo da música de origem (fica protegido)
    audio = [await separar_voz(p, fonte['audio'][0])]
    job['voz_removida'] = True
    motor = catalogo.nome('separador') + ' · voz removida de: ' + (job['settings'].get('fonte_motor_nome') or 'música pronta')
    await p.gravar_metadados(audio[0], job['title'], motor, job['settings'].get('style_original', ''))
    job.update(state='done', audio=audio, elapsed=round(time.time() - job['started'], 1), duracao_s=p.duracao_item(audio[0]))
    job.pop('nm_phase', None)
    p.save_jobs()


def carregar(p, nome):
    return json.loads((p.WORKFLOWS / nome).read_text(encoding='utf-8'))


def salvar_flac(api, no, prefixo):
    ins = api[no]['inputs']
    ins.pop('format.quality', None)
    ins.update(format='flac', filename_prefix=prefixo)


def aplicar_referencia_xl(api, nome, forca):
    """Música de referência no ACE-Step 1.5 XL (nó experimental "Set Reference Audio" da ComfyUI 0.36).

    Na ComfyUI a referência guia o timbre E a estrutura (a IA recebe as "dicas" tiradas do áudio de referência). A força
    é a parte do caminho de geração guiada pela referência, o mesmo mecanismo do audio_cover_strength do ACE-Step
    Oficial: 0,3 = só o começo (clima, instrumentos, andamento); 1,0 = do começo ao fim (fica perto de um cover).
    No resto do caminho vale só o texto (estilo e letra). O planejamento (códigos do LM) fica desligado, como o próprio
    nó TextEncodeAceStepAudio1.5 pede quando há áudio de referência."""
    api['200'] = {'class_type': 'LoadAudio', 'inputs': {'audio': nome}}
    api['201'] = {'class_type': 'VAEEncodeAudio', 'inputs': {'audio': ['200', 0], 'vae': ['106', 0]}}
    api['202'] = {'class_type': 'ReferenceTimbreAudio', 'inputs': {'conditioning': ['94', 0], 'latent': ['201', 0]}}
    positivo = ['202', 0]
    if forca < 0.999:
        corte = round(float(forca), 3)
        api['203'] = {'class_type': 'ConditioningSetTimestepRange',
                      'inputs': {'conditioning': ['202', 0], 'start': 0.0, 'end': corte}}
        api['204'] = {'class_type': 'ConditioningSetTimestepRange',
                      'inputs': {'conditioning': ['94', 0], 'start': corte, 'end': 1.0}}
        api['205'] = {'class_type': 'ConditioningCombine', 'inputs': {'conditioning_1': ['203', 0], 'conditioning_2': ['204', 0]}}
        positivo = ['205', 0]
    api['3']['inputs']['positive'] = positivo
    # O negativo (usado quando o CFG passa de 1, no SFT) é o mesmo condicionamento zerado: a referência continua nele.
    api['47']['inputs']['conditioning'] = positivo
    api['94']['inputs']['generate_audio_codes'] = False


def montar(p, engine, data):
    e = ENGINES[engine]
    api = carregar(p, e['api'])
    instrumental = bool(data.get('instrumental')) or e['tipo'] == 'sa3'
    estilo = data['style']
    letra = '' if instrumental else str(data.get('lyrics', '')).strip()
    seed = int(data['seed']) % (2**53)
    dur = data.get('duration', 'auto')
    dur = 120 if dur in ('auto', None, '') else int(dur)
    prefixo = f"audio/painel_{engine}_{time.strftime('%Y%m%d_%H%M%S')}"
    if e['tipo'] == 'ace':
        bpm = data.get('bpm')
        if bpm in (None, ''):
            m = re.search(r'\b(\d{2,3})\s*BPM\b', estilo, re.I)
            bpm = int(m[1]) if m else 110
        else:
            bpm = catalogo.ler_bpm(bpm)  # '120.5' vira 120 (antes: erro em inglês na tela)
        m = re.search(r'\b([A-G](?:#|b)?)\s*(major|minor)\b', estilo, re.I)
        tom = f"{m[1][0].upper()}{m[1][1:]} {m[2].lower()}" if m else ('E minor' if ESCURO.search(estilo) else 'C major')
        t = api['94']['inputs']
        t.update(tags=estilo, lyrics='[Instrumental]' if instrumental else letra, bpm=max(10, min(300, int(bpm))),
                 duration=dur, language='unknown' if instrumental else catalogo.IDIOMAS_LETRA.get(data.get('idioma'), 'pt'),
                 keyscale=tom,
                 generate_audio_codes=bool(data.get('planning', True)))
        api['98']['inputs']['seconds'] = dur
        api['109']['inputs']['value'] = seed
        if data.get('entrada_referencia'):
            aplicar_referencia_xl(api, data['entrada_referencia'], float(data.get('referencia_forca', 0.3)))
        salvar_flac(api, '111' if '111' in api else '110', prefixo)
    elif e['tipo'] == 'mm3':
        t = api['37:13']['inputs']
        t.update(caption=estilo, lyrics=letra, max_duration=float(min(dur, 360)))
        api['37:38']['inputs']['seed'] = seed
        api['37:43']['inputs']['switch'] = dur > 150  # decodificação em blocos para músicas longas (menos VRAM)
        salvar_flac(api, '35', prefixo)
    else:  # Stable Audio 3: só instrumental / efeitos
        api['52:31']['inputs']['value'] = estilo
        api['52:36']['inputs']['value'] = float(min(dur, 190))
        # A IA de texto embutida (TextGenerate) fica desligada: a descrição vai do jeito que está no 52:31. Para melhorar
        # a descrição, o painel tem o botão "Melhorar descrição do estilo" (IA de texto do Estúdio, antes de gerar).
        api['52:35']['inputs']['value'] = False
        api['52:3']['inputs']['seed'] = seed
        salvar_flac(api, '57', prefixo)
    return api


async def enqueue(p, data):
    engine = data['engine']
    if data.get('mode') == 'cover':
        # só cita as IAs que ESTA instalação tem (no pacote, quem faz cover é o YuE2)
        fazem = [catalogo.nome(m) for m in catalogo.MOTORES if m in ('ace-step-official', 'yue2-int8', 'treblo-v3')]
        raise ValueError(f"{catalogo.nome(engine)} não faz cover."
                         + (f" Para cover, use: {', '.join(fazem)}." if fazem else ''))
    if ENGINES[engine]['tipo'] == 'sa3':
        data['instrumental'] = True
        data['remove_vocals'] = False  # não canta: não há voz para tirar
    data['style_original'] = catalogo.limpar_sufixo(data['style'])
    if data.get('instrumental'):
        data['style'] = p.instrumental_style(data['style'])
    if not data.get('instrumental') and not str(data.get('lyrics', '')).strip():
        raise ValueError('Preencha a letra ou escolha Instrumental.')
    montar(p, engine, data)  # valida antes de entrar na fila
    async with p.LOCK:
        jid = 'nm-' + uuid.uuid4().hex
        job = dict(id=jid, title=str(data.get('title', '')).strip()[:120] or 'Minha música', mode='create',
                   created=time.time(), seed=data['seed'], state='running', settings=data, nm_phase='queued')
        p.registrar_motor(job)
        p.JOBS[jid] = job
        p.save_jobs()
    return p.web.json_response(job)


# ---------------------------------------------------------------- placa livre? (uma ComfyUI só, uma fila só)
async def estudio_ocupado(p):
    """Pergunta ao estúdio se ele está usando a placa. Sem resposta em 2 s = livre.

    O estúdio conta aqui o que a fila da ComfyUI NÃO mostra: a IA de texto na placa, um trabalho que ele está
    preparando para mandar (reserva) e os trabalhos dele que já estão na ComfyUI."""
    try:
        async with ClientSession(timeout=ClientTimeout(total=2)) as s:
            async with s.get(p.ESTUDIO + '/api/ocupado') as r:
                if r.status != 200:
                    return False, ''
                d = await r.json(content_type=None)
        return bool(d.get('ocupado')), str(d.get('motivo') or '')
    except Exception:
        return False, ''


MOTIVO_COMFY_FORA = 'A ComfyUI está desligada ou iniciando (o painel pediu ao estúdio para ligar)'
MOTIVO_COMFY_OCUPADA = 'Aguardando a imagem ou o vídeo terminar (a ComfyUI está gerando)'


def precisa_comfy(job):
    """Só o ACE-Step Oficial (que não vem no pacote) roda fora da ComfyUI, no processo dele."""
    return job.get('ace_phase') != 'queued'


def _do_painel(p, linha):
    """Esta linha da fila da ComfyUI foi mandada por este painel? (o clientId vai carimbado no pedido)"""
    try:
        return (linha[3] or {}).get('client_id') == p.CLIENTE
    except (IndexError, AttributeError, TypeError):
        return False


async def estado_comfy(p):
    """'livre', 'ocupada' ou 'fora' (desligada ou iniciando). É a ComfyUI do estúdio, a mesma da imagem e do vídeo."""
    try:
        q = await p.comfy('GET', '/queue')
    except Exception:
        return 'fora'
    return 'ocupada' if q.get('queue_running') or q.get('queue_pending') else 'livre'


async def gpu_livre(p, job=None):
    """(livre, motivo, externo) para mandar `job` para a placa.

    externo=True quer dizer que a fila está parada por algo que NÃO é música do painel usando a placa (imagem ou
    vídeo gerando, ComfyUI desligada, ACE-Step fora do ar). Nesse caso a fila não conta como 'ocupado' no
    /api/ocupado: a placa está livre para o estúdio e os dois lados nunca travam esperando um pelo outro.

    Com uma ComfyUI só, fila ocupada aqui é SEMPRE dos outros: quando a música do painel está gerando, o `ciclo`
    volta antes de chegar nesta função."""
    comfy = await estado_comfy(p)
    if comfy == 'ocupada':
        return False, MOTIVO_COMFY_OCUPADA, True
    if comfy == 'fora' and (job is None or precisa_comfy(job)):
        return False, MOTIVO_COMFY_FORA, True
    if job is not None and not precisa_comfy(job) and not await p.ace_backend.ace_vivo():
        return False, 'O ACE-Step está desligado ou iniciando', True
    ocupado, motivo = await estudio_ocupado(p)
    if ocupado:
        return False, 'Aguardando a placa ficar livre' + (f' ({motivo})' if motivo else ''), True
    return True, '', False


async def estado_ocupado(p):
    """Resposta do GET /api/ocupado (o estúdio pergunta antes de mandar imagem ou vídeo para a placa).

    Só conta música DO PAINEL. A fila da ComfyUI é a mesma do estúdio: se o painel dissesse "ocupado" por causa de
    um vídeo que está lá, o próximo trabalho do estúdio ficaria "esperando a música" sem haver música nenhuma."""
    ocupado, motivo = ocupado_local(p)
    if ocupado:
        return True, motivo
    if DESPACHO['intencao'] and time.time() - DESPACHO['intencao'] < 30:
        return True, 'Uma música vai começar agora'
    try:
        async with ClientSession(timeout=ClientTimeout(total=1.5)) as s:
            async with s.get(p.BASE + '/queue') as r:
                q = await r.json(content_type=None)
        if any(_do_painel(p, linha) for linha in (q.get('queue_running') or []) + (q.get('queue_pending') or [])):
            return True, 'Uma música do painel está na ComfyUI'  # ex.: o painel reiniciou no meio da geração
    except Exception:
        pass
    fila = [j for j in p.JOBS.values() if j.get('state') == 'running' and na_fila(j)]
    if fila:
        if DESPACHO['aguardando_outro']:  # esperando o vídeo ou a ComfyUI ligar: a placa não está em uso pela música
            espera = DESPACHO.get('motivo') or 'Aguardando o vídeo terminar'
            return False, f'{len(fila)} música(s) na fila, parada(s): {espera[:1].lower() + espera[1:]}'
        return True, f'{len(fila)} música(s) na fila'
    return False, 'Música livre'


async def enviar(p, api):
    r = await p.comfy('POST', '/prompt', json={'prompt': api, 'client_id': p.CLIENTE})
    return r['prompt_id']


def audios_da_saida(item):
    return [a for out in item['outputs'].values() for a in out.get('audio', [])]


async def separar_voz(p, audio):
    """Roda o MelBandRoFormer num áudio da saída e devolve o item do instrumental."""
    origem = p.OUTPUT / audio['subfolder'] / audio['filename']
    nome = 'painel_separar_' + uuid.uuid4().hex[:10] + origem.suffix
    copia = p.INPUT / nome
    await asyncio.to_thread(shutil.copyfile, origem, copia)
    try:
        api = carregar(p, SEPARAR)
        api['1']['inputs']['audio'] = nome
        api['2']['inputs']['model_name'] = 'MelBandRoformer_fp16.safetensors'
        api.pop('4', None)  # descarta a trilha de voz
        api['5'] = {'class_type': 'SaveAudio', 'inputs': {'audio': ['3', 1],
                    'filename_prefix': 'audio/' + origem.stem + '_sem_voz'}}
        pid = await enviar(p, api)
        for _ in range(1800):
            h = await p.comfy('GET', '/history/' + pid)
            if pid in h:
                if h[pid]['status']['status_str'] != 'success':
                    raise ValueError('O separador de voz falhou.')
                saida = audios_da_saida(h[pid])
                if not saida:
                    raise ValueError('O separador de voz não gerou áudio.')
                return saida[0]
            await asyncio.sleep(2)
        raise ValueError('O separador de voz demorou demais.')
    finally:
        with contextlib.suppress(OSError):
            copia.unlink(missing_ok=True)  # a cópia só serve durante a separação


async def finalizar(p, job, audio):
    """Depois de gerar: tira a voz (se pedido), aplica o final suave, grava as etiquetas no arquivo e conclui.

    Se algo do acabamento der erro, a música não se perde: fica o áudio original com um aviso."""
    try:
        await _finalizar(p, job, audio)
    except asyncio.CancelledError:
        raise
    except Exception:
        job.update(state='done', audio=copy.deepcopy(audio[:1]),
                   finish_warning='Não foi possível terminar o acabamento (tirar voz / final suave); ficou o áudio original.')
        for chave in ('nm_phase', 'fase_final', 'audio_bruto', 'aviso_fila', 'nm_aviso'):
            job.pop(chave, None)
        p.save_jobs()


async def _finalizar(p, job, audio):
    s = job['settings']
    audio = copy.deepcopy(audio[:1])
    job['audio_bruto'] = copy.deepcopy(audio)
    job.pop('aviso_fila', None)
    if s.get('remove_vocals') and s.get('engine') not in ('stable-audio3', 'separador'):
        job['fase_final'] = 'separando'
        p.save_jobs()
        try:
            sem_voz = await separar_voz(p, audio[0])
            job['original_audio'] = copy.deepcopy(audio)
            audio = [sem_voz]
            job['voz_removida'] = True
        except Exception as exc:
            job['voz_removida'] = False
            job['finish_warning'] = 'Não deu para tirar a voz; ficou o original. ' + catalogo.traduzir_erro(exc)[:120]
    job['fase_final'] = 'finalizando'
    p.save_jobs()
    if s.get('fade_out'):
        antes = audio
        try:
            audio = [await p.fade_audio(audio[0])]
            if job.get('voz_removida'):
                job.setdefault('intermediarios', []).extend(copy.deepcopy(antes))  # o "_sem_voz" sem o final suave
            else:
                job.setdefault('original_audio', copy.deepcopy(antes))
        except Exception:
            job['finish_warning'] = (job.get('finish_warning', '') + ' Final suave indisponível; ficou sem o final suave.').strip()
    motor_id, motor_nome, detalhe = catalogo.motor_do_job({**job, 'state': 'done'}, p.JOBS)
    rotulo = motor_nome + (' · ' + detalhe.lower() if detalhe else '')
    vistos = set()
    for item in audio + job.get('original_audio', []):
        chave = (item.get('subfolder'), item.get('filename'))
        if chave not in vistos:
            vistos.add(chave)
            with contextlib.suppress(Exception):
                await p.gravar_metadados(item, job.get('title', ''), rotulo, s.get('style_original') or s.get('style', ''))
    p.limpar_entradas(job)
    if job.get('started'):
        job['elapsed'] = round(time.time() - job['started'], 1)
    job.update(state='done', audio=audio, duracao_s=p.duracao_item(audio[0]), motor_id=motor_id, motor_nome=motor_nome)
    for chave in ('nm_phase', 'fase_final', 'audio_bruto', 'aviso_fila', 'nm_aviso'):
        job.pop(chave, None)
    p.save_jobs()


async def concluir(p, job, item):
    audio = audios_da_saida(item)
    if not audio:
        raise ValueError('A geração terminou sem áudio.')
    if job['settings'].get('engine') == 'yue2-int8':
        if item['outputs'].get('11'):
            job['score_inspection'] = item['outputs']['11']
        if item['outputs'].get('12'):
            job['audio_inspection'] = item['outputs']['12']
    await finalizar(p, job, audio)


async def acompanhar(p, enviado):
    h = await p.comfy('GET', '/history/' + enviado['prompt_id'])
    item = h.get(enviado['prompt_id'])
    if item:
        if item['status']['status_str'] == 'success':
            try:
                await concluir(p, enviado, item)
            except Exception as exc:
                audio = audios_da_saida(item)[:1]
                if not audio:
                    enviado.update(state='error', error=str(exc)[:500])
                else:  # a música saiu: não perde o resultado por causa de um erro no acabamento
                    enviado.update(state='done', audio=audio,
                                   finish_warning='Não foi possível terminar o acabamento (tirar voz / final suave); ficou o áudio original.')
                for chave in ('nm_phase', 'fase_final', 'audio_bruto'):
                    enviado.pop(chave, None)
                p.save_jobs()
        else:
            msgs = item['status'].get('messages', [])
            erro = next((m[1].get('exception_message') for m in msgs if m[0] == 'execution_error'), None)
            enviado.update(state='error', error=(erro or 'Geração cancelada.')[:500])
            enviado.pop('nm_phase', None)
            p.limpar_entradas(enviado)
            p.save_jobs()
    else:
        q = await p.comfy('GET', '/queue')
        if not any(r[1] == enviado['prompt_id'] for r in q['queue_running'] + q['queue_pending']):
            enviado.update(state='error', error='Geração interrompida ou servidor reiniciado.')
            enviado.pop('nm_phase', None)
            p.limpar_entradas(enviado)
            p.save_jobs()


async def despachar(p, job):
    """Manda UMA tarefa para a placa (a placa já foi conferida como livre)."""
    job.pop('aviso_fila', None)
    job.pop('nm_aviso', None)
    DESPACHO.update(aguardando_outro=False, motivo='')
    # (Antes daqui o painel mandava a ComfyUI de VÍDEO soltar os modelos. Agora a ComfyUI é a mesma: ela própria
    # troca o modelo de vídeo pelo de música quando o pedido chega.)
    if job.get('fase_final') == 'pendente':
        if job['state'] == 'running':  # o acabamento não pode ser cancelado (a música já existe)
            await finalizar(p, job, job['audio_bruto'])
        return
    async with p.LOCK:
        # O dono pode ter tirado a música da fila nesse meio tempo: confere de novo, com a trava, antes de mandar
        # qualquer coisa para a placa.
        if job['state'] != 'running' or not na_fila(job):
            return
        if job.get('ace_phase') == 'queued':
            job['ace_phase'] = 'liberado'  # o worker do ACE-Step (ace_backend) envia
            p.save_jobs()
            return
        engine = job['settings']['engine']
        if engine != 'separador':
            try:
                api = montar(p, engine, job['settings']) if engine in ENGINES else p.montar_yue2(job['settings'])
                prompt_id = await enviar(p, api)
            except (ClientError, OSError, asyncio.TimeoutError) as exc:
                job['aviso_fila'] = 'Aguardando: ' + catalogo.traduzir_erro(exc, generico='falha de conexão; tentando de novo.')[:120]  # falha de conexão: tenta de novo
                return
            except Exception as exc:  # pedido recusado (validação da ComfyUI, fluxo quebrado): não fica tentando para sempre
                job.update(state='error', error=(getattr(exc, 'text', None) or str(exc) or type(exc).__name__)[:500])
                job.pop('nm_phase', None)
                p.limpar_entradas(job)
                p.save_jobs()
                return
            job.update(prompt_id=prompt_id, nm_phase='gerando', started=time.time())
            p.save_jobs()
            return
        job.update(nm_phase='separando', started=time.time())  # daqui em diante não dá mais para tirar da fila
        p.save_jobs()
    try:
        await rodar_separador(p, job)
    except Exception as exc:
        job.update(state='error', error=str(exc)[:500] or type(exc).__name__)
        job.pop('nm_phase', None)
        p.save_jobs()


def recuperar(p):
    """Painel reiniciado no meio de uma tarefa: retoma sem perder o que já foi gerado.

    Só grava o jobs.json se algo mudou aqui (antes gravava sempre, logo na subida)."""
    mudou = False
    for j in p.JOBS.values():
        if j.get('state') != 'running':
            continue
        if j.get('audio_bruto'):
            if j.get('fase_final') != 'pendente' or 'nm_phase' in j:
                j['fase_final'] = 'pendente'  # a geração terminou; falta tirar a voz / final suave
                j.pop('nm_phase', None)
                mudou = True
        elif eh_novo(j) and j.get('nm_phase') == 'separando':
            j['nm_phase'] = 'queued'  # botão "Tirar voz": dá para repetir do começo
            mudou = True
    if mudou:
        p.save_jobs()


def aviso_comfy_fora(p):
    """Texto do aviso quando a ComfyUI está fora do ar: o motivo que o estúdio deu para não ligar (motor não
    instalado, estúdio fechado...) ou, sem motivo, há quanto tempo o painel espera (depois de 3 min)."""
    desde = DESPACHO.get('comfy_fora_desde') or time.time()
    DESPACHO['comfy_fora_desde'] = desde
    recado = getattr(p, 'PEDIDO_COMFY', {}).get('erro')
    if recado:
        return 'A ComfyUI não ligou: ' + recado
    minutos = int((time.time() - desde) // 60)
    if minutos < 3:
        return MOTIVO_COMFY_FORA
    return (f'A ComfyUI está desligada há {minutos} min. Ligue "Imagem e vídeo (ComfyUI)" no Início do estúdio; '
            'a música continua na fila.')


async def ciclo(p):
    ativos = [j for j in p.JOBS.values() if j['state'] == 'running']
    enviado = next((j for j in ativos if eh_novo(j) and j.get('nm_phase') == 'gerando'), None)
    if enviado:
        await acompanhar(p, enviado)
        return
    # termina sem esperar a placa o que não precisa dela (só final suave e etiquetas)
    for j in ativos:
        if j.get('fase_final') == 'pendente' and not j['settings'].get('remove_vocals'):
            await finalizar(p, j, j['audio_bruto'])
    if ocupado_local(p)[0]:
        return
    fila = sorted((j for j in p.JOBS.values() if j['state'] == 'running' and na_fila(j)), key=lambda j: j['created'])
    if not fila:
        DESPACHO.update(aguardando_outro=False, motivo='', comfy_fora_desde=None)
        return
    alvo, comfy_fora = fila[0], False
    if precisa_comfy(alvo) and any(not precisa_comfy(j) for j in fila):
        comfy_fora = await estado_comfy(p) == 'fora'
        if comfy_fora:  # o ACE-Step Oficial não usa a ComfyUI: passa na frente em vez de ficar preso
            alvo = next(j for j in fila if not precisa_comfy(j))
    livre, motivo, externo = await gpu_livre(p, alvo)
    if comfy_fora or motivo == MOTIVO_COMFY_FORA:
        # Tem música esperando e a ComfyUI está desligada: o painel não a liga, PEDE ao estúdio (no máximo 1 pedido
        # a cada 30 s). Sem isto, uma música posta na fila com a ComfyUI desligada esperaria para sempre.
        await p.pedir_comfy_ao_estudio()
    if livre:
        DESPACHO['intencao'] = time.time()  # anuncia no /api/ocupado e confere de novo
        try:
            await asyncio.sleep(CONFIRMAR_S)
            livre, motivo, externo = await gpu_livre(p, alvo)
            if livre and not ocupado_local(p)[0] and alvo['state'] == 'running' and na_fila(alvo):
                await despachar(p, alvo)
                return
        finally:
            DESPACHO['intencao'] = None
        await asyncio.sleep(random.uniform(0.5, 2.5))  # recuo aleatório para os dois lados não tentarem juntos de novo
    if comfy_fora or motivo == MOTIVO_COMFY_FORA:
        aviso_comfy = aviso_comfy_fora(p)
        if motivo == MOTIVO_COMFY_FORA:
            motivo = aviso_comfy
    else:
        DESPACHO['comfy_fora_desde'] = None
        getattr(p, 'PEDIDO_COMFY', {}).update(ok=False, erro='')  # a ComfyUI respondeu: o recado antigo não vale mais
        aviso_comfy = MOTIVO_COMFY_FORA
    DESPACHO.update(aguardando_outro=externo, motivo=motivo)
    for j in fila:
        j['aviso_fila'] = aviso_comfy if comfy_fora and precisa_comfy(j) else motivo


async def worker(p):
    recuperar(p)
    while True:
        try:
            await ciclo(p)
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # não derruba o painel; tenta de novo no próximo ciclo
            for j in p.JOBS.values():
                if j['state'] == 'running' and na_fila(j):
                    j['aviso_fila'] = 'Aguardando: ' + catalogo.traduzir_erro(
                        exc, generico='o painel teve um erro interno e vai tentar de novo.')[:120]
        await asyncio.sleep(2)


def estagio(job, progress):
    fase = job.get('nm_phase')
    if fase == 'queued':
        return job.get('aviso_fila') or job.get('nm_aviso') or 'Na fila (espera a placa ficar livre)'
    if fase == 'separando':
        return 'Tirando a voz (separador MelBandRoFormer)'
    nome = catalogo.nome(job['settings']['engine'])
    return 'Preparando a geração' if not progress.get('node') else 'Gerando · ' + nome


async def context(app):
    task = asyncio.create_task(worker(app['panel_module']))
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
