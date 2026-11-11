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
 * Idiomas: português (o HTML), inglês e espanhol. Para acrescentar um quarto, basta criar
 * o dicionário, pôr a sigla em DICIONARIOS e em ETIQUETA, e um <option> no seletor - nada
 * mais no resto do programa precisa saber que ele existe.
 *
 * Isto cobre a CASCA (topo, menu) e a tela de Início. O resto da tela continua em
 * português mesmo com outro idioma escolhido - e é assim que tem de ser até alguém traduzir.
 *
 * ## NÃO marque texto que o JavaScript reescreve
 *
 * Marcar o title do chip da máquina foi erro meu: o app.js escreve ali o estado da
 * máquina a cada pulso. Trocar de idioma apagava um aviso vivo, e o pulso seguinte
 * apagava a tradução de volta. Só se marca aqui o que está PARADO no HTML.
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

    // ---- o seletor de idioma
    'idioma.rotulo': 'Language',
    'idioma.pt': 'Português',
    'idioma.en': 'English',
    'idioma.es': 'Español',

    // ---- tela de Início
    'inicio.titulo': 'What are we <em>forging</em> today?',
    'inicio.sub': 'Images, video, talking people, narration and music — forged on your own '
      + 'graphics card. No monthly fee, no cloud, no waiting in anyone’s queue.',

    // ---- os cartões das IAs (o texto fixo; o nome e o resumo vêm do preset)
    'ia.velocidade': 'Speed',
    'ia.qualidade': 'Quality',
    'ia.deCinco': '{n} out of 5',
    'ia.carregada': 'already loaded',
    'ia.carregadaDica': 'This was the last AI used: the model should still be in memory, so '
      + 'the next one comes out faster.',
    'ia.escolhida': 'Selected',
    'ia.saiba': 'Learn more',
    'ia.saibaSobre': 'Learn more about {q}',
    'ia.nenhuma': 'No AI available in this section.',
    'ia.quantasNaSecao': '{n} AIs in this section. Tap one to choose it.',
    'ia.recolher': 'Collapse',
    'ia.trocar': 'Switch AI · {n} options',
    'ia.baixando': 'Downloading… {pc}%',
    'ia.de': 'of',
    'ia.faltaAntes': 'Not installed yet —',
    'ia.faltaMao': 'Not installed yet — {gb} GB, download by hand',
    'ia.faltaDica': '{q} is not installed yet. {gb} GB. Click to download.',
    'ia.semLinkDica': '{n} file(s) have no known download address. See IAS-INSTALADAS.md.',
    'ia.confirmaBaixar': 'Download "{q}"?\n\nThat is {gb} GB. You can keep using the studio '
      + 'while it downloads, and if it stops halfway it resumes from where it stopped.',
    'ia.comecando': 'Starting the download.',
    'ia.naoComecou': 'Could not start.',
    'ia.semEstudio': 'I could not reach the studio.',

    // ---- o resto da tela (texto parado no HTML, marcado em 11/11/2026)
    'tela.entre-na-sua-conta': 'Sign in to your account',
    'tela.as-ferramentas-daqui-sao-de': 'The tools here are free and run on your own graphics '
      + 'card. The account is only so the licence is in your name.',
    'tela.ja-tenho-conta': 'I already have an account',
    'tela.criar-conta': 'Create account',
    'tela.entrar': 'Sign in',
    'tela.esqueci-minha-senha': 'I forgot my password',
    'tela.continue-de-onde-parou': 'Pick up where you left off',
    'tela.sua-maquina': 'Your machine',
    'tela.sem-programar-voce-descreve-ela': 'No coding. You describe it, it writes the '
      + 'shortcut, you click.',
    'tela.o-que-colar-na-conversa': 'What to paste into the chat with the AI (click to open)',
    'tela.cole-este-bloco-e-ela': 'Paste this block and it already knows how to talk to the studio:',
    'tela.conheca-as-ias-do-estudio': 'Meet the studio’s AIs',
    'tela.clique-numa-ia-para-ver': 'Click an AI to see its full sheet.',
    'tela.escolha-a-ia': 'Choose the AI',
    'tela.em-teste-ainda-nao-liberadas': 'In testing — not released yet',
    'tela.como-comecar': 'How to start',
    'tela.clique-arraste-ou-cole-ctrl': 'Click, drag or paste (Ctrl+V) the image',
    'tela.descrever-esta-imagem': 'Describe this image',
    'tela.adicionar-imagens-rosto-roupa-carro': 'Add images (face, clothes, car, scenery…)',
    'tela.video-de-movimento': 'Motion video',
    'tela.1-pessoa-camera-parada-corpo': '1 person, still camera, full body',
    'tela.enquadramento-do-personagem': 'Framing the character',
    'tela.video-1-quadro': 'Video (1st frame)',
    'tela.personagem-enquadrado': 'Character framed',
    'tela.escrever-o-texto': 'Write the text',
    'tela.antes': 'Before',
    'tela.usar-como-prompt': 'Use as prompt',
    'tela.juntar-ao-prompt': 'Add to the prompt',
    'tela.desfazer': 'Undo',
    'tela.voz-e-motor-do-video': 'Voice and video engine',
    'tela.idioma-da-fala': 'Spoken language',
    'tela.escolha-uma-salva-ou-clone': '(pick a saved one or clone a new one)',
    'tela.clonar-uma-voz-nova-envie': 'Clone a new voice: send 10–20 s of the voice alone '
      + '(no music)',
    'tela.opcional': '(optional)',
    'tela.chave-do-elevenlabs': 'ElevenLabs key',
    'tela.opcional-ele-dubla-esse-audio': '(optional · it dubs this audio instead of the text)',
    'tela.clique-ou-arraste-o-audio': 'Click or drag the audio it will speak',
    'tela.motor-do-video': 'Video engine',
    'tela.ajustes': 'Settings',
    'tela.estilo': 'Style',
    'tela.formato': 'Format',
    'tela.resolucao': 'Resolution',
    'tela.duracao': 'Length',
    'tela.qualidade': 'Quality',
    'tela.forca-da-transformacao': 'Strength of the change',
    'tela.baixa-fica-parecida-com-a': 'Low = stays close to the original. High = changes more.',
    'tela.avancado': 'Advanced',
    'tela.vazio-aleatoria-repita-a-mesma': '(empty = random; repeat the same one to redo it '
      + 'identically)',
    'tela.o-painel-de-musica-esta': 'The music panel is off',
    'tela.ele-gera-musicas-com-letra': 'It makes songs with sung lyrics, instrumentals, and '
      + 'separates the voice (YuE2, ACE-Step, MiniMax Music, Stable Audio). Turning it on '
      + 'takes about 30 seconds.',
    'tela.ligar-musica': 'Turn on music',
    'tela.o-que-a-maquina-esta': 'What the machine is making right now',
    'tela.limpar-historico': 'Clear history',
    'tela.sim-limpar': 'Yes, clear it',
    'tela.deixa': 'Never mind',
    'tela.uma-tomada-so-sem-corte': 'One take, no cuts',
    'tela.a-cena-em-portugues': 'The scene, in your own words',
    'tela.duracao-2': 'Length',
    'tela.tamanho-do-quadro': 'Frame size',
    'tela.opcional-2': '(optional)',
    'tela.clique-ou-arraste-a-foto': 'Click or drag the photo (optional — without it, the '
      + 'studio invents the person)',
    'tela.tirar-a-foto': 'Remove the photo',
    'tela.ficha-tecnica-e-o-que': 'Spec sheet and what we have learned',
    'tela.a-configuracao': 'The configuration',
    'tela.o-que-ja-aprendemos': 'What we have learned',
    'tela.gerar-a-tomada': 'Make the take',
    'tela.tomadas-geradas': 'Takes made',
    'tela.nenhuma-tomada-ainda-conte-a': 'No takes yet. Describe the scene on the side, pick '
      + 'the length and click Make the take.',
    'tela.nada-por-aqui-ainda': 'Nothing here yet.',
    'tela.carregar-mais': 'Load more',
    'tela.do-texto-ao-video-pronto': 'From text to finished video',
    'tela.video-novo': 'New video',
    'tela.o-texto-da-narracao': 'The narration text',
    'tela.titulo-vira-o-nome-da': 'Title (becomes the folder name)',
    'tela.0-min-de-placa': '0 min of card time',
    'tela.cancelar': 'Cancel',
    'tela.criar-o-video': 'Create the video',
    'tela.limpar-selecao': 'Clear selection',
    'tela.fazer-os-escolhidos': 'Make the selected ones',
    'tela.imagens-de-apoio': 'Supporting images',
    'tela.quantas-imagens': 'How many images',
    'tela.fechar': 'Close',
    'tela.a-voz-local-esta-desligada': 'The local voice is off',
    'tela.ligar-a-voz-local': 'Turn on the local voice',
    'tela.como-ligar-na-mao-nao': 'How to turn it on by hand / I do not have VoiceStudio',
    'tela.abra-o-voicestudio-icone-na': 'Open VoiceStudio (icon on the Desktop or in the '
      + 'Start menu).',
    'tela.espere-a-janela-dele-carregar': 'Wait for its window to finish loading.',
    'tela.texto-para-fala': 'Text to speech',
    'tela.criar-uma-voz': 'Create a voice',
    'tela.clonar-uma-voz': 'Clone a voice',
    'tela.chave-do-elevenlabs-2': 'ElevenLabs key',
    'tela.salvar': 'Save',
    'tela.remover': 'Remove',
    'tela.nenhuma-voz-escolhida': 'No voice chosen',
    'tela.gerar-narracao': 'Make the narration',
    'tela.descreva-a-voz-que-voce': 'Describe the voice you want',
    'tela.ponto-de-partida': 'Starting point',
    'tela.nome-desta-voz': 'Name for this voice',
    'tela.criar-a-voz': 'Create the voice',
    'tela.audio-de-referencia': 'Reference audio',
    'tela.clique-ou-arraste-um-audio': 'Click or drag a clean audio file — one person only, '
      + 'no music. Send 30 s to 1 min: I pick the best 25 s from inside it',
    'tela.pode-deixar-em-branco': '(you can leave this blank)',
    'tela.nao-sei-descobre-pelo-audio': 'I do not know — work it out from the audio',
    'tela.nome-desta-voz-2': 'Name for this voice',
    'tela.clone-apenas-a-sua-propria': 'Only clone your own voice, or the voice of someone '
      + 'who gave you permission.',
    'tela.clonar-a-voz': 'Clone the voice',
    'tela.configuracoes': 'Settings',
    'tela.voz': 'Voice',
    'tela.apagar-esta-voz': 'Delete this voice',
    'tela.sim-apagar': 'Yes, delete it',
    'tela.deixa-2': 'Never mind',
    'tela.idioma': 'Language',
    'tela.emocao-e-entrega': 'Emotion and delivery',
    'tela.criar-uma-voz-com-essa': 'Create a voice with this delivery',
    'tela.devagar': 'slow',
    'tela.rapido': 'fast',
    'tela.ajuste-fino': 'Fine tuning',
    'tela.rapido-2': 'fast',
    'tela.caprichado': 'careful',
    'tela.mais-passos-mais-tempo-de': 'More steps = more card time for the same speech. At 16 '
      + 'the narration comes out well and faster than real time.',
    'tela.tudo-isto-roda-no-seu': 'All of this runs on your computer. No text leaves here and '
      + 'there is no monthly fee.'
  };

  // Espanhol (11/11/2026). Entrou pelos vizinhos: toda a América Latina menos o Brasil.
  // É a língua mais barata de manter ao lado do português, porque as duas andam juntas.
  var ES = {
    // ---- topo e menu
    'nav.inicio': 'Inicio',
    'nav.tudo': 'Mis creaciones',
    'nav.imagem': 'Imagen',
    'nav.video': 'Vídeo',
    'nav.apresentador': 'Persona hablando',
    'nav.plano': 'Plano secuencia',
    'nav.canal': 'Canal',
    'nav.voz': 'Narración',
    'nav.musica': 'Música',
    'nav.fila': 'Cola',
    'nav.secoes': 'Secciones',
    'topo.marca': 'JerS Forja Studio — inicio',

    // ---- o seletor de idioma
    'idioma.rotulo': 'Idioma',
    'idioma.pt': 'Português',
    'idioma.en': 'English',
    'idioma.es': 'Español',

    // ---- tela de Início
    'inicio.titulo': '¿Qué vamos a <em>forjar</em> hoy?',
    'inicio.sub': 'Imágenes, vídeo, personas hablando, narración y música — forjados en tu '
      + 'propia tarjeta gráfica. Sin mensualidad, sin nube, sin esperar en la cola de nadie.',

    // ---- os cartões das IAs (o texto fixo; o nome e o resumo vêm do preset)
    'ia.velocidade': 'Velocidad',
    'ia.qualidade': 'Calidad',
    'ia.deCinco': '{n} de 5',
    'ia.carregada': 'ya cargada',
    'ia.carregadaDica': 'Fue la última IA usada: el modelo debería seguir en memoria, así '
      + 'que la próxima sale más rápido.',
    'ia.escolhida': 'Elegida',
    'ia.saiba': 'Saber más',
    'ia.saibaSobre': 'Saber más sobre {q}',
    'ia.nenhuma': 'No hay ninguna IA disponible en esta sección.',
    'ia.quantasNaSecao': '{n} IAs en esta sección. Toca una para elegirla.',
    'ia.recolher': 'Plegar',
    'ia.trocar': 'Cambiar de IA · {n} opciones',
    'ia.baixando': 'Descargando… {pc}%',
    'ia.de': 'de',
    'ia.faltaAntes': 'Falta instalar —',
    'ia.faltaMao': 'Falta instalar — {gb} GB, descargar a mano',
    'ia.faltaDica': '{q} todavía no está instalada. {gb} GB. Pulsa para descargar.',
    'ia.semLinkDica': 'Faltan {n} archivo(s) sin dirección de descarga conocida. Mira '
      + 'IAS-INSTALADAS.md.',
    'ia.confirmaBaixar': '¿Descargar "{q}"?\n\nSon {gb} GB. Puedes seguir usando el estudio '
      + 'mientras descarga, y si se corta por la mitad sigue desde donde se quedó.',
    'ia.comecando': 'Empezando a descargar.',
    'ia.naoComecou': 'No se pudo empezar.',
    'ia.semEstudio': 'No conseguí hablar con el estudio.',

    // ---- o resto da tela (texto parado no HTML, marcado em 11/11/2026)
    'tela.entre-na-sua-conta': 'Entra en tu cuenta',
    'tela.as-ferramentas-daqui-sao-de': 'Las herramientas de aquí son gratis y generan en tu '
      + 'propia tarjeta gráfica. La cuenta es solo para que la licencia quede a tu nombre.',
    'tela.ja-tenho-conta': 'Ya tengo cuenta',
    'tela.criar-conta': 'Crear cuenta',
    'tela.entrar': 'Entrar',
    'tela.esqueci-minha-senha': 'Olvidé mi contraseña',
    'tela.continue-de-onde-parou': 'Sigue donde lo dejaste',
    'tela.sua-maquina': 'Tu ordenador',
    'tela.sem-programar-voce-descreve-ela': 'Sin programar. Tú lo describes, ella escribe el '
      + 'atajo, tú pulsas.',
    'tela.o-que-colar-na-conversa': 'Qué pegar en la conversación con la IA (pulsa para abrir)',
    'tela.cole-este-bloco-e-ela': 'Pega este bloque y ya sabe hablar con el estudio:',
    'tela.conheca-as-ias-do-estudio': 'Conoce las IAs del estudio',
    'tela.clique-numa-ia-para-ver': 'Pulsa en una IA para ver su ficha completa.',
    'tela.escolha-a-ia': 'Elige la IA',
    'tela.em-teste-ainda-nao-liberadas': 'En pruebas — todavía no liberadas',
    'tela.como-comecar': 'Cómo empezar',
    'tela.clique-arraste-ou-cole-ctrl': 'Pulsa, arrastra o pega (Ctrl+V) la imagen',
    'tela.descrever-esta-imagem': 'Describir esta imagen',
    'tela.adicionar-imagens-rosto-roupa-carro': 'Añadir imágenes (cara, ropa, coche, escenario…)',
    'tela.video-de-movimento': 'Vídeo de movimiento',
    'tela.1-pessoa-camera-parada-corpo': '1 persona, cámara quieta, cuerpo entero',
    'tela.enquadramento-do-personagem': 'Encuadre del personaje',
    'tela.video-1-quadro': 'Vídeo (1.er fotograma)',
    'tela.personagem-enquadrado': 'Personaje encuadrado',
    'tela.escrever-o-texto': 'Escribir el texto',
    'tela.antes': 'Antes',
    'tela.usar-como-prompt': 'Usar como prompt',
    'tela.juntar-ao-prompt': 'Añadir al prompt',
    'tela.desfazer': 'Deshacer',
    'tela.voz-e-motor-do-video': 'Voz y motor del vídeo',
    'tela.idioma-da-fala': 'Idioma del habla',
    'tela.escolha-uma-salva-ou-clone': '(elige una guardada o clona una nueva)',
    'tela.clonar-uma-voz-nova-envie': 'Clonar una voz nueva: envía 10–20 s solo de la voz '
      + '(sin música)',
    'tela.opcional': '(opcional)',
    'tela.chave-do-elevenlabs': 'Clave de ElevenLabs',
    'tela.opcional-ele-dubla-esse-audio': '(opcional · dobla ese audio en vez del texto)',
    'tela.clique-ou-arraste-o-audio': 'Pulsa o arrastra el audio que va a hablar',
    'tela.motor-do-video': 'Motor del vídeo',
    'tela.ajustes': 'Ajustes',
    'tela.estilo': 'Estilo',
    'tela.formato': 'Formato',
    'tela.resolucao': 'Resolución',
    'tela.duracao': 'Duración',
    'tela.qualidade': 'Calidad',
    'tela.forca-da-transformacao': 'Fuerza del cambio',
    'tela.baixa-fica-parecida-com-a': 'Baja = se parece a la original. Alta = cambia más.',
    'tela.avancado': 'Avanzado',
    'tela.vazio-aleatoria-repita-a-mesma': '(vacío = al azar; repite la misma para rehacerla '
      + 'igual)',
    'tela.o-painel-de-musica-esta': 'El panel de música está apagado',
    'tela.ele-gera-musicas-com-letra': 'Hace canciones con letra cantada, instrumentales, y '
      + 'separa la voz (YuE2, ACE-Step, MiniMax Music, Stable Audio). Encenderlo tarda unos '
      + '30 segundos.',
    'tela.ligar-musica': 'Encender la música',
    'tela.o-que-a-maquina-esta': 'Lo que el ordenador está generando ahora',
    'tela.limpar-historico': 'Borrar el historial',
    'tela.sim-limpar': 'Sí, borrar',
    'tela.deixa': 'Déjalo',
    'tela.uma-tomada-so-sem-corte': 'Una sola toma, sin cortes',
    'tela.a-cena-em-portugues': 'La escena, en tus palabras',
    'tela.duracao-2': 'Duración',
    'tela.tamanho-do-quadro': 'Tamaño del fotograma',
    'tela.opcional-2': '(opcional)',
    'tela.clique-ou-arraste-a-foto': 'Pulsa o arrastra la foto (opcional — sin ella, el '
      + 'estudio se inventa a la persona)',
    'tela.tirar-a-foto': 'Quitar la foto',
    'tela.ficha-tecnica-e-o-que': 'Ficha técnica y lo que hemos aprendido',
    'tela.a-configuracao': 'La configuración',
    'tela.o-que-ja-aprendemos': 'Lo que hemos aprendido',
    'tela.gerar-a-tomada': 'Generar la toma',
    'tela.tomadas-geradas': 'Tomas generadas',
    'tela.nenhuma-tomada-ainda-conte-a': 'Todavía no hay tomas. Cuenta la escena al lado, '
      + 'elige la duración y pulsa Generar la toma.',
    'tela.nada-por-aqui-ainda': 'Aquí todavía no hay nada.',
    'tela.carregar-mais': 'Cargar más',
    'tela.do-texto-ao-video-pronto': 'Del texto al vídeo terminado',
    'tela.video-novo': 'Vídeo nuevo',
    'tela.o-texto-da-narracao': 'El texto de la narración',
    'tela.titulo-vira-o-nome-da': 'Título (será el nombre de la carpeta)',
    'tela.0-min-de-placa': '0 min de tarjeta',
    'tela.cancelar': 'Cancelar',
    'tela.criar-o-video': 'Crear el vídeo',
    'tela.limpar-selecao': 'Limpiar la selección',
    'tela.fazer-os-escolhidos': 'Hacer los elegidos',
    'tela.imagens-de-apoio': 'Imágenes de apoyo',
    'tela.quantas-imagens': 'Cuántas imágenes',
    'tela.fechar': 'Cerrar',
    'tela.a-voz-local-esta-desligada': 'La voz local está apagada',
    'tela.ligar-a-voz-local': 'Encender la voz local',
    'tela.como-ligar-na-mao-nao': 'Cómo encenderla a mano / no tengo VoiceStudio',
    'tela.abra-o-voicestudio-icone-na': 'Abre VoiceStudio (icono en el Escritorio o en el '
      + 'menú Inicio).',
    'tela.espere-a-janela-dele-carregar': 'Espera a que su ventana termine de cargar.',
    'tela.texto-para-fala': 'Texto a voz',
    'tela.criar-uma-voz': 'Crear una voz',
    'tela.clonar-uma-voz': 'Clonar una voz',
    'tela.chave-do-elevenlabs-2': 'Clave de ElevenLabs',
    'tela.salvar': 'Guardar',
    'tela.remover': 'Quitar',
    'tela.nenhuma-voz-escolhida': 'Ninguna voz elegida',
    'tela.gerar-narracao': 'Generar la narración',
    'tela.descreva-a-voz-que-voce': 'Describe la voz que quieres',
    'tela.ponto-de-partida': 'Punto de partida',
    'tela.nome-desta-voz': 'Nombre de esta voz',
    'tela.criar-a-voz': 'Crear la voz',
    'tela.audio-de-referencia': 'Audio de referencia',
    'tela.clique-ou-arraste-um-audio': 'Pulsa o arrastra un audio limpio — una sola persona, '
      + 'sin música. Manda de 30 s a 1 min: yo elijo los mejores 25 s de dentro',
    'tela.pode-deixar-em-branco': '(puedes dejarlo en blanco)',
    'tela.nao-sei-descobre-pelo-audio': 'No lo sé — descúbrelo por el audio',
    'tela.nome-desta-voz-2': 'Nombre de esta voz',
    'tela.clone-apenas-a-sua-propria': 'Clona solo tu propia voz, o la de quien te haya dado '
      + 'permiso.',
    'tela.clonar-a-voz': 'Clonar la voz',
    'tela.configuracoes': 'Configuración',
    'tela.voz': 'Voz',
    'tela.apagar-esta-voz': 'Borrar esta voz',
    'tela.sim-apagar': 'Sí, borrar',
    'tela.deixa-2': 'Déjalo',
    'tela.idioma': 'Idioma',
    'tela.emocao-e-entrega': 'Emoción y entrega',
    'tela.criar-uma-voz-com-essa': 'Crear una voz con esa entrega',
    'tela.devagar': 'despacio',
    'tela.rapido': 'rápido',
    'tela.ajuste-fino': 'Ajuste fino',
    'tela.rapido-2': 'rápido',
    'tela.caprichado': 'cuidado',
    'tela.mais-passos-mais-tempo-de': 'Más pasos = más tiempo de tarjeta para la misma frase. '
      + 'En 16 la narración sale bien y más rápida que el tiempo real.',
    'tela.tudo-isto-roda-no-seu': 'Todo esto funciona en tu ordenador. Ningún texto sale de '
      + 'aquí y no hay ninguna mensualidad.'
  };

  // O português NÃO entra aqui: ele é o que já está escrito no HTML.
  var DICIONARIOS = { en: EN, es: ES };

  // pt-BR porque é o português que está escrito no HTML; os outros vão como estão.
  var ETIQUETA = { pt: 'pt-BR', en: 'en', es: 'es' };

  // ------------------------------------------------------------------ o estado
  function conhecido(v) {
    // O português é válido sem dicionário - ele é o HTML.
    return v === 'pt' || Object.prototype.hasOwnProperty.call(DICIONARIOS, v);
  }

  function guardado() {
    try {
      var v = localStorage.getItem(CHAVE);
      return conhecido(v) ? v : PADRAO;
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

    // "placeholder:busca.dica" ou "title:botao.dica, aria-label:topo.marca"
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

    document.documentElement.lang = ETIQUETA[atual] || 'pt-BR';
  }

  function trocar(novo) {
    if (!conhecido(novo)) return;
    atual = novo;
    try {
      localStorage.setItem(CHAVE, novo);
    } catch (e) { /* sem armazenamento: vale só para esta aba */ }
    // O seletor também é tela: se alguém trocar por fora (I18N.trocar), ele tem de
    // mostrar o idioma de verdade, e não o de antes.
    var sel = document.getElementById('idiomaSel');
    if (sel && sel.value !== novo) sel.value = novo;
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
      + '<option value="pt">PT</option><option value="en">EN</option>'
      + '<option value="es">ES</option></select>';
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
