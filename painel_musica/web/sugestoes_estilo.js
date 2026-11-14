// Sugestões "combina com" para a descrição do estilo (28/09/2026).
// Cada família: palavras que a ativam (regex, em inglês ou português) e sugestões [valor em inglês -> vai para a IA, rótulo em português].
window.sugestoesEstilo = {
  familias: [
    {chave: /\bpop\b/i, itens: [
      ['dance pop', 'Dance pop'], ['synth pop', 'Synth pop'], ['pop rock', 'Pop rock'], ['electropop', 'Electropop'],
      ['80s pop', 'Pop anos 80'], ['catchy chorus', 'Refrão chiclete'], ['bright synths', 'Sintetizadores brilhantes'],
      ['upbeat', 'Animado'], ['radio-friendly', 'Cara de rádio'], ['120 BPM', '120 BPM']]},
    {chave: /\brock\b/i, itens: [
      ['classic rock', 'Rock clássico'], ['hard rock', 'Hard rock'], ['arena rock', 'Rock de arena'], ['80s rock', 'Rock anos 80'],
      ['pop rock', 'Pop rock'], ['alternative rock', 'Rock alternativo'], ['distorted electric guitar', 'Guitarra distorcida'],
      ['powerful drums', 'Bateria forte'], ['guitar solo', 'Solo de guitarra'], ['anthemic chorus', 'Refrão de estádio'], ['130 BPM', '130 BPM']]},
    {chave: /metal/i, itens: [
      ['heavy metal', 'Heavy metal'], ['power metal', 'Power metal'], ['thrash metal', 'Thrash metal'], ['symphonic metal', 'Metal sinfônico'],
      ['heavy distorted riffs', 'Riffs pesados'], ['double bass drums', 'Bumbo duplo'], ['shredding guitar solo', 'Solo de guitarra rápido'],
      ['aggressive', 'Agressivo'], ['160 BPM', '160 BPM']]},
    {chave: /balad|ballad|romant/i, itens: [
      ['power ballad', 'Power ballad (balada de rock)'], ['romantic ballad', 'Balada romântica'], ['piano', 'Piano'],
      ['strings', 'Cordas (orquestra)'], ['emotional', 'Emocionante'], ['soft drums', 'Bateria suave'], ['70 BPM', '70 BPM']]},
    {chave: /sertanej|country/i, itens: [
      ['sertanejo', 'Sertanejo'], ['sertanejo universitario', 'Sertanejo universitário'], ['moda de viola', 'Moda de viola'],
      ['country pop', 'Country pop'], ['viola caipira', 'Viola caipira'], ['accordion', 'Sanfona'], ['acoustic guitar', 'Violão'],
      ['heartbreak', 'Sofrência'], ['90 BPM', '90 BPM']]},
    {chave: /forr[oó]|piseiro|xote|bai[aã]o|nordest/i, itens: [
      ['forro', 'Forró'], ['piseiro', 'Piseiro'], ['xote', 'Xote'], ['baiao', 'Baião'], ['accordion', 'Sanfona'],
      ['zabumba', 'Zabumba'], ['triangle', 'Triângulo'], ['danceable', 'Dançante'], ['140 BPM', '140 BPM']]},
    {chave: /funk|baile/i, itens: [
      ['brazilian funk', 'Funk brasileiro'], ['funk carioca', 'Funk carioca'], ['80s funk', 'Funk anos 80'], ['slap bass', 'Baixo slap'],
      ['groovy', 'Suingado'], ['808 bass', 'Grave 808'], ['130 BPM', '130 BPM']]},
    {chave: /samba|pagode|mpb|bossa/i, itens: [
      ['samba', 'Samba'], ['pagode', 'Pagode'], ['mpb', 'MPB'], ['bossa nova', 'Bossa nova'], ['cavaquinho', 'Cavaquinho'],
      ['pandeiro', 'Pandeiro'], ['nylon guitar', 'Violão de nylon'], ['warm', 'Aconchegante'], ['100 BPM', '100 BPM']]},
    {chave: /gospel|worship|louvor|crist|christian/i, itens: [
      ['worship', 'Louvor (worship)'], ['gospel', 'Gospel'], ['christian rock', 'Rock cristão'], ['choir', 'Coral'],
      ['piano', 'Piano'], ['uplifting', 'Inspirador'], ['build-up to big chorus', 'Cresce até o refrão'], ['75 BPM', '75 BPM']]},
    {chave: /eletr|electr|edm|house|techno|trance|dance/i, itens: [
      ['EDM', 'EDM (eletrônica dançante)'], ['house', 'House'], ['synthwave', 'Synthwave (anos 80)'], ['trance', 'Trance'],
      ['four-on-the-floor beat', 'Batida 4 por 4'], ['big drop', 'Drop forte'], ['pulsing bass', 'Baixo pulsante'], ['128 BPM', '128 BPM']]},
    {chave: /rap|hip.?hop|trap/i, itens: [
      ['hip hop', 'Hip hop'], ['trap', 'Trap'], ['boom bap', 'Boom bap'], ['808 bass', 'Grave 808'], ['hi-hat rolls', 'Chimbal rápido (trap)'],
      ['dark', 'Sombrio'], ['90 BPM', '90 BPM']]},
    {chave: /jazz|blues|soul|r&b|rnb/i, itens: [
      ['jazz', 'Jazz'], ['blues', 'Blues'], ['soul', 'Soul'], ['r&b', 'R&B'], ['saxophone', 'Saxofone'], ['upright bass', 'Baixo acústico'],
      ['smoky', 'Esfumaçado (clima de bar)'], ['brass section', 'Metais'], ['80 BPM', '80 BPM']]},
    {chave: /reggae|ska/i, itens: [
      ['reggae', 'Reggae'], ['roots reggae', 'Reggae raiz'], ['ska', 'Ska'], ['offbeat guitar', 'Guitarra no contratempo'],
      ['deep bass', 'Baixo grave'], ['relaxed', 'Tranquilo'], ['75 BPM', '75 BPM']]},
    {chave: /ac[uú]stic|acoustic|folk|voz e viol/i, itens: [
      ['acoustic', 'Acústico'], ['folk', 'Folk'], ['acoustic guitar', 'Violão'], ['fingerpicking', 'Dedilhado'],
      ['intimate', 'Intimista'], ['soft vocals', 'Voz suave'], ['85 BPM', '85 BPM']]},
    {chave: /orquest|orchestr|cinem|epic|[ée]pic|trilha|soundtrack/i, itens: [
      ['cinematic', 'Cinematográfico'], ['orchestral', 'Orquestral'], ['epic', 'Épico'], ['strings', 'Cordas (orquestra)'],
      ['choir', 'Coral'], ['big drums', 'Tambores grandes'], ['build-up', 'Crescendo']]},
    {chave: /anos\s*80|\b80s?\b|oitenta/i, itens: [
      ['80s', 'Anos 80'], ['synthwave', 'Synthwave'], ['gated reverb drums', 'Bateria anos 80 (gated reverb)'], ['analog synths', 'Sintetizador analógico'],
      ['arena rock', 'Rock de arena']]},
    {chave: /anos\s*70|\b70s?\b|setenta/i, itens: [
      ['70s', 'Anos 70'], ['classic rock', 'Rock clássico'], ['disco', 'Disco'], ['hammond organ', 'Órgão Hammond'], ['analog warmth', 'Som analógico quente']]},
  ],
  // quando nada bate, sugere o "tempero" que toda descrição boa tem
  gerais: [
    ['catchy chorus', 'Refrão chiclete'], ['emotional', 'Emocionante'], ['upbeat', 'Animado'], ['melancholic', 'Melancólico'],
    ['powerful drums', 'Bateria forte'], ['acoustic guitar', 'Violão'], ['piano', 'Piano'], ['synths', 'Sintetizadores'],
    ['100 BPM', '100 BPM'], ['120 BPM', '120 BPM']],
};
