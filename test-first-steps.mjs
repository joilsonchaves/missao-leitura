import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const base=['./missao-leitura/dist/','./dist/','./'].map(p=>new URL(p,import.meta.url)).find(p=>fs.existsSync(new URL('literacy-data.js',p)));
const html=fs.readFileSync(new URL('index.html',base),'utf8');
const model={};vm.createContext(model);vm.runInContext(fs.readFileSync(new URL('literacy-data.js',base),'utf8'),model);const L=model.LiteracySteps;
assert.equal(L.modules.length,7);assert.equal(L.alphabet.length,26);assert.equal(L.vowels.length,5);assert.deepEqual(Array.from(L.vowels,c=>c.text),['A','E','I','O','U']);assert.equal(L.joins.length,7);
for(const m of L.modules){assert.equal(new Set(m.cards.map(c=>c.id)).size,m.cards.length);for(const c of m.cards){assert(c.example&&c.icon&&c.note);if(c.parts)assert.equal(c.parts.join(''),c.text);}}
assert.equal(L.alphabet.find(c=>c.text==='H').note.includes('não tem som próprio'),true);assert.equal(L.simple.some(c=>c.family==='H'),false);assert.equal(L.complex.some(c=>c.text==='QUU'),false);
const deck=L.makeDeck('formar',{family:'B',count:10,random:false});assert.equal(deck.length,10);assert(deck.every(c=>c.family==='B'));assert.equal(deck[0].text,'BA');assert.equal(deck[5].text,'BA');assert.equal(L.makeDeck('not-a-module').length,0);assert.equal(L.makeDeck('simples',{family:'NOPE'}).length,0);
const banana=L.words.find(c=>c.text==='BANANA');assert(L.sameParts(banana,['BA','NA','NA']));assert(!L.sameParts(banana,['BA','NA']));assert(!L.sameParts(banana,['NA','BA','NA']));
// Reuse the DOM-free application harness used by the microphone tests.
const harnessURL=['./test-voice-reading.mjs','../test-voice-reading.mjs'].map(p=>new URL(p,import.meta.url)).find(p=>fs.existsSync(p));let harness=fs.readFileSync(harnessURL,'utf8');harness=harness.slice(harness.indexOf('class Element{'),harness.indexOf('const compare=context.ReadingVoice.compare;'));
harness=harness.replace('setAttribute(k,v){','insertAdjacentHTML(where,text){this.innerHTML+=text;}setAttribute(k,v){');
harness=harness.replace("el('setupForm').elements=[...elements.values()];","el('setupForm').elements=[...elements.values()];el('learnSetup').elements=[...elements.values()];");
harness=harness.replace("'app.js','voice-ui.js']","'app.js','voice-ui.js','literacy-data.js','learning-audio.js','literacy-ui.js']");
harness=harness.replace("const run=code=>vm.runInContext(code,context),flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};",'globalThis.testHarness={context,elements,el,run:code=>vm.runInContext(code,context)};');
const host={fs,vm,assert,html,base,Blob,URL,Set,Map,Event,EventTarget,queueMicrotask,console};vm.createContext(host);vm.runInContext(harness,host);const {el,run}=host.testHarness;
const click=id=>el(id).emit('click');
const changed=(id,value)=>{el(id).value=value;return el(id).emit('change');};
run("window.soundNotes=0;window.AudioContext=class{constructor(){this.currentTime=0;this.state='running';this.destination={};}createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){window.soundNotes++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};");
el('learnStudent').value='Leitora de teste';el('learnCount').value='5';el('learnFamily').value='all';el('learnImage').value='hint';el('learnCase').value='upper';
await el('learnSetup').emit('submit');assert(run('LearningWorkshop.active()'));assert.equal(el('learnIndependent').disabled,false);await click('learnIndependent');
assert.equal(run('soundNotes'),3,'A correct card plays the short three-note chime');
await click('learnHint');assert(el('learnIndependent').disabled,'Extra help prevents an independent score');await click('learnIndependent');
await click('learnPractice');await click('learnIndependent');await click('learnSupported');assert.equal(run('LearningWorkshop.active()'),false);assert(el('learnResultDialog').open);
const saved=JSON.parse(run("localStorage.getItem('missao-leitura-first-steps-v1')"));assert.equal(saved.length,1);assert.equal(saved[0].answers.length,5);assert.equal(saved[0].answers[1].outcome,'supported');assert.equal(saved[0].answers[2].outcome,'practice');assert.equal(run('records.length'),0,'Early activities must not inflate reading words');assert.equal(run("localStorage.getItem('missao-leitura-results-v1')"),null);
assert.equal(L.validRecord(saved[0]),true);assert.equal(L.validRecord({...saved[0],settings:undefined}),false);assert(L.practiceAgain(saved,'vogais').some(c=>c.id===saved[0].answers[2].cardId));
// A new independent attempt resolves that card in the targeted revision pool.
const retry=L.practiceAgain([...saved,{...saved[0],date:'2099-01-01T10:00:00.000Z',answers:[{cardId:saved[0].answers[2].cardId,outcome:'independent'}]}],'vogais');assert(!retry.some(c=>c.id===saved[0].answers[2].cardId));
el('learnResultDialog').close();await changed('learnModule','palavrinhas');el('learnFamily').value='inicio';el('learnCount').value='5';await el('learnSetup').emit('submit');assert(el('learnIndependent').disabled,'Construction needs an assembled answer');await click('learnModel');assert(el('learnIndependent').disabled);assert.equal(el('learnSupported').disabled,false);await click('learnSupported');await click('learnEnd');assert.equal(JSON.parse(run("localStorage.getItem('missao-leitura-first-steps-v1')")).length,2);
// Empty rounds do not create records. A paused lesson cannot be scored.
el('learnResultDialog').close();await el('learnSetup').emit('submit');await click('learnPause');await click('learnPractice');await click('learnEnd');assert.equal(JSON.parse(run("localStorage.getItem('missao-leitura-first-steps-v1')")).length,2);
assert.equal(run('records.length'),0);assert.match(el('learnDashboardSummary').innerHTML,/2 rodadas/);
// Repeated checks of one assembled answer must not repeat the reward sound.
await changed('learnModule','formar');el('learnFamily').value='B';await el('learnSetup').emit('submit');
const cardClick=button=>el('learnCard').emit('click',{target:{closest:()=>button}});
await cardClick({dataset:{learnTile:'0'}});await cardClick({dataset:{learnTile:'1'}});const beforeSound=run('soundNotes');await cardClick({dataset:{},id:'learnCheckParts'});assert.equal(run('soundNotes'),beforeSound+3);await cardClick({dataset:{},id:'learnCheckParts'});assert.equal(run('soundNotes'),beforeSound+3);
el('learnSounds').checked=false;await el('learnSounds').emit('change');await click('learnIndependent');assert.equal(run('soundNotes'),beforeSound+3,'Muting stops additional reward sounds');await click('learnEnd');
console.log('OK: 7 atividades, letras e exemplos, famílias, peças repetidas, registro de apoio, revisão dirigida, pausa, rodadas vazias, persistência e preservação das palavras/estrelas.');
// Spoken models stay distinct from examples; hearing a model is recorded as help.
run("window.spoken=[];window.speechSynthesis={cancel(){},getVoices:()=>[{lang:'pt-BR',localService:true}],speak:u=>window.spoken.push(u)};window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};");
await changed('learnModule','simples');el('learnFamily').value='B';await click('learnSpeak');await click('learnListen');
assert.deepEqual(Array.from(run('spoken'),u=>u.text),['ba','bala']);assert.equal(run('LearningWorkshop.active()'),false,'Preview audio must not create student results');
await el('learnSetup').emit('submit');await click('learnSpeak');assert(el('learnIndependent').disabled);assert(!el('learnSupported').disabled);await click('learnSupported');await click('learnEnd');
const latest=JSON.parse(run("localStorage.getItem('missao-leitura-first-steps-v1')")).at(-1);assert.equal(latest.answers[0].supportUsed,true);
const A=host.testHarness.context.LiteracyAudio;
assert.equal(A.model({text:'E',spoken:'é'},'vogais'),'é');assert.equal(A.model({text:'E'},'vogais','closed'),'ê');assert.equal(A.model({text:'O'},'vogais','closed'),'ô');assert.equal(A.model({text:'BRA'},'complexas'),'bra');
assert.equal(A.chooseVoice([{lang:'en-US',localService:true}]),null);assert.equal(A.chooseVoice([{lang:'pt-BR',localService:false}],true),null);assert.equal(A.chooseVoice([{lang:'pt-PT',localService:true},{lang:'pt-BR',localService:false}]).lang,'pt-BR');
run("speechSynthesis.getVoices=()=>[{lang:'en-US',localService:true}];window.spoken=[];");await click('learnSpeak');assert.equal(run('spoken.length'),0);assert.match(el('learnFeedback').textContent,/português/);
console.log('OK: áudio da vogal/sílaba e exemplo, variantes E/O, escolha de voz portuguesa, modo offline e registro de apoio.');
