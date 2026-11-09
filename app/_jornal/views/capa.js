/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, state } from '../core/base.js';
import { bylineOf, excerptOf, likeBtn, openBtn } from './html.js';
import { isTwOpen } from '../engine.js';
import { findItem } from '../core/dados.js';
import { articleHtml } from './html.js';
import { mountCapa, unmountCapa } from './CapaView';

export 

/* ---------- camada da capa ---------- */
function ord(p){return p===1?'Capa':(p-1)+'ª Página'}
export 
function storyPiece(s,rank){
  return '<article class="piece"><span class="rank-sm">'+rank+'<sup>º</sup></span>'+
    '<p class="kicker">'+esc(s.genre)+'</p>'+
    '<h3 class="h-mid">'+openBtn(s,'hl',esc(s.title))+'</h3>'+
    '<p class="byline">'+bylineOf(s)+'</p>'+
    '<p class="excerpt">'+excerptOf(s,230)+'</p>'+
    '<div class="foot">'+likeBtn(s)+openBtn(s,'btn small','Ler')+'</div></article>';
}
export 
function renderComposer(){
  var c=$('#composer'), form=$('#storyForm'), lock=$('#composerLock');
  c.hidden=!state.composerOpen;
  var why='';
  if(state.canWrite===false)why='Seu acesso a esta página é só de leitura. Peça ao dono acesso de colaborador para publicar.';
  lock.hidden=!why&&state.uid; lock.textContent=why||'Você pode escrever agora. Ao enviar, pedimos o seu login e guardamos o rascunho.';
  form.hidden=!!why&&!isTwOpen();
}

export 
function renderCapa(){
  var tabs=$('#pageTabs'), body=$('#capaBody'); renderComposer();
  if(state.reading){
    tabs.hidden=true;
    var it=findItem(state.reading); if(!it){state.reading=null;return renderCapa()}
    unmountCapa(tabs,body); body.className=''; body.innerHTML=articleHtml(it); return;
  }
  tabs.hidden=false;
  if(state.capaPage>6)state.capaPage=6;
  body.className='fold'; mountCapa(tabs,body);
}
