/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, DEFAULT_GENRES, newId, state } from '../core/base.js';
import { errText, markBad, note } from '../core/seguranca.js';
import { render } from './render.js';
import { BEHIND_THE_SCENES_MAX_LENGTH, EARLY_ACCESS_DAYS } from './assinatura.js';
import { openTypewriter } from '../engine.js';

export 

/* ---------- ações ---------- */
function openWorkForm(key){
  state.layer='autor'; state.reading=null;
  state.workFormOpen=true; state.editing=key||null;
  render();
  var w=key?state.works.filter(function(x){return x.id===key})[0]:null;
  $('#w-title').value=w?w.title:'';
  $('#w-text').value=w?w.text:'';
  $('#w-early').checked=!!(w&&w.earlyUntil>Date.now()); $('#w-behind').value=w?w.behind||'':'';
  var sel=$('#w-genre');
  if(w&&sel.querySelector('option[value="'+CSS.escape(w.genre)+'"]'))sel.value=w.genre;
  else sel.value=DEFAULT_GENRES[0];
  $('#w-genre-new').value=''; $('#w-genre-new-wrap').hidden=true;
  if(!openTypewriter('work')){$('#w-title').focus(); $('#authorTools').scrollIntoView({block:'start'})}
}
export 
async function saveWork(e){
  e.preventDefault();
  if(state.busy||!state.db)return;
  var title=$('#w-title').value.trim(), genre=$('#w-genre').value;
  if(genre==='__new__')genre=$('#w-genre-new').value.trim();
  var text=$('#w-text').value.replace(/\r/g,'').trim();
  if(!title||!genre||text.length<20){markBad(!title?'#w-title':(!genre?'#w-genre':'#w-text')); note('Preencha título, seção e um texto com pelo menos 20 caracteres.','err');return}
  state.busy=true; $('#w-save').disabled=true;
  try{
    var id=state.editing||newId();
    var prev=state.works.filter(function(w){return w.id===id})[0];
    var behind=$('#w-behind').value.replace(/\r/g,'').trim().slice(0,BEHIND_THE_SCENES_MAX_LENGTH);
    var earlyUntil=$('#w-early').checked?(prev&&prev.earlyUntil>Date.now()?prev.earlyUntil:Date.now()+EARLY_ACCESS_DAYS*864e5):0;
    await state.db.collection('works').doc(id).set({title:title,genre:genre,text:text,at:prev&&prev.at?prev.at:Date.now(),earlyUntil:earlyUntil,behind:behind});
    note(state.editing?'Texto atualizado.':'Texto publicado na seção '+genre+'.');
    state.workFormOpen=false; state.editing=null; state.section='Todas';
  }catch(err){note(errText(err),'err')}
  state.busy=false; $('#w-save').disabled=false; render();
}
export 
async function delWork(key){
  if(!state.db)return;
  try{await state.db.collection('works').doc(key).delete(); note('Texto excluído.')}
  catch(err){note(errText(err),'err')}
}

export function init(){

state.reported={};
 state.reports={};
 state.bans={};
 state.ratingDocs=Object.create(null);
 state.commentDocs=Object.create(null);
 state.cmDraft={};
 state.cmLast=0;
 state.cmFocusKey=null;
 state.lastPost=0;
 state.focusKey=null;
}
