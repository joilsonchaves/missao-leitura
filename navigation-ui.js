(function(){
'use strict';
const route=tab=>({tab:tab||location.hash.slice(1)||'inicio',view:window.LearningWorkshop?.navigationView()||'practice'});
const trail=new BackTrail(route());let restoring=false;
function reviewChanged(){$('pendingReviewBar').hidden=!pendingVoiceResult||$('voiceReview').open;}
function visited(tab){if(!restoring)trail.visit(route(tab));reviewChanged();}
function closeDialog(id){const dialog=$(id);if(!dialog?.open)return;dialog.close();reviewChanged();}
function reopenReview(){if(!pendingVoiceResult)return;renderVoiceReview();if(!$('voiceReview').open)$('voiceReview').showModal();reviewChanged();}
async function goBack(){
  if(microphoneStarting||game?.status==='connecting'){toast('Aguarde a conexão do microfone para voltar.');return;}
  if(document.fullscreenElement){try{await document.exitFullscreen();}catch{toast('Use Esc para sair da tela cheia.');return;}document.body.classList.remove('projection');$('projector').textContent='↗ Modo projeção';return;}
  if(document.body.classList.contains('projection')){document.body.classList.remove('projection');$('projector').textContent='↗ Modo projeção';return;}
  if(game?.status==='running')await togglePause();
  else if(game?.status==='preparing'){
    game.preparationRemaining=Math.max(0,game.readyAt-performance.now());game.status='preparation-paused';$('word').textContent='PAUSA';$('stateTag').textContent='PREPARAÇÃO PAUSADA';$('pause').disabled=false;$('pause').textContent='▶ Continuar preparação';
  }
  const previous=trail.back();restoring=true;
  try{navigate(previous.tab);if(previous.tab==='aprender')window.LearningWorkshop.restoreView(previous.view||'practice');}finally{restoring=false;}
}
$('pageBack').addEventListener('click',goBack);$('learnStageBack').addEventListener('click',goBack);
document.querySelectorAll('[data-dialog-back]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.dataset.dialogBack)));
$('resumeVoiceReview').addEventListener('click',reopenReview);
window.GameNavigation={visited,goBack,closeDialog,reopenReview,reviewChanged};reviewChanged();
})();
