import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base=['./missao-leitura/dist/','./dist/','./'].map(p=>new URL(p,import.meta.url)).find(p=>fs.existsSync(new URL('voice-reading.js',p)));
const html=fs.readFileSync(new URL('index.html',base),'utf8');
class Element{
  constructor(id=''){this.id=id;this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.open=false;this.textContent='';this.innerHTML='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.listeners={};this.dataset={};this.tagName='DIV';this.children=[];}
  addEventListener(event,fn){(this.listeners[event]??=[]).push(fn);}
  async emit(event,extra={}){for(const fn of this.listeners[event]||[])await fn({preventDefault(){},target:this,...extra});}
  setAttribute(k,v){this[k]=v;}getAttribute(k){return this[k];}
  showModal(){this.open=true;}close(){this.open=false;}focus(){}replaceChildren(){this.children=[];}append(...children){this.children.push(...children);}remove(){}pause(){}querySelector(){return null;}querySelectorAll(){return [];}getTotalLength(){return 100;}getPointAtLength(n){return {x:n,y:n};}
}
const elements=new Map();for(const match of html.matchAll(/<([\w-]+)([^>]*\bid="([^"]+)"[^>]*)>/g)){const element=new Element(match[3]);element.tagName=match[1].toUpperCase();element.value=match[2].match(/\bvalue="([^"]*)"/)?.[1]||'';element.checked=/\bchecked\b/.test(match[2]);elements.set(element.id,element);}
const el=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
for(const match of html.matchAll(/<select[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))el(match[1]).value=match[2].match(/<option[^>]*value="([^"]*)"/)?.[1]||'';
el('setupForm').elements=[...elements.values()];const local=new Map();let now=0;
class FakeRecorder extends EventTarget{
  static isTypeSupported(){return true;}constructor(stream){super();this.stream=stream;this.mimeType='audio/webm';this.state='inactive';}start(){this.state='recording';}pause(){this.state='paused';}resume(){this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic-test-audio'],{type:'audio/webm'})});this.dispatchEvent(new Event('stop'));}
}
class FakeRecognition{
  static latest;start(){FakeRecognition.latest=this;queueMicrotask(()=>this.onstart?.());}abort(){this.onend?.();}say(text,final=true){this.onresult?.({resultIndex:0,results:[Object.assign([{transcript:text}],{isFinal:final})]});}
}
let stopped=0,permissionDenied=false;
const context={console,Blob,URL,Set,Map,Event,performance:{now:()=>now},crypto:{randomUUID:()=>Math.random().toString(16).slice(2)},isSecureContext:true,MediaRecorder:FakeRecorder,SpeechRecognition:FakeRecognition,queueMicrotask,
  navigator:{mediaDevices:{getUserMedia:async()=>{if(permissionDenied)throw Object.assign(Error(),{name:'NotAllowedError'});const tracks=[{enabled:true,stop(){stopped++;}}];return {getTracks:()=>tracks,getAudioTracks:()=>tracks};}}},
  localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},location:{hash:'#jogar'},
  document:{body:new Element('body'),activeElement:new Element(),getElementById:el,querySelectorAll:()=>[],querySelector:()=>new Element(),createElement:()=>new Element(),addEventListener(){}},
  requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},addEventListener(){},scrollTo(){},getComputedStyle:()=>({fontSize:'20'})};context.window=context;
vm.createContext(context);for(const file of ['voice-reading.js','reward-cycles.js','app.js','voice-ui.js'])vm.runInContext(fs.readFileSync(new URL(file,base),'utf8'),context,{filename:file});
const run=code=>vm.runInContext(code,context),flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const compare=context.ReadingVoice.compare;
assert.equal(compare('PÉ','pé!').exact,true);assert.equal(compare('GATO','PATO').exact,false);assert.equal(compare('BOLA','BOLACHA').exact,false);assert.equal(compare('MARIA COME O ABACAXI.','Maria Maria come Maria come o Maria come o abacaxi').exact,true);assert.equal(compare('O GATO BEBE LEITE','O GATO LEITE').exact,false);assert.deepEqual(Array.from(compare('O GATO BEBE LEITE','O GATO LEITE').missing),[2]);assert.equal(compare('BOLA','').exact,false);assert.equal(compare('O GATO','GATO O').exact,false);assert.deepEqual(Array.from(compare('A BOLA E A MALA','A BOLA E MALA').missing),[3]);
el('student').value='Teste simulado';el('target').value='2';el('preparation').checked=false;el('shuffle').checked=false;el('sound').checked=false;el('assessmentMode').value='auto';el('voiceConsent').checked=false;
await el('setupForm').emit('submit');assert.match(el('formError').textContent,/Confirme/);assert.equal(run('game'),null);
el('voiceConsent').checked=true;await el('setupForm').emit('submit');await flush();assert.equal(run('game.status'),'running');assert.equal(run('elapsed()'),0);assert.equal(run('voice.recorder.state'),'recording');
const first=run('game.words[0]'),second=run('game.words[1]');now=1000;
FakeRecognition.latest.say(first,false);assert.equal(run('game.answers.length'),0,'Interim results must not score');
FakeRecognition.latest.say('palavra inesperada');assert.equal(run('game.answers.length'),0,'Uncertain speech must not create an error');
FakeRecognition.latest.say(first);assert.equal(run('game.answers.length'),1);
await run('togglePause()');assert.equal(run('voice.recorder.state'),'paused');const used=run('elapsed()');now=9000;assert.equal(run('elapsed()'),used);FakeRecognition.latest.say(second);assert.equal(run('game.answers.length'),1,'No scoring while paused');
await run('togglePause()');now=10000;FakeRecognition.latest.say(second);await flush();assert.equal(el('voiceReview').open,true);assert.equal(run('records.length'),0,'No records before teacher confirmation');assert.equal(run('rewardCycles.state.people && Object.keys(rewardCycles.state.people).length || 0'),0);
await el('voiceReviewList').emit('click',{target:{closest:()=>({dataset:{voiceAnswer:'1',voiceWord:'0'}})}});await el('voiceConfirm').emit('click');await flush();assert.equal(run('records.length'),1);assert.equal(run('records[0].correct'),1);assert.equal(run('records[0].reviewedByTeacher'),true);assert.equal(run('records[0].elapsed'),2,'Paused time is excluded');assert(stopped>=1);
// Discard the next round and verify nothing is added to history or rewards.
el('assessmentMode').value='auto';el('voiceConsent').checked=true;await el('setupForm').emit('submit');await flush();now+=1000;run('finishRound("manual")');await flush();await el('voiceDiscard').emit('click');assert.equal(run('records.length'),1);assert.equal(run('game'),null);
// Permission denial releases the setup and starts no reading clock.
permissionDenied=true;el('voiceConsent').checked=true;await el('setupForm').emit('submit');assert.match(el('formError').textContent,/não foi autorizado/);assert.equal(el('start').disabled,false);assert.equal(run('game'),null);permissionDenied=false;
// Record-only mode preserves teacher marking and commits without speech scoring.
el('assessmentMode').value='record';el('voiceConsent').checked=true;el('target').value='1';await el('setupForm').emit('submit');await flush();now+=1000;run('answer(true)');await flush();assert.equal(run('records.length'),2);assert.equal(run('records[1].assessment'),'record');assert.equal(el('voiceReview').open,false);
// Manual mode still works without microphone permission or recognition support.
permissionDenied=true;el('assessmentMode').value='manual';el('voiceConsent').checked=false;await el('setupForm').emit('submit');await flush();now+=1000;run('answer(true)');await flush();assert.equal(run('records.length'),3);assert.equal(run('records[2].assessment'),'manual');
console.log('OK: correspondência de palavras/frases, consentimento, resultados parciais, incerteza, pausa, revisão, correção, descarte, falha de permissão, gravação e modo manual. Microfone e voz simulados; nenhuma captação real.');
