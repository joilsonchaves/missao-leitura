'use strict';
// Reading records remain the source of learning statistics. This ledger only adjusts rewards.
class RewardCycleBook {
  constructor(options) {
    this.o=options;
    this.now=options.now||(()=>new Date().toISOString());
    this.id=options.id||(()=>globalThis.crypto?.randomUUID?.()||'reward-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    const saved=options.state;
    this.state=saved&&saved.version===2&&saved.students&&typeof saved.students==='object'&&!Array.isArray(saved.students)?saved:{version:2,createdAt:this.now(),students:{},legacyImported:false};
    this.dirty=!saved||this.state!==saved;
  }
  clone(value){return JSON.parse(JSON.stringify(value));}
  thresholds(){return this.o.thresholds();}
  cap(){return this.thresholds().at(-1);}
  reads(key){return this.o.records().filter(r=>this.o.keyFor(r)===key).slice().sort((a,b)=>a.date.localeCompare(b.date));}
  total(key){return this.reads(key).reduce((n,r)=>n+r.correct,0);}
  ensure(key,person) {
    let s=this.state.students[key];
    const reads=this.reads(key),last=reads.at(-1)||person;
    if(!s){
      const week=this.o.weekFor(this.state.createdAt);
      const total=reads.reduce((n,r)=>n+r.correct,0),current=reads.filter(r=>this.o.weekFor(r.date)===week).reduce((n,r)=>n+r.correct,0);
      s={name:last?.name||key.split('|')[0],classroom:last?.classroom||'',cycle:{id:'start:'+week+'|'+key,baseline:total-current,debit:0,startedAt:this.state.createdAt,number:1},goals:[],prizes:[],actions:[]};
      this.state.students[key]=s;this.dirty=true;
    }
    if(last&&(s.name!==last.name||s.classroom!==last.classroom)){s.name=last.name;s.classroom=last.classroom;this.dirty=true;}
    return s;
  }
  migrate(claims) {
    if(this.state.legacyImported)return;
    for(const r of this.o.records())this.ensure(this.o.keyFor(r),r);
    for(const [legacyKey,at] of Object.entries(claims||{})){
      if(!/^\d{4}-\d{2}-\d{2}\|/.test(legacyKey)||!Number.isFinite(Date.parse(at)))continue;
      const week=legacyKey.slice(0,10),key=legacyKey.slice(11),s=this.ensure(key),cycleId='start:'+week+'|'+key;
      let goal=s.goals.find(g=>g.cycleId===cycleId);
      if(!goal){goal={id:'legacy-goal:'+legacyKey,cycleId,at,cap:this.cap(),source:'legacy'};s.goals.push(goal);}
      if(!s.prizes.some(p=>p.legacyKey===legacyKey))s.prizes.push({id:'legacy-prize:'+legacyKey,goalId:goal.id,cycleId,at,label:this.o.prize(),source:'legacy',legacyKey});
    }
    this.state.legacyImported=true;this.dirty=true;this.sync();
  }
  progress(key){const s=this.ensure(key);return Math.max(0,this.total(key)-s.cycle.baseline-s.cycle.debit);}
  syncGoal(key){
    const s=this.ensure(key);
    if(s.goals.some(g=>g.cycleId===s.cycle.id)||this.progress(key)<this.cap())return;
    let sum=0,at=this.now();const threshold=s.cycle.baseline+s.cycle.debit+this.cap();
    for(const r of this.reads(key)){sum+=r.correct;if(sum>=threshold){at=r.date;break;}}
    // Adjustments may occur after the reading that supplied these points.
    if(at<s.cycle.startedAt)at=s.cycle.startedAt;
    s.goals.push({id:this.id(),cycleId:s.cycle.id,at,cap:this.cap(),source:'reading'});this.dirty=true;
  }
  sync(){const people=new Map();for(const r of this.o.records())people.set(this.o.keyFor(r),r);for(const [key,person] of people)this.ensure(key,person);for(const key of Object.keys(this.state.students))this.syncGoal(key);}
  activePrizes(s){return s.prizes.filter(p=>!p.voidedAt);}
  status(key,person){
    const s=this.ensure(key,person);this.syncGoal(key);
    const progress=this.progress(key),stars=this.thresholds().filter(n=>progress>=n).length;
    const goal=s.goals.find(g=>g.cycleId===s.cycle.id),prizes=this.activePrizes(s),currentPrize=goal?prizes.find(p=>p.goalId===goal.id):null;
    const pending=s.goals.filter(g=>!prizes.some(p=>p.goalId===g.id));
    const action=s.actions.slice().reverse().find(a=>!a.undoneAt);
    return {key,person:s,cycle:s.cycle,progress,stars,total:this.total(key),goal,currentPrize,goalCount:s.goals.length,prizeCount:prizes.length,pending,canUndo:Boolean(action&&action.recordCount===this.reads(key).length),lastAction:action};
  }
  action(key,type,change){
    const s=this.ensure(key),before=this.clone(s.cycle),beforeStars=this.status(key).stars,prizeIds=[];
    const at=this.now(),result=change(s,prizeIds,at);
    if(result?.ok===false)return result;
    s.actions.push({id:this.id(),type,at,before,after:this.clone(s.cycle),beforeStars,afterStars:this.status(key).stars,recordCount:this.reads(key).length,prizeIds});
    this.dirty=true;return {ok:true};
  }
  removeStar(key){
    const status=this.status(key);if(!status.stars)return {ok:false,message:'Este aluno ainda não tem estrelas para retirar.'};
    const target=status.stars>1?this.thresholds()[status.stars-2]:0;
    return this.action(key,'remove',(s)=>{s.cycle.debit+=status.progress-target;});
  }
  newCycle(s,at,key){s.cycle={id:this.id(),baseline:this.total(key),debit:0,startedAt:at,number:(s.cycle.number||1)+1};}
  reset(key){
    if(this.progress(key)<=0)return {ok:false,message:'As estrelas e o progresso deste ciclo já estão zerados.'};
    this.syncGoal(key);return this.action(key,'reset',(s,ids,at)=>this.newCycle(s,at,key));
  }
  award(key,goalId,restart=false){
    const status=this.status(key),s=status.person,goal=s.goals.find(g=>g.id===goalId);
    if(!goal)return {ok:false,message:'Não foi encontrada uma meta de 10 estrelas para este prêmio.'};
    if(this.activePrizes(s).some(p=>p.goalId===goalId))return {ok:false,message:'Este prêmio já está registrado.'};
    if(restart&&(goal.cycleId!==s.cycle.id||status.stars<10))return {ok:false,message:'Complete as 10 estrelas do ciclo atual para premiar e reiniciar.'};
    return this.action(key,restart?'prize-reset':'prize',(student,prizeIds,at)=>{
      const prize={id:this.id(),goalId,cycleId:goal.cycleId,at,label:this.o.prize(),source:'teacher'};
      student.prizes.push(prize);prizeIds.push(prize.id);if(restart)this.newCycle(student,at,key);
    });
  }
  undo(key){
    const status=this.status(key),s=status.person,action=status.lastAction;
    if(!status.canUndo)return {ok:false,message:'Só é possível desfazer o último ajuste antes de uma nova rodada de leitura.'};
    const at=this.now();s.cycle=this.clone(action.before);action.undoneAt=at;
    for(const p of s.prizes)if(action.prizeIds.includes(p.id))p.voidedAt=at;
    this.dirty=true;return {ok:true};
  }
  history(key){
    const s=this.ensure(key);
    return [...s.goals.map(g=>({...g,kind:'goal'})),...s.prizes.map(p=>({...p,kind:'prize'})),...s.actions.filter(a=>a.type!=='prize').map(a=>({...a,kind:'adjustment'}))].sort((a,b)=>b.at.localeCompare(a.at));
  }
}
