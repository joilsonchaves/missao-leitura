(function(root){
'use strict';
const letterRows=[
['A','a','ABELHA','🐝','á'],['B','b','BOLA','⚽','bê'],['C','c','CASA','🏠','cê'],['D','d','DADO','🎲','dê'],['E','e','ELEFANTE','🐘','é'],['F','f','FOCA','🦭','efe'],['G','g','GATO','🐱','gê'],['H','h','HELICÓPTERO','🚁','agá'],['I','i','ILHA','🏝️','i'],['J','j','JANELA','🪟','jota'],['K','k','KIWI','🥝','cá'],['L','l','LUA','🌙','ele'],['M','m','MACACO','🐒','eme'],['N','n','NAVIO','🚢','ene'],['O','o','OVO','🥚','ó'],['P','p','PATO','🦆','pê'],['Q','q','QUEIJO','🧀','quê'],['R','r','RATO','🐭','erre'],['S','s','SAPO','🐸','esse'],['T','t','TATU','tatu','tê'],['U','u','UVA','🍇','u'],['V','v','VACA','🐮','vê'],['W','w','WAFFLE','🧇','dáblio'],['X','x','XÍCARA','☕','xis'],['Y','y','YOGA','🧘','ípsilon'],['Z','z','ZEBRA','🦓','zê']
];
const letterNotes={H:'O H no início de HELICÓPTERO não tem som próprio. Compare a letra escrita e o nome da figura.',C:'Em CASA, o C tem som de /k/. Em CEBOLA e CIDADE, o som muda.',G:'Em GATO, o G tem um som; em GELO e GIRAFA, outro. Escute palavras conhecidas.',Q:'No português, o Q aparece acompanhado de U: QUEIJO, QUILO, QUATRO.',R:'O som do R muda de acordo com sua posição na palavra. Aqui, observe RATO.',S:'O S de SAPO e o S entre vogais de CASA têm sons diferentes.',X:'O X pode ter sons diferentes. Aqui, use o exemplo XÍCARA.',K:'K, W e Y fazem parte do alfabeto. Aparecem em nomes próprios e palavras de outras línguas.',W:'Em WAFFLE, o W costuma ter som de /w/. Seu som varia em outras palavras.',Y:'YOGA também pode ser escrita IOGA. Aqui, o exemplo ajuda a reconhecer a letra Y.'};
const alphabet=letterRows.map(([text,lower,example,icon,spoken])=>({id:'letter-'+text,text,lower,example,icon,spoken,note:letterNotes[text]||'Observe a letra, diga seu nome e encontre-a na palavra da figura.'}));
const vowelExample={A:alphabet[0],E:alphabet[4],I:alphabet[8],O:alphabet[14],U:alphabet[20]};
const vowels='AEIOU'.split('').map(text=>({...vowelExample[text],id:'vowel-'+text,note:'Diga o nome da vogal e escute como ela aparece na palavra. E e O podem ter sons diferentes em outras palavras.'}));
const joins=[['AI','🤕','AI!','Uma expressão de dor ou surpresa.'],['AU','🐶','AU!','Uma maneira de escrever o latido do cachorro.'],['EI','🙋','EI!','Uma maneira de chamar alguém.'],['EU','🧒','EU','A palavra que usamos para falar de nós mesmos.'],['OI','👋','OI!','Uma palavra para cumprimentar.'],['UI','😮','UI!','Uma expressão de surpresa.'],['OU','🪙','OURO','Observe OU no começo de OURO.']].map(([text,icon,example,note])=>({id:'join-'+text,text,parts:[...text],icon,example,note,spoken:example}));
const simpleRows=[
['B',['BALA','BEBÊ','BICO','BOLA','BULE'],'🍬'],['C',['CASA','CEBOLA','CIDADE','COPO','CUBO'],'🏠'],['D',['DADO','DEDO','DICA','DOCE','DUCHA'],'🎲'],['F',['FADA','FERA','FITA','FOCA','FUBÁ'],'🧚'],['G',['GATO','GELO','GIRAFA','GOTA','GULA'],'🐱'],['J',['JANELA','JEGUE','JILÓ','JOGO','JUCA'],'🪟'],['L',['LATA','LEME','LIMA','LOBO','LUA'],'🌙'],['M',['MALA','MESA','MICO','MOLA','MULA'],'🧳'],['N',['NADA','NETO','NINHO','NOVE','NUVEM'],'☁️'],['P',['PATO','PERA','PIPA','POTE','PUMA'],'🦆'],['R',['RATO','REDE','RIMA','RODA','RUA'],'🐭'],['S',['SAPO','SELO','SINO','SOPA','SUCO'],'🐸'],['T',['TATU','TELA','TIJOLO','TOCA','TUBO'],'🦔'],['V',['VACA','VELA','VIDA','VOVÓ','VUVUZELA'],'🐮'],['X',['XADREZ','XERIFE','XÍCARA','XODÓ','XUXU'],'♟️'],['Z',['ZAGA','ZERO','ZÍPER','ZONA','ZUNIDO'],'🦓']
];
// XUXU is not the standard spelling for the vegetable; use the proper-name example XUXA instead.
simpleRows.find(r=>r[0]==='X')[1][4]='XUXA';
const simple=simpleRows.flatMap(([family,examples,icon])=>[...'AEIOU'].map((v,i)=>({id:'simple-'+family+v,text:family+v,parts:[family,v],family,example:examples[i],icon,note:family==='C'||family==='G'?letterNotes[family]:'Junte a consoante e a vogal. Depois, encontre essa sílaba na palavra de exemplo.'})));
const complexRows=[
['BR','BRA: BRAÇO|BRE: BREJO|BRI: BRIGA|BRO: BROA|BRU: BRUXA','🧙'],
['CR','CRA: CRAVO|CRE: CREME|CRI: CRIANÇA|CRO: CROSTA|CRU: CRU','🌸'],
['DR','DRA: DRAGÃO|DRE: DRENAGEM|DRI: DRIBLE|DRO: DROMEDÁRIO','🐉'],
['FR','FRA: FRALDA|FRE: FREVO|FRI: FRIO|FRO: FROTA|FRU: FRUTA','🍓'],
['GR','GRA: GRAMA|GRE: GREVE|GRI: GRILO|GRO: GROSELHA|GRU: GRUTA','🦗'],
['PR','PRA: PRATO|PRE: PREGO|PRI: PRIMO|PRO: PROVA|PRU: PRUMO','🍽️'],
['TR','TRA: TRATOR|TRE: TREVO|TRI: TRIGO|TRO: TROCO|TRU: TRUQUE','🚜'],
['VR','VRA: PALAVRA|VRE: LIVRE|VRI: LIVRINHO|VRO: LIVRO','📖'],
['BL','BLA: BLÁ-BLÁ-BLÁ|BLE: PROBLEMA|BLI: BIBLIOTECA|BLO: BLOCO|BLU: BLUSA','👕'],
['CL','CLA: CLARO|CLE: CHICLETE|CLI: CLIMA|CLO: CLORO|CLU: CLUBE','☀️'],
['FL','FLA: FLAUTA|FLE: FLECHA|FLI: AFLITO|FLO: FLORESTA|FLU: FLUTUAR','🌷'],
['GL','GLA: GLACÊ|GLE: GLEBA|GLI: GLICERINA|GLO: GLOBO|GLU: AGLUTINAR','🌐'],
['PL','PLA: PLACA|PLE: PLENO|PLI: APLIQUE|PLO: DIPLOMA|PLU: PLUMA','🪶'],
['CH','CHA: CHAVE|CHE: CHEIRO|CHI: CHINELO|CHO: CHOCOLATE|CHU: CHUVA','🔑'],
['NH','NHA: ARANHA|NHE: RECONHECER|NHI: COMPANHIA|NHO: NINHO|NHU: NENHUMA','🕷️'],
['LH','LHA: PALHA|LHE: BILHETE|LHI: FILHINHO|LHO: COELHO|LHU: ABELHUDO','🐰'],
['QU','QUA: QUATRO|QUE: LEQUE|QUI: QUILO|QUO: QUOTA','🧀'],
['GU','GUA: ÁGUA|GUE: FOGUETE|GUI: GUITARRA|GUO: AMBÍGUO','🚀'],
['FINAIS','AR: ARCO|ER: ERVA|IR: IRMÃO|OR: ORCA|UR: URSO|SOL: SOL|MAR: MAR|MEL: MEL|SAL: SAL|SUL: SUL|LAR: LAR|LUZ: LUZ','☀️'],
['NASAIS','PÃO: PÃO|MÃO: MÃO|CÃO: CÃO|MÃE: MÃE|AN: ANJO|EN: ENXADA|IN: INSETO|ON: ONDA|UN: UNTAR','🌊']
];
const complex=complexRows.flatMap(([family,examples,icon])=>examples.split('|').map(pair=>{const [text,example]=pair.split(':').map(s=>s.trim());return {id:'complex-'+text,text,family,example,icon,note:family==='QU'||family==='GU'?'Em QUE, QUI, GUE e GUI, o U nem sempre é pronunciado. Compare o grupo dentro da palavra.':family==='NASAIS'?'Perceba a passagem do ar pelo nariz. A professora modela a pronúncia em uma palavra conhecida.':['CH','NH','LH'].includes(family)?'Duas letras juntas representam um som nesse grupo. Leia a sílaba e depois a palavra.':'Leia o grupo dentro da palavra de exemplo. O apoio da professora ajuda a juntar os sons.'};}));
const wordRows=[
['BOLA','BO LA','⚽'],['SAPO','SA PO','🐸'],['PATO','PA TO','🦆'],['CASA','CA SA','🏠'],['SOPA','SO PA','🍲'],['MOTO','MO TO','🏍️'],['PIPA','PI PA','🪁'],['BOCA','BO CA','👄'],['DEDO','DE DO','☝️'],['SACO','SA CO','🛍️'],['LOBO','LO BO','🐺'],['LATA','LA TA','🥫'],['ROSA','RO SA','🌹'],['VELA','VE LA','🕯️'],['PUMA','PU MA','🐈'],['DADO','DA DO','🎲'],['BALA','BA LA','🍬'],['VACA','VA CA','🐮'],['GATO','GA TO','🐱'],['MALA','MA LA','🧳'],['BICO','BI CO','🐦'],['FITA','FI TA','🎀'],['REDE','RE DE','🕸️'],['FADA','FA DA','🧚'],['BANANA','BA NA NA','🍌'],['GIRAFA','GI RA FA','🦒'],['PIPOCA','PI PO CA','🍿'],['SAPATO','SA PA TO','👟'],['MACACO','MA CA CO','🐒'],['TOMATE','TO MA TE','🍅'],['CAVALO','CA VA LO','🐴'],['JANELA','JA NE LA','🪟'],['TUCANO','TU CA NO','🦜'],['BONECA','BO NE CA','🪆'],['COELHO','CO E LHO','🐰'],['CHUVA','CHU VA','🌧️'],['PRATO','PRA TO','🍽️'],['LIVRO','LI VRO','📖'],['FLORESTA','FLO RES TA','🌳'],['ESTRELA','ES TRE LA','⭐']
];
const words=wordRows.map(([text,parts,icon])=>({id:'word-'+text,text,parts:parts.split(' '),example:text,icon:text==='PUMA'?'puma':text==='REDE'?'🥅':icon,family:parts.split(' ').some(s=>s.length>2)?'desafio':'inicio',note:'Junte as sílabas na ordem. A palavra inteira aparece ao conferir.'}));
const exampleIcons=Object.fromEntries([...alphabet,...words].map(c=>[c.example,c.icon]));
Object.assign(exampleIcons,{FERA:'🦁',VUVUZELA:'🎺',ZAGA:'⚽',ZUNIDO:'🐝',LEQUE:'🪭',BILHETE:'📝',TREVO:'☘️',GROSELHA:'🍒',BEBÊ:'👶',BULE:'🫖',CEBOLA:'🧅',CIDADE:'🏙️',COPO:'🥛',CUBO:'🧊',DOCE:'🍭',DUCHA:'🚿',FESTA:'🎉',FUBÁ:'🌽',GELO:'🧊',GOTA:'💧',JEGUE:'🫏',JOGO:'🎮',LEME:'⚓',LIMA:'🍋',MESA:'🪑',MICO:'🐒',NINHO:'🪺',NOVE:'9️⃣',NUVEM:'☁️',PERA:'🍐',POTE:'🫙',RODA:'🛞',RUA:'🛣️',SELO:'✉️',SINO:'🔔',SUCO:'🧃',TELA:'🖥️',TIJOLO:'🧱',TUBO:'🧪',VIDA:'🌱',VOVÓ:'👵',VULCÃO:'🌋',ZERO:'0️⃣',ZÍPER:'🤐',BRAÇO:'💪',BRUXA:'🧙',CRAVO:'🌸',CRIANÇA:'🧒',CRUZ:'✝️',DRAGÃO:'🐉',DROMEDÁRIO:'🐪',FRALDA:'👶',FRIO:'🥶',FRUTA:'🍓',GRAMA:'🌱',GRILO:'🦗',GRUTA:'🪨',PREGO:'🔩',TRATOR:'🚜',TREM:'🚂',TRIGO:'🌾',TROCO:'🪙',BIBLIOTECA:'📚',BLOCO:'🧱',BLUSA:'👕',CHICLETE:'🍬',CLIMA:'🌤️',FLAUTA:'🪈',FLECHA:'🏹',FLOR:'🌷',FLUTUAR:'🎈',GLOBO:'🌐',PLACA:'🪧',DIPLOMA:'📜',PLUMA:'🪶',CHAVE:'🔑',CHINELO:'🩴',CHOCOLATE:'🍫',ARANHA:'🕷️',BANHEIRO:'🚽',PALHA:'🌾',COLHER:'🥄',QUATRO:'4️⃣',ÁGUA:'💧',FOGUETE:'🚀',GUITARRA:'🎸',ARCO:'🏹',ERVA:'🌿',IRMÃO:'🧒',ORCA:'🐋',URSO:'🐻',SOL:'☀️',MAR:'🌊',MEL:'🍯',SAL:'🧂',LAR:'🏡',LUZ:'💡',PÃO:'🍞',MÃO:'✋',CÃO:'🐶',MÃE:'👩',ANJO:'👼',INSETO:'🐞',ONDA:'🌊',UNHA:'💅'});
for(const card of [...simple,...complex])card.icon=exampleIcons[card.example]||'🔤';
const modules=[
{id:'vogais',title:'Vogais',icon:'A',subtitle:'A, E, I, O, U · com ou sem imagem',unit:'vogais',kind:'read',cards:vowels},
{id:'juncoes',title:'Juntar vogais',icon:'OI',subtitle:'O + I = OI · um encontro de sons',unit:'junções',kind:'build',cards:joins},
{id:'alfabeto',title:'Alfabeto ilustrado',icon:'Aa',subtitle:'26 letras e palavras conhecidas',unit:'letras',kind:'read',cards:alphabet},
{id:'simples',title:'Sílabas simples',icon:'BA',subtitle:'Famílias de sílabas para descobrir',unit:'sílabas',kind:'read',cards:simple},
{id:'complexas',title:'Sílabas complexas',icon:'BRA',subtitle:'Encontros, dígrafos e outros grupos',unit:'sílabas',kind:'read',cards:complex},
{id:'formar',title:'Formar sílabas',icon:'B+A',subtitle:'Toque nas letras para juntá-las',unit:'sílabas formadas',kind:'build',cards:simple},
{id:'palavrinhas',title:'Montar palavras',icon:'SA·PO',subtitle:'Sílabas que se tornam palavras',unit:'palavras montadas',kind:'build',cards:words}
];
const byId=id=>modules.find(m=>m.id===id);
function shuffled(a,random=Math.random){const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function makeDeck(moduleId,{family='all',count=5,random=true}={}){const module=byId(moduleId);if(!module)return [];const cards=module.cards.filter(c=>family==='all'||c.family===family);if(!cards.length)return [];const size=Math.min(30,Math.max(1,Number(count)||5)),out=[];while(out.length<size)out.push(...(random?shuffled(cards):cards));return out.slice(0,size);}
function sameParts(card,parts){return card.parts?.length===parts.length&&card.parts.every((p,i)=>p===parts[i]);}
function summarize(rows){const summary={rounds:rows.length,cards:0,independent:0,supported:0,practice:0};for(const r of rows)for(const a of r.answers||[]){summary.cards++;if(a.outcome==='independent')summary.independent++;else if(a.outcome==='supported')summary.supported++;else summary.practice++;}return summary;}
function practiceAgain(rows,moduleId){const latest=new Map();rows.filter(r=>r.moduleId===moduleId).sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>(r.answers||[]).forEach(a=>latest.set(a.cardId,a.outcome)));return byId(moduleId)?.cards.filter(c=>latest.has(c.id)&&latest.get(c.id)!=='independent')||[];}
function validRecord(r){const m=byId(r?.moduleId);return !!m&&typeof r.id==='string'&&typeof r.name==='string'&&typeof r.classroom==='string'&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))&&!!r.settings&&typeof r.settings.family==='string'&&['always','hint','none'].includes(r.settings.image)&&['upper','lower','both'].includes(r.settings.letterCase)&&Number.isInteger(r.planned)&&r.planned>0&&r.planned<=30&&Array.isArray(r.answers)&&r.answers.length<=r.planned&&r.answers.every(a=>m.cards.some(c=>c.id===a.cardId)&&['independent','supported','practice'].includes(a.outcome));}
root.LiteracySteps={modules,alphabet,vowels,joins,simple,complex,words,byId,shuffled,makeDeck,sameParts,summarize,practiceAgain,validRecord};
})(typeof window==='undefined'?globalThis:window);
