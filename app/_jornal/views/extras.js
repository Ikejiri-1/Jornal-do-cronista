/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, state } from '../core/base.js';
import { allWorks } from '../core/dados.js';
import { bylineOf, excerptOf, openBtn, workTools } from './html.js';
import { render, toTop } from './render.js';
import { markReadUnlessLocked } from './foto.js';
import { pageOfWork } from './imersivo.js';

export 
function lsGet(k,d){try{var v=JSON.parse(localStorage.getItem(k)); if(v==null||(Array.isArray(d)&&!Array.isArray(v))||(typeof d==='number'&&typeof v!=='number'))return d; return v}catch(e){return d}}
export 
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
export 
function shelfHas(key){return lsGet('gazeta-shelf',[]).indexOf(key)>=0}
export 
function readHas(key){return lsGet('gazeta-read',[]).indexOf(key)>=0}
export 
function markRead(key){var r=lsGet('gazeta-read',[]); if(r.indexOf(key)<0){r.push(key); lsSet('gazeta-read',r.slice(-300))}}
export 
function toggleShelf(key){var a=lsGet('gazeta-shelf',[]),i=a.indexOf(key); if(i>=0)a.splice(i,1); else a.push(key); lsSet('gazeta-shelf',a.slice(-200)); render()}
export 
function curFs(){return state.fs==null?lsGet('gazeta-fs',1):state.fs}
export 
function changeFs(d){state.fs=Math.max(0,Math.min(4,curFs()+d)); lsSet('gazeta-fs',state.fs); render()}
export 
function fsScale(){return [.9,1,1.12,1.26,1.42][curFs()]||1}
export 
function readMin(it){if(it.locked)return it.readMinutes; var w=(it.text||'').trim().split(/\s+/).length; return Math.max(1,Math.round(w/200))}
export 
function norm(x){return (x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
export 
function readerTools(it){
  var on=shelfHas(it.key);
  return '<div class="reader-tools" role="group" aria-label="Ferramentas de leitura"><button class="btn small" data-act="fs" data-d="-1" aria-label="Diminuir a letra">A−</button><button class="btn small" data-act="fs" data-d="1" aria-label="Aumentar a letra">A+</button><button class="btn small" data-act="shelf" data-key="'+esc(it.key)+'" aria-pressed="'+on+'">'+(on?'★ Na estante':'☆ Guardar')+'</button><button class="btn small" data-act="print">Imprimir</button></div>';
}
export 
function leituraPiece(w){
  return '<article class="piece"><p class="kicker">'+esc(w.genre)+'</p><h3 class="h-mid">'+openBtn(w,'hl',esc(w.title))+'</h3><p class="byline">'+bylineOf(w)+'</p><p class="excerpt">'+excerptOf(w,260)+'</p><p class=\"jump\">Continua na página '+pageOfWork(w)+' ›</p><div class="foot">'+openBtn(w,'btn small','Ler completo')+workTools(w)+'</div></article>';
}
export 
function surprise(){
  var w=allWorks(); if(!w.length)return;
  var u=w.filter(function(x){return !readHas(x.key)}), pool=u.length?u:w, it=pool[Math.floor(Math.random()*pool.length)];
  state.layer='leituras'; state.lsec=null; state.q=''; $('#l-q').value='';
  state.reading={kind:it.kind,key:it.key}; markReadUnlessLocked(state.reading); render(); toTop();
}
export 
function updateProg(){
  var b=$('#prog'); if(!b)return;
  if(!state.reading){b.hidden=true;return}
  b.hidden=false; var h=document.documentElement.scrollHeight-window.innerHeight;
  b.firstElementChild.style.width=(h>0?Math.min(100,Math.max(0,window.scrollY/h*100)):0)+'%';
}

export function init(){


/* ---------- extras de leitura ---------- */
state.q='';
 state.fs=null;

window.addEventListener('scroll',updateProg,{passive:true});

$('#l-q').addEventListener('input',function(){state.q=this.value; if(state.layer==='leituras'){state.reading=null; render()}});
}
