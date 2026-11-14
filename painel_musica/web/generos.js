// Gêneros dos exemplos do YuE2 (https://map-yue2.github.io/data/cases.js, 18/09/2026).
// O "valor" (em inglês) é o que vai para a IA; o "rotulo" é o que aparece na tela.
window.generosMusica = [
  ['Afro Trap', 'Afro trap'], ['Afro-Jazz', 'Afro-jazz'], ['Alternative Dance', 'Dance alternativo'],
  ['Ambient', 'Ambiente (ambient)'], ['Arabic Pop', 'Pop árabe'], ['Bachata', 'Bachata'],
  ['Barbershop', 'Barbershop (quarteto vocal)'], ['Bhangra', 'Bhangra (dança indiana)'], ['Big Band', 'Big band'],
  ['Bluegrass', 'Bluegrass (country acústico)'], ['Boogie Woogie', 'Boogie-woogie'], ['Boy Band', 'Boy band (pop de grupo)'],
  ['Celtic Rock', 'Rock celta'], ['Christian Rock', 'Rock cristão'], ['City Pop', 'City pop (pop japonês anos 80)'],
  ['Classical Music', 'Música clássica'], ['Comedy', 'Comédia'], ['Cool Jazz', 'Jazz cool'],
  ['Country Gospel', 'Country gospel'], ['Country Pop', 'Country pop'], ['Country Rock', 'Country rock'],
  ['Cyber Metal', 'Metal cibernético'], ['Dance-Pop', 'Dance pop'], ['Dance-Punk', 'Dance punk'],
  ['Dark Ambient', 'Ambiente sombrio'], ['Disco', 'Disco'], ['Dixieland', 'Dixieland (jazz tradicional)'],
  ['Easy Listening', 'Música leve (easy listening)'], ['Electronic Dance Music', 'Eletrônica dançante (EDM)'],
  ['Electropop', 'Electropop'], ['Emo', 'Emo'], ['Emo-Pop', 'Emo pop'], ['Enka', 'Enka (balada japonesa)'],
  ['Ethio-Jazz', 'Jazz etíope'], ['Eurobeat', 'Eurobeat'], ['Flamenco', 'Flamenco'],
  ['Folktronica', 'Folk eletrônico (folktronica)'], ['Funk', 'Funk (americano)'], ['Funk Rock', 'Funk rock'],
  ['Glam Metal', 'Glam metal'], ['Grime', 'Grime (rap britânico)'], ['Heartland Rock', 'Rock de estrada (heartland)'],
  ['Hi-NRG', 'Hi-NRG (dance anos 80)'], ['Honky Tonk', 'Honky tonk (country de bar)'], ['Indie Rock', 'Rock indie'],
  ['Industrial Hip Hop', 'Hip-hop industrial'], ['Industrial Metal', 'Metal industrial'], ['Italo-Disco', 'Italo disco'],
  ['J-Pop', 'J-pop (pop japonês)'], ['Jazz-Funk', 'Jazz funk'], ['Jazz-Rock', 'Jazz rock'], ['Jump Blues', 'Jump blues'],
  ['Lo-Fi Hip Hop', 'Hip-hop lo-fi'], ['Metal', 'Metal'], ['Nu-Disco', 'Nu-disco'], ['Pop Rock', 'Pop rock'],
  ['R&B', 'R&B'], ['Rap Metal', 'Rap metal'], ['Reggaetón', 'Reggaeton'], ['Rock & Roll', 'Rock and roll'],
  ['Soft Rock', 'Rock suave (soft rock)'], ['Soul', 'Soul'], ['Soul Blues', 'Soul blues'],
  ['Southern Gospel', 'Gospel sulista (EUA)'], ['Southern Soul', 'Soul sulista (EUA)'], ['Space Rock', 'Rock espacial'],
  ['Swing', 'Swing'], ['Swing Revival', 'Swing moderno (revival)'], ['Thrash Metal', 'Thrash metal'],
  ['Yacht Rock', 'Yacht rock (soft rock anos 70)']
].map(([valor, rotulo]) => ({valor, rotulo}));

// Idioma da canção original de cada exemplo.
window.idiomasExemplo = {English: 'inglês', Chinese: 'chinês', Japanese: 'japonês', Korean: 'coreano', Russian: 'russo', Spanish: 'espanhol'};

