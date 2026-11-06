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
function chooseVoice(voices,offline=false){return voices.filter(v=>/^pt(?:[-_]|$)/i.test(v.lang)&&(!offline||v.localService)).slice().sort((a,b)=>score(a)-score(b))[0]||null;}
function score(v){return (/^pt[-_]BR$/i.test(v.lang)?0:2)+(v.localService?0:1);}
function label(moduleId){return moduleId==='vogais'?'🔊 Ouvir vogal':moduleId==='alfabeto'?'🔊 Ouvir nome da letra':moduleId==='juncoes'?'🔊 Ouvir encontro de vogais':moduleId==='palavrinhas'?'🔊 Ouvir palavra':'🔊 Ouvir sílaba';}
root.LiteracyAudio={model,chooseVoice,label};
})(typeof window==='undefined'?globalThis:window);
