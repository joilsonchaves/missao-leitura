(function(){
'use strict';
let clip=null,source=null;const played=new Set();
function explosionSource(){
 if(source)return source;const rate=22050,count=Math.floor(rate*.78),buffer=new ArrayBuffer(44+count*2),v=new DataView(buffer);let seed=73;
 const text=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};text(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,count*2,true);
 let low=0,phase=0;for(let i=0;i<count;i++){const t=i/rate;seed=(1664525*seed+1013904223)>>>0;low=.74*low+.26*(seed/2147483648-1);phase+=2*Math.PI*(65+105*Math.exp(-t*16))/rate;const envelope=Math.min(1,t/.012)*Math.exp(-t*6)*Math.min(1,(.78-t)/.08);const value=(low*.7+Math.sin(phase)*.3)*envelope*.65;v.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,value))*32767),true);}
 let binary='';for(const byte of new Uint8Array(buffer))binary+=String.fromCharCode(byte);source='data:audio/wav;base64,'+btoa(binary);return source;
}
function stop(){if(clip){clip.onended=null;clip.pause();clip.src='';clip=null;}}
function reset(){stop();document.querySelector('.mission-hud')?.classList.remove('time-over');}
function timeExpired(result){if(result.reason!=='time'||played.has(result.id))return;played.add(result.id);document.querySelector('.mission-hud')?.classList.add('time-over');if(!$('sound').checked||typeof Audio==='undefined')return;stop();try{clip=new Audio(explosionSource());clip.volume=.65;clip.onended=stop;clip.play()?.catch(stop);}catch{stop();}}
$('sound').addEventListener('change',()=>{if(!$('sound').checked)stop();});
window.MissionTimer={reset,timeExpired,explosionSource};
})();
