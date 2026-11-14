import importlib.util
import json
import sys
from pathlib import Path

# Upstream native-dialect parser; source and scope recorded in SOURCE.txt.
spec = importlib.util.spec_from_file_location('fz_native_abc', Path(__file__).with_name('abc_tools.py'))
abc = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = abc
spec.loader.exec_module(abc)


class FZScoreGuard:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {'score': ('STRING', {'multiline': True}),
                             'instrumental': ('BOOLEAN', {'default': False}),
                             'require_vocal': ('BOOLEAN', {'default': False})}}

    RETURN_TYPES = ('STRING',)
    FUNCTION = 'check'
    CATEGORY = 'audio/yue2'
    OUTPUT_NODE = True

    def check(self, score, instrumental=False, require_vocal=False):
        try:
            parsed = abc.parse_abc(score)
        except ValueError as exc:
            raise ValueError('Nao foi possivel validar a partitura no formato suportado. '
                             'A geracao foi parada antes da sintese. Detalhe: ' + str(exc)) from exc
        original = score
        if instrumental:
            # Retain the native timing and chord symbols, replacing only sung notes.
            lines = score.splitlines(keepends=True)
            for index, voice in parsed.music_lines.items():
                if voice == 'Vocal':
                    def silence(match):
                        if match.group('note') is not None:
                            return 'z' + match.group('duration')
                        return match.group(0)
                    lines[index] = abc.TOKEN.sub(silence, lines[index])
            score = ''.join(lines)
            checked = abc.parse_abc(score)
            if checked.voices['Vocal'].notes:
                raise ValueError('A partitura instrumental ainda contem notas vocais.')
            if parsed.voices['Ins'].notes != checked.voices['Ins'].notes:
                raise ValueError('A verificacao detectou alteracao na melodia instrumental.')
            parsed = checked
        elif require_vocal and not parsed.voices['Vocal'].notes:
            raise ValueError('Nao foram encontradas notas de canto na referencia. '
                             'Escolha um trecho com voz ou use Criar musica.')
        summary = {'bpm': parsed.bpm,
                   'vocal_notes': len(parsed.voices['Vocal'].notes),
                   'instrumental_notes': len(parsed.voices['Ins'].notes),
                   'instrumental': instrumental,
                   'scope': 'Estrutura simbolica; nao confirma qualidade do audio ou diccao.'}
        return {'ui': {'text': [json.dumps(summary, ensure_ascii=False)],
                       'score_original': [original], 'score_used': [score]}, 'result': (score,)}


class FZAudioHeadroom:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {'audio': ('AUDIO',)}}

    RETURN_TYPES = ('AUDIO',)
    FUNCTION = 'protect'
    CATEGORY = 'audio'
    OUTPUT_NODE = True

    def protect(self, audio):
        import torch
        waveform = audio['waveform']
        if not torch.isfinite(waveform).all():
            raise ValueError('Audio contem valores invalidos; exportacao interrompida.')
        peak = waveform.abs().amax(dim=(-2, -1), keepdim=True)
        # Attenuation only, linked stereo gain; no limiting or compression.
        gain = (10 ** (-1.5 / 20) / peak.clamp_min(1e-12)).clamp(max=1)
        result = {**audio, 'waveform': waveform * gain}
        return {'ui': {'text': [json.dumps({'peak_before': peak.flatten().tolist(),
                                           'gain': gain.flatten().tolist()})]},
                'result': (result,)}


NODE_CLASS_MAPPINGS = {'FZScoreGuard': FZScoreGuard, 'FZAudioHeadroom': FZAudioHeadroom}
NODE_DISPLAY_NAME_MAPPINGS = {'FZScoreGuard': 'FZ - Verificar partitura'}
