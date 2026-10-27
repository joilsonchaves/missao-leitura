/* Voice support: no recording starts until the teacher explicitly selects it. */
(function(root){
  'use strict';
  const tokens=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').split(/\s+/).map(w=>w.replace(/[^a-z0-9]/g,'')).filter(Boolean);
  function compare(expected,heard){
    const a=tokens(expected),b=tokens(heard).slice(-180),n=a.length,m=b.length;
    const dp=Array.from({length:n+1},()=>Array(m+1).fill(0));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
    const matched=new Set();let i=0,j=0;
    while(i<n&&j<m){if(a[i]===b[j]){matched.add(i);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
    const exact=n>0&&b.some((_,start)=>a.every((word,k)=>b[start+k]===word));
    return {exact,matched:[...matched],missing:a.map((_,k)=>k).filter(k=>!matched.has(k)),heard:tokens(heard).slice(-180).join(' ')};
  }
  const errorMessage=error=>({
    NotAllowedError:'O microfone não foi autorizado. Libere o acesso no navegador ou escolha a avaliação manual.',
    NotFoundError:'Nenhum microfone foi encontrado. Conecte um microfone e tente novamente.',
    NotReadableError:'Não foi possível abrir o microfone. Verifique se outro aplicativo está usando ele.',
    'not-allowed':'O reconhecimento de voz não foi autorizado. Você pode continuar marcando a leitura manualmente.',
    'service-not-allowed':'O serviço de reconhecimento não está disponível neste navegador. Use a avaliação manual.',
    'network':'O reconhecimento perdeu a conexão. Confira a internet ou continue com os botões da professora.',
    'audio-capture':'O reconhecimento não conseguiu captar o microfone. Confira o dispositivo.',
    'language-not-supported':'O reconhecimento em português não está disponível neste navegador.'
  }[error?.name||error]||'Não foi possível iniciar o microfone. Use HTTPS e confira a permissão do navegador.');
  class VoiceCapture{
    constructor({onText,onStatus,isReading}){this.onText=onText;this.onStatus=onStatus;this.isReading=isReading;this.mode='manual';this.serial=0;this.urls=[];}
    static capabilities(){return {record:!!(root.isSecureContext&&root.navigator?.mediaDevices?.getUserMedia&&root.MediaRecorder),recognition:!!(root.SpeechRecognition||root.webkitSpeechRecognition)};}
    async prepare(mode){
      this.dispose();this.mode=mode;if(mode==='manual')return;
      const caps=VoiceCapture.capabilities();if(!caps.record)throw Error('Este navegador não permite gravar aqui. Abra o endereço HTTPS no Chrome ou Edge, ou use a avaliação manual.');
      if(mode==='auto'&&!caps.recognition)throw Error('O reconhecimento de voz não está disponível aqui. Escolha Só gravar ou avaliação manual.');
      const token=this.serial;this.onStatus('Aguardando autorização do microfone…');
      const request=root.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      let timeout;
      try{
        this.stream=await Promise.race([request,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('A autorização demorou. Escolha a permissão do microfone e tente iniciar novamente.')),20000);})]);
        if(token!==this.serial){this.stream.getTracks().forEach(t=>t.stop());throw Error('Início cancelado.');}
      }catch(e){request.then(stream=>{if(this.stream!==stream)stream.getTracks().forEach(t=>t.stop());}).catch(()=>{});throw e.name&&e.name!=='Error'?Error(errorMessage(e)):e;}finally{clearTimeout(timeout);}
      this.chunks=[];this.totalBytes=0;this.transcripts=[];this.blocked=false;this.active=false;
      const type=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(t=>root.MediaRecorder.isTypeSupported?.(t));
      this.recorder=new root.MediaRecorder(this.stream,type?{mimeType:type}:undefined);
      this.recorder.ondataavailable=e=>{if(token!==this.serial)return;if(e.data?.size){this.totalBytes+=e.data.size;if(this.totalBytes<=60*1024*1024)this.chunks.push(e.data);else if(!this.sizeLimited){this.sizeLimited=true;this.onStatus('A gravação atingiu 60 MB. O áudio guardado será parcial.');this.recorder.stop();}}};
      this.recorder.onerror=()=>this.onStatus('A gravação falhou. A leitura pode continuar com os botões da professora.');
      this.onStatus('Microfone pronto. A gravação começa junto com a leitura.');
    }
    async connect(){
      if(this.mode!=='auto'||this.blocked)return;
      this.active=true;await this.startRecognition();
    }
    startRecognition(){
      if(!this.active||this.blocked)return Promise.resolve();
      const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition,rec=new Recognition(),serial=this.serial;
      this.recognition=rec;rec.lang='pt-BR';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
      return new Promise((resolve,reject)=>{
        let started=false,settled=false;const finish=(e)=>{if(settled)return;settled=true;clearTimeout(timeout);e?reject(e):resolve();};
        const timeout=setTimeout(()=>{this.blocked=true;this.active=false;try{rec.abort();}catch{}finish(Error('O reconhecimento não respondeu. Escolha Só gravar ou avaliação manual.'));},12000);
        rec.onstart=()=>{if(serial!==this.serial||!this.active){finish(Error('Conexão cancelada.'));try{rec.abort();}catch{}return;}started=true;finish();if(this.isReading())this.onStatus('Microfone ouvindo · sugestões em português');};
        rec.onresult=event=>{if(serial!==this.serial||rec!==this.recognition||!this.active||!this.isReading())return;for(let k=event.resultIndex;k<event.results.length;k++){const result=event.results[k],text=result[0]?.transcript||'';this.onText(text,result.isFinal);}};
        rec.onerror=event=>{if(serial!==this.serial||rec!==this.recognition)return;if(['no-speech','aborted'].includes(event.error))return;this.blocked=true;this.active=false;this.onStatus(errorMessage(event.error));finish(Error(errorMessage(event.error)));};
        rec.onend=()=>{if(!started)finish(Error('O reconhecimento não iniciou. Tente novamente ou use a avaliação manual.'));if(serial!==this.serial||rec!==this.recognition||!this.active||this.blocked)return;this.restart=setTimeout(()=>{if(this.active&&this.isReading())this.startRecognition().catch(e=>this.onStatus(e.message));},450);};
        try{rec.start();}catch(e){finish(Error(errorMessage(e)));}
      });
    }
    startRecording(){if(this.mode==='manual')return;this.stream?.getAudioTracks().forEach(t=>t.enabled=true);if(this.recorder?.state==='inactive'&&!this.sizeLimited)this.recorder.start(1000);else if(this.recorder?.state==='paused')this.recorder.resume();this.onStatus(this.mode==='auto'&&!this.blocked?'Microfone ouvindo · confira as sugestões':'● Gravando a leitura neste dispositivo');}
    pause(){this.active=false;clearTimeout(this.restart);try{this.recognition?.abort();}catch{}if(this.recorder?.state==='recording')this.recorder.pause();this.stream?.getAudioTracks().forEach(t=>t.enabled=false);this.onStatus('Microfone pausado');}
    async resume(){const serial=this.serial;this.stream?.getAudioTracks().forEach(t=>t.enabled=true);try{await this.connect();}catch(e){if(serial===this.serial&&!this.closing)this.onStatus(e.message);}if(serial!==this.serial||this.closing)return;this.startRecording();}
    async stop(){
      this.closing=true;this.active=false;clearTimeout(this.restart);try{this.recognition?.abort();}catch{}
      if(this.recorder&&this.recorder.state!=='inactive')await new Promise(resolve=>{this.recorder.addEventListener('stop',resolve,{once:true});this.recorder.stop();});
      this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
      this.blob=this.chunks?.length?new Blob(this.chunks,{type:this.recorder?.mimeType||'audio/webm'}):null;
      return this.blob;
    }
    dispose(){this.serial++;this.closing=false;this.active=false;clearTimeout(this.restart);try{this.recognition?.abort();}catch{}try{if(this.recorder?.state!=='inactive')this.recorder?.stop();}catch{}this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.recognition=null;this.recorder=null;this.chunks=[];this.blob=null;this.sizeLimited=false;this.urls.forEach(url=>URL.revokeObjectURL(url));this.urls=[];}
    url(blob){const url=URL.createObjectURL(blob);this.urls.push(url);return url;}
  }
  function audioDB(){return new Promise((resolve,reject)=>{if(!root.indexedDB)return reject(Error('O navegador não permite guardar áudio aqui. Use Baixar áudio.'));const req=root.indexedDB.open('missao-leitura-audio-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('recordings',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('Feche outras abas do jogo e tente novamente.'));});}
  async function audioStore(action,id,blob){const db=await audioDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('recordings',action==='get'?'readonly':'readwrite'),store=tx.objectStore('recordings');const req=action==='get'?store.get(id):action==='put'?store.put({id,blob}):store.delete(id);let value;req.onsuccess=()=>value=req.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
  root.ReadingVoice={tokens,compare,errorMessage,VoiceCapture,audioStore};
})(typeof window==='undefined'?globalThis:window);
