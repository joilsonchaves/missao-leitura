(function(root){
'use strict';
const p=(at,duration,from,to,wave='sine',vibrato=0,rough=0)=>({at,duration,from,to,wave,vibrato,rough});
const calls={
 cat:{parts:[p(0,.48,780,430,'triangle',8),p(.42,.28,430,260,'sine',4)]},
 dog:{parts:[p(0,.19,190,90,'sawtooth',0,18),p(.33,.22,220,95,'sawtooth',0,22)]},
 fox:{parts:[p(0,.17,680,410,'triangle',15),p(.27,.15,750,450,'triangle',18),p(.52,.2,850,500,'triangle',14)]},
 rabbit:{parts:[p(0,.13,950,1180,'sine',22),p(.26,.13,1100,850,'sine',18),p(.5,.1,1050,1200,'sine',12)]},
 bear:{parts:[p(0,.78,105,65,'sawtooth',9,35)]},
 panda:{parts:[p(0,.24,310,210,'triangle',16,9),p(.4,.3,350,230,'triangle',18,8)]},
 koala:{parts:[p(0,.35,90,65,'sawtooth',6,30),p(.45,.32,115,70,'sawtooth',7,25)]},
 monkey:{parts:[p(0,.14,520,820,'triangle',20),p(.2,.15,500,850,'triangle',22),p(.4,.25,460,1000,'triangle',18)]},
 lion:{parts:[p(0,.88,135,60,'sawtooth',7,38),p(.9,.23,90,62,'sawtooth',5,20)]},
 tiger:{parts:[p(0,.6,155,80,'sawtooth',12,30),p(.67,.24,120,70,'triangle',10,20)]},
 frog:{parts:[p(0,.24,170,105,'triangle',28),p(.34,.24,190,115,'triangle',30),p(.67,.18,160,100,'triangle',25)]},
 owl:{parts:[p(0,.3,440,390),p(.46,.45,420,350)]},
 penguin:{file:'animal-penguin.ogg',parts:[p(0,.24,520,780,'triangle',32,10),p(.34,.28,690,420,'triangle',28,12)]},
 pig:{parts:[p(0,.2,190,105,'sawtooth',23,18),p(.32,.22,210,115,'sawtooth',26,14),p(.67,.16,180,110,'triangle',22)]},
 cow:{parts:[p(0,.85,150,95,'triangle',5,8),p(.8,.28,105,75,'sine',4)]},
 mouse:{parts:[p(0,.09,1350,1720),p(.19,.1,1500,1250),p(.43,.13,1450,1800)]},
 hamster:{parts:[p(0,.13,1100,1450,'sine',18),p(.27,.12,1250,1000,'sine',22)]},
 raccoon:{parts:[p(0,.1,420,600,'triangle',15),p(.14,.11,480,650,'triangle',18),p(.3,.1,440,570,'triangle',15),p(.44,.15,540,400,'triangle',22)]},
 wolf:{parts:[p(0,.42,210,430,'sine',4),p(.36,.65,430,390,'sine',5),p(.96,.4,390,180,'triangle',4)]},
 seal:{parts:[p(0,.21,270,160,'sawtooth',15,12),p(.34,.22,300,180,'sawtooth',18,12),p(.69,.22,280,155,'sawtooth',14,10)]},
 otter:{parts:[p(0,.12,820,1160,'sine',24),p(.21,.12,1100,800,'sine',20),p(.42,.15,950,1250,'triangle',22)]},
 elephant:{parts:[p(0,.25,190,520,'sawtooth',9,16),p(.19,.48,520,400,'sawtooth',12,18),p(.62,.28,400,190,'triangle',9,12)]},
 giraffe:{parts:[p(0,1.1,95,110,'sine',3)]},
 deer:{parts:[p(0,.45,260,200,'triangle',19,8),p(.5,.34,300,180,'triangle',21,5)]},
 sheep:{parts:[p(0,.65,240,170,'triangle',23,8),p(.68,.24,190,145,'triangle',20,5)]}
};
// Render small PCM clips so every avatar uses the same player as the recording.
// These are playful effects, not recordings of the animals.
const effects=new Map();
function effectSource(type){
 if(effects.has(type))return effects.get(type);
 const call=calls[type]||{parts:[p(0,.2,520,780),p(.25,.25,780,1040)]},rate=22050;
 const duration=Math.max(...call.parts.map(part=>part.at+part.duration))+.08;
 const samples=new Float32Array(Math.ceil(duration*rate));
 for(const part of call.parts){let phase=0;const count=Math.floor(part.duration*rate),start=Math.floor(part.at*rate);
  for(let i=0;i<count;i++){const t=i/rate,f=part.from*Math.pow(part.to/part.from,t/part.duration),vibrato=part.vibrato?1+.025*Math.sin(2*Math.PI*part.vibrato*t):1;phase+=2*Math.PI*Math.max(180,f)*vibrato/rate;
   const wave=part.wave==='sawtooth'?.65*Math.sin(phase)+.25*Math.sin(2*phase)+.1*Math.sin(3*phase):part.wave==='triangle'?.9*Math.sin(phase)+.1*Math.sin(3*phase):Math.sin(phase);
   const attack=Math.min(1,t/.018),release=Math.min(1,(part.duration-t)/.045);samples[start+i]+=wave*attack*release;
  }
 }
 const peak=Math.max(.01,...samples.map(Math.abs)),buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const label=(at,value)=>{for(let i=0;i<value.length;i++)view.setUint8(at+i,value.charCodeAt(i));};
 label(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);label(8,'WAVE');label(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);label(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(samples[i]/peak*.48*32767),true);
 let binary='';for(const byte of new Uint8Array(buffer))binary+=String.fromCharCode(byte);
 const source='data:audio/wav;base64,'+root.btoa(binary);effects.set(type,source);return source;
}
function firstName(name){return String(name||'').trim().match(/[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*/u)?.[0].slice(0,30)||'';}
function intro(name,localVoice){const who=localVoice?firstName(name):'';return who?'Atenção, '+who+'! Vamos começar em…':'Atenção! Vamos começar em…';}
root.AnimalCalls={calls,effectSource,firstName,intro};
})(typeof window==='undefined'?globalThis:window);
