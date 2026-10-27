/* Integration with the existing reading round; transcripts stay in this browser. */
'use strict';
let voiceCardText=[],pendingVoiceResult=null,pendingVoiceBlob=null,audioViewSerial=0;
const voice=new ReadingVoice.VoiceCapture({
  isReading:()=>game?.status==='running'&&game.assessment==='auto',
  onStatus:message=>{$('voiceStatus').textContent=message;},
  onText:(text,final)=>{
    if(!game||game.status!=='running'||game.assessment!=='auto')return;
    $('voiceHeard').textContent=(final?'Ouvi: ':'Ouvindo: ')+text;
    if(!final)return;
    voiceCardText.push(text);voiceCardText=voiceCardText.slice(-30);
    const expected=game.words[game.answers.length],heard=game.mode==='frases'?voiceCardText.join(' '):text;
    const match=ReadingVoice.compare(expected,heard);
    // Advance only on an exact word/full phrase. Uncertain speech is never an automatic error.
    if(match.exact&&(game.mode==='frases'||ReadingVoice.tokens(text).length===1))answer(true,{heard});
    else $('voiceStatus').textContent='Confira o que foi ouvido. A criança pode tentar novamente; a professora também pode marcar ou avaliar esta fala.';
  }
});
const capabilities=ReadingVoice.VoiceCapture.capabilities();
function updateVoiceSetup(){
  const mode=$('assessmentMode').value;$('voiceConsent').checked=false;$('voiceConsentLabel').hidden=mode==='manual';
  $('voiceHelp').textContent=mode==='manual'?'A professora ouve a leitura e marca cada palavra.':mode==='record'?'Grava a leitura para ouvir, baixar ou guardar neste navegador. A professora marca os acertos.':'Sugere acertos por reconhecimento em português e avança ao reconhecer a palavra ou a frase inteira. Ao final, a professora revisa antes de registrar as estrelas.';
  $('voiceConsentText').textContent=mode==='auto'?'Autorizo o uso do microfone nesta rodada. Sei que a voz pode ser enviada ao serviço de reconhecimento do navegador para transcrição e que o resultado precisa de revisão.':'Autorizo gravar a voz nesta rodada, neste dispositivo. O áudio só será guardado se eu escolher salvar ou baixar.';
  $('voiceSupport').textContent=mode==='manual'?'':!capabilities.record?'Microfone indisponível aqui. Abra o endereço HTTPS num navegador compatível.':mode==='auto'&&!capabilities.recognition?'Reconhecimento indisponível aqui. Use Só gravar ou avaliação manual.':mode==='auto'?'Requer navegador compatível, geralmente Chrome ou Edge, e pode precisar de internet. Fale perto do microfone; evite vozes ao redor.':'Nenhum áudio é enviado pelo jogo no modo Só gravar. Sons do jogo ficam silenciosos durante a captação.';
  $('voiceLive').hidden=mode==='manual';$('voiceEvaluate').hidden=mode!=='auto';
  $('voiceGuidance').textContent=mode==='auto'?'Nas frases em escadinha, leia até a frase inteira. Se o reconhecimento não avançar, use Avaliar esta fala e avançar. Os botões da professora continuam disponíveis.':'A professora acompanha a leitura e marca os acertos normalmente.';
  $('voiceStatus').textContent='O microfone será solicitado ao começar a missão.';$('voiceHeard').textContent='';
}
$('assessmentMode').addEventListener('change',updateVoiceSetup);updateVoiceSetup();
$('voiceEvaluate').addEventListener('click',()=>{
  if(!game||game.status!=='running'||game.assessment!=='auto')return;
  const heard=voiceCardText.join(' ');if(!heard.trim()){toast('Ainda não há fala reconhecida neste cartão. Ouça o aluno e use os botões da professora.');return;}
  const match=ReadingVoice.compare(game.words[game.answers.length],heard);game.wordErrors=new Set(match.missing);
  answer(game.mode==='frases'||match.exact,{heard});
});
async function finishVoiceRound(result){
  lockSetup(true);$('stateTag').textContent=result.assessment==='auto'?'AGUARDANDO REVISÃO':'RODADA CONCLUÍDA';
  pendingVoiceBlob=await voice.stop();$('voiceConsent').checked=false;
  if(result.assessment!=='manual')$('voiceStatus').textContent='Microfone encerrado. A gravação da rodada está disponível no resultado.';
  if(result.assessment==='auto'){
    pendingVoiceResult=result;result.answers.forEach(a=>a.reviewMissing=a.missedIndices||a.word.split(/\s+/).map((w,i)=>a.missedWords.includes(w)?i:-1).filter(i=>i>=0));renderVoiceReview();$('voiceReviewNotice').textContent=voiceCardText.length?'A fala do cartão que não foi concluído não entrou na contagem. Confira os cartões registrados abaixo.':'Somente os cartões avaliados aparecem na contagem. O silêncio não é marcado como erro.';
    $('voiceReview').showModal();
  }else{lockSetup(false);commitResult(result);}
}
function renderVoiceReview(){
  const r=pendingVoiceResult;if(!r)return;
  $('voiceReviewList').innerHTML=r.answers.map((a,i)=>{const words=a.word.split(/\s+/);return `<div class="voice-review-item"><strong>${i+1}. ${escapeHtml(a.word)}</strong><p>${a.assessmentSource==='voice'?'Sugestão do microfone':'Marcação da professora'}${a.heard?' · Ouvi: '+escapeHtml(a.heard):''}</p><div>${words.map((w,j)=>{const good=!a.reviewMissing?.includes(j)&&(!a.reviewMissing? !a.missedWords?.includes(w):true);return `<button class="voice-word-toggle" data-voice-answer="${i}" data-voice-word="${j}" aria-pressed="${good}" aria-label="${escapeHtml(w)}: ${good?'lida corretamente':'precisa praticar'}">${good?'✓':'↻'} ${escapeHtml(w)}</button>`;}).join('')}</div></div>`;}).join('')||'<p>Nenhum cartão foi avaliado. Você pode confirmar uma rodada sem acertos ou descartá-la.</p>';
  const count=r.answers.reduce((sum,a)=>sum+(a.count||1)-(a.reviewMissing?.length??a.missedWords?.length??0),0);
  $('voiceReviewSummary').textContent=`${count} de ${r.attempted} palavras corretas · ${r.cardsAttempted} ${r.mode==='frases'?'frases':'cartões'} · tempo: ${preciseTime(r.elapsed)}`;
}
$('voiceReviewList').addEventListener('click',event=>{const button=event.target.closest('[data-voice-answer]');if(!button||!pendingVoiceResult)return;const a=pendingVoiceResult.answers[Number(button.dataset.voiceAnswer)],index=Number(button.dataset.voiceWord);if(!a.reviewMissing)a.reviewMissing=a.word.split(/\s+/).map((w,i)=>a.missedWords.includes(w)?i:-1).filter(i=>i>=0);const missing=new Set(a.reviewMissing);missing.has(index)?missing.delete(index):missing.add(index);a.reviewMissing=[...missing];renderVoiceReview();});
$('voiceReview').addEventListener('cancel',event=>event.preventDefault());
$('voiceConfirm').addEventListener('click',()=>{
  const r=pendingVoiceResult;if(!r)return;
  r.answers.forEach(a=>{const words=a.word.split(/\s+/),missing=a.reviewMissing||[];a.missedIndices=[...missing];a.missedWords=words.filter((_,i)=>missing.includes(i));a.correctCount=a.count-missing.length;a.correct=a.correctCount===a.count;delete a.reviewMissing;});
  r.correct=r.answers.reduce((sum,a)=>sum+a.correctCount,0);r.accuracy=r.attempted?Math.round(r.correct/r.attempted*100):0;r.pace=r.elapsed?Number((r.correct*60/r.elapsed).toFixed(1)):0;r.reviewedByTeacher=true;r.reviewedAt=new Date().toISOString();game.correct=r.correct;renderProgress();
  pendingVoiceResult=null;$('voiceReview').close();lockSetup(false);$('livePace').textContent=numberText(r.pace);commitResult(r);
});
$('voiceDiscard').addEventListener('click',()=>{pendingVoiceResult=null;pendingVoiceBlob=null;voice.dispose();$('voiceReview').close();lockSetup(false);resetReady();toast('Rodada descartada. Nenhum resultado ou estrela foi registrado.');});
async function showVoiceAudio(result){
  const serial=++audioViewSerial,panel=$('voiceAudio');panel.hidden=result.assessment!=='auto'&&result.assessment!=='record';panel.replaceChildren();if(panel.hidden)return;
  const title=document.createElement('strong');title.textContent=result.assessment==='auto'?'🎙 Microfone · resultado revisado pela professora':'🎙 Gravação · avaliação da professora';panel.append(title);
  const note=document.createElement('p');note.textContent='Carregando gravação…';panel.append(note);
  let savedAudio;try{savedAudio=await ReadingVoice.audioStore('get',result.id);}catch{}
  if(serial!==audioViewSerial)return;
  let blob=savedAudio?.blob||(game?.id===result.id?pendingVoiceBlob:null),isStored=!!savedAudio;
  if(!blob){note.textContent='Sem áudio guardado neste navegador. O resultado da leitura continua registrado.';return;}
  const player=document.createElement('audio');player.controls=true;player.preload='metadata';player.src=voice.url(blob);panel.append(player);
  const controls=document.createElement('div');controls.className='voice-audio-actions';panel.append(controls);
  const download=document.createElement('a');download.className='small-btn';download.textContent='↓ Baixar áudio';download.href=player.src;download.download='missao-leitura-'+result.date.slice(0,10)+'-'+result.id.slice(0,8)+(blob.type.includes('mp4')?'.m4a':blob.type.includes('ogg')?'.ogg':'.webm');controls.append(download);
  const save=document.createElement('button');save.className='small-btn';save.textContent='Guardar áudio neste navegador';save.hidden=isStored;controls.append(save);
  const remove=document.createElement('button');remove.className='text-btn';remove.textContent=isStored?'Apagar áudio guardado':'Descartar áudio';controls.append(remove);
  const label=()=>note.textContent=isStored?'Áudio guardado somente neste navegador e dispositivo. Baixe uma cópia se desejar conservar.':'Áudio temporário desta rodada. Guarde ou baixe antes de iniciar outra rodada ou fechar a página.';label();
  save.addEventListener('click',async()=>{save.disabled=true;try{await ReadingVoice.audioStore('put',result.id,blob);isStored=true;save.hidden=true;remove.textContent='Apagar áudio guardado';label();}catch{note.textContent='Não foi possível guardar o áudio (armazenamento indisponível ou cheio). Use Baixar áudio.';}finally{save.disabled=false;}});
  remove.addEventListener('click',async()=>{remove.disabled=true;try{if(isStored)await ReadingVoice.audioStore('delete',result.id);if(game?.id===result.id)pendingVoiceBlob=null;player.pause();URL.revokeObjectURL(player.src);player.remove();controls.remove();blob=null;note.textContent='Áudio apagado. O resultado e as estrelas foram preservados.';}catch{note.textContent='Não foi possível apagar o áudio. Tente novamente.';remove.disabled=false;}});
}
window.addEventListener('pagehide',()=>voice.dispose());
