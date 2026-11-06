(function(root){
'use strict';
function model(card,moduleId,kind='target'){
  if(!card)return '';
  if(kind==='example')return card.example.toLocaleLowerCase('pt-BR');
  if(kind==='closed'&&card.text==='E')return 'ê';
  if(kind==='closed'&&card.text==='O')return 'ô';
  if(moduleId==='vogais'||moduleId==='alfabeto')return card.spoken||card.text.toLocaleLowerCase('pt-BR');
  return card.text.toLocaleLowerCase('pt-BR');
}
function voices(available,offline=false){const seen=new Set();return available.filter(v=>/^pt(?:[-_]|$)/i.test(v.lang)&&(!offline||v.localService)).filter(v=>{const key=v.voiceURI||v.name||v.lang;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>score(a)-score(b));}
function chooseVoice(available,offline=false,preferred=''){const list=voices(available,offline);return list.find(v=>preferred&&(v.voiceURI||v.name)===preferred)||list[0]||null;}
function score(v){const name=v.name||'',locale=/^pt[-_]BR$/i.test(v.lang)?0:100,natural=/natural|neural|online|premium|enhanced/i.test(name)?-30:/google/i.test(name)?-20:0;return locale+natural+(v.localService?8:0);}
function label(moduleId){return moduleId==='vogais'?'🔊 Ouvir vogal':moduleId==='alfabeto'?'🔊 Ouvir nome da letra':moduleId==='juncoes'?'🔊 Ouvir encontro de vogais':moduleId==='palavrinhas'?'🔊 Ouvir palavra':'🔊 Ouvir sílaba';}
root.LiteracyAudio={model,chooseVoice,voices,label};
})(typeof window==='undefined'?globalThis:window);