// Estilos prontos: o texto vai em inglês (as IAs de música entendem melhor), o nome aparece em português.
window.estilosProntos = [
  {id: 'dance', rotulo: 'Eletrônica / Dance', texto: 'Brazilian Portuguese, euphoric electronic dance, melodic saxophone hook, four-on-the-floor beat, warm synthesizers, deep bass, 128 BPM, natural clear Brazilian Portuguese vocals'},
  {id: 'rock', rotulo: 'Rock melódico', texto: 'Brazilian Portuguese, melodic rock ballad, electric guitars, warm bass, acoustic intro, expressive vocals, clear diction'},
  {id: 'acoustic', rotulo: 'Acústico', texto: 'Brazilian Portuguese, intimate acoustic pop, nylon guitar, soft percussion, warm natural vocals, clear diction'},
  {id: 'jazz', rotulo: 'Jazz / Soul', texto: 'Brazilian Portuguese, soulful jazz, Rhodes piano, upright bass, brushed drums, saxophone, warm natural vocals'},
  {id: 'pop', rotulo: 'Pop', texto: 'Brazilian Portuguese, modern pop, catchy chorus, bright synths, melodic bass, polished drums, natural clear vocals'}
];

// Dicionário para o resumo "O que isso pede" (inglês → português). Os mais longos primeiro.
window.termosEstilo = [
  ['brazilian portuguese', 'letra em português'], ['female vocal', 'voz feminina'], ['male vocal', 'voz masculina'],
  ['electric guitar', 'guitarra elétrica'], ['acoustic guitar', 'violão'], ['nylon guitar', 'violão de náilon'],
  ['upright bass', 'contrabaixo acústico'], ['slap bass', 'baixo slap'], ['electric piano', 'piano elétrico'],
  ['four-on-the-floor', 'batida de pista (4 por 4)'], ['power chord', 'acordes de força'], ['drum machine', 'bateria eletrônica'],
  ['guitar', 'guitarra'], ['bass', 'baixo'], ['808', 'grave 808'], ['drums', 'bateria'], ['drum', 'bateria'],
  ['percussion', 'percussão'], ['rhodes', 'piano Rhodes'], ['piano', 'piano'], ['synthesizer', 'sintetizador'],
  ['synth', 'sintetizador'], ['strings', 'cordas'], ['violin', 'violino'], ['cello', 'violoncelo'],
  ['orchestral', 'orquestral'], ['orchestra', 'orquestra'], ['brass', 'metais'], ['saxophone', 'saxofone'],
  ['sax', 'saxofone'], ['trumpet', 'trompete'], ['flute', 'flauta'], ['clarinet', 'clarinete'], ['organ', 'órgão'],
  ['choir', 'coral'], ['harp', 'harpa'], ['accordion', 'sanfona'], ['banjo', 'banjo'], ['ukulele', 'ukulele'],
  ['xylophone', 'xilofone'], ['handclap', 'palmas'], ['pipa', 'pipa (alaúde chinês)'], ['duet', 'dueto'],
  ['rap', 'rap'], ['melancholic', 'melancólico'], ['sad', 'triste'], ['happy', 'alegre'], ['upbeat', 'animado'],
  ['energetic', 'enérgico'], ['dark', 'sombrio'], ['romantic', 'romântico'], ['epic', 'épico'], ['dreamy', 'sonhador'],
  ['calm', 'calmo'], ['gentle', 'suave'], ['aggressive', 'agressivo'], ['heavy', 'pesado'], ['danceable', 'dançante'],
  ['groovy', 'com groove'], ['funky', 'funkeado'], ['cinematic', 'cinematográfico'], ['nostalgic', 'nostálgico'],
  ['retro', 'retrô'], ['playful', 'brincalhão'], ['intimate', 'intimista'], ['emotional', 'emotivo'],
  ['atmospheric', 'atmosférico'], ['distorted', 'distorcido'], ['reverb', 'reverberação'], ['ballad', 'balada'],
  ['instrumental', 'instrumental'], ['fast', 'rápido'], ['slow', 'lento']
];
window.idiomasCanto = [
  [/\b(?:mandarin|chinese|cantonese)\b/i, 'mandarim/chinês'], [/\bjapanese\b/i, 'japonês'], [/\bkorean\b/i, 'coreano'],
  [/\bspanish\b/i, 'espanhol'], [/\brussian\b/i, 'russo'], [/\benglish\b/i, 'inglês']
];
