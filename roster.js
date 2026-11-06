(function(root){
'use strict';
const key=text=>String(text||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
const clean=text=>String(text||'').trim().replace(/\s+/g,' ');
const avatar=value=>Number.isInteger(value)&&value>=0&&value<500?value:0;
class ClassRoster{
  constructor(state,{uuid=()=>root.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2),now=()=>new Date().toISOString()}={}){
    this.uuid=uuid;this.now=now;this.state={version:1,rooms:[]};
    if(Array.isArray(state?.rooms))for(const room of state.rooms){if(!room||typeof room.id!=='string'||!clean(room.name)||clean(room.name).length>60||this.state.rooms.some(r=>r.id===room.id||key(r.name)===key(room.name)))continue;const students=[];for(const s of Array.isArray(room.students)?room.students:[]){if(!s||typeof s.id!=='string'||!clean(s.name)||clean(s.name).length>60||students.some(p=>p.id===s.id||key(p.name)===key(s.name)))continue;students.push({id:s.id,name:clean(s.name),avatar:avatar(s.avatar),archived:!!s.archived});}this.state.rooms.push({id:room.id,name:clean(room.name),students,archived:!!room.archived,createdAt:typeof room.createdAt==='string'?room.createdAt:this.now()});}
  }
  rooms(includeArchived=false){return this.state.rooms.filter(r=>includeArchived||!r.archived);}
  room(id){return this.state.rooms.find(r=>r.id===id);}
  create(name){name=clean(name);if(!name||name.length>60)return {ok:false,message:'Use um nome de turma com até 60 caracteres.'};const existing=this.state.rooms.find(r=>key(r.name)===key(name));if(existing)return {ok:false,id:existing.id,message:existing.archived?'Essa turma está arquivada. Ative Ver arquivadas para restaurá-la.':'Essa turma já está cadastrada.'};const room={id:this.uuid(),name,students:[],archived:false,createdAt:this.now()};this.state.rooms.push(room);return {ok:true,room};}
  add(roomId,text,avatarFor){const room=this.room(roomId);if(!room||room.archived)return {ok:false,message:'Selecione uma turma ativa.'};const lines=Array.isArray(text)?text:String(text||'').split(/[\n;]+/);if(lines.length>300)return {ok:false,message:'Adicione até 300 nomes por vez.'};const names=lines.map(clean).filter(Boolean);if(!names.length||names.some(n=>n.length>60))return {ok:false,message:'Escreva pelo menos um nome, com até 60 caracteres por aluno.'};const added=[];let skipped=0;for(const name of names){if(room.students.some(s=>key(s.name)===key(name))){skipped++;continue;}const i=room.students.length,s={id:this.uuid(),name,avatar:avatar(avatarFor?avatarFor(name,room.name,i):(i%25)*20+i%20),archived:false};room.students.push(s);added.push(s);}return {ok:true,added,skipped};}
  archiveRoom(id,value=true){const room=this.room(id);if(!room)return false;room.archived=!!value;return true;}
  archiveStudent(roomId,id,value=true){const s=this.room(roomId)?.students.find(s=>s.id===id);if(!s)return false;s.archived=!!value;return true;}
  setAvatar(roomId,id,value){const s=this.room(roomId)?.students.find(s=>s.id===id);if(!s||!Number.isInteger(value)||value<0||value>=500)return false;s.avatar=value;return true;}
  activeStudents(roomId){return this.room(roomId)?.students.filter(s=>!s.archived)||[];}
  importPeople(people,avatarFor){let rooms=0,students=0;for(const p of people){if(!clean(p?.name)||!clean(p?.classroom)||clean(p.name).length>60||clean(p.classroom).length>60)continue;let room=this.state.rooms.find(r=>key(r.name)===key(p.classroom));if(!room){const created=this.create(p.classroom);if(!created.ok)continue;room=created.room;rooms++;}if(room.archived)continue;const added=this.add(room.id,[p.name],avatarFor);if(added.ok)students+=added.added.length;}return {rooms,students};}
}
root.ClassRoster=ClassRoster;
})(typeof window==='undefined'?globalThis:window);
