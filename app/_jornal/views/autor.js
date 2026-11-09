/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, isPoem, plural, state } from '../core/base.js';
import { allWorks, findItem } from '../core/dados.js';
import { articleHtml, bylineOf, excerptOf, openBtn, workTools } from './html.js';
import { pageOfWork } from './imersivo.js';

export 

/* ---------- camada do autor ---------- */
function renderAutor(){
  var works=allWorks(), box=$('#autorList');
  $('#view-autor').classList.toggle('reading',!!state.reading);
  if(state.reading){
    var it=findItem(state.reading);
    if(!it){state.reading=null;return renderAutor()}
    box.innerHTML=articleHtml(it); return;
  }
  if(!works.length){
    box.innerHTML='<div class="empty"><p class="big">Nenhum texto ainda</p><p>'+(state.canEdit?'Use “Escrever novo texto” na Mesa do redator.':'Volte em breve.')+'</p></div>';
    return;
  }
  var lead=works[0];
  box.innerHTML='<article class="lead">'+
    '<p class="kicker">'+esc(lead.genre)+' · Destaque</p>'+
    '<h2 class="h-lead">'+openBtn(lead,'hl',esc(lead.title))+'</h2>'+
    '<p class="byline">'+bylineOf(lead)+'</p>'+
    '<div class="lead-body"><p class="excerpt'+(isPoem(lead)?'':' drop')+'">'+excerptOf(lead,620)+'</p></div>'+'<p class="jump">Continua na página '+pageOfWork(lead)+' ›</p>'+
    '<div class="foot">'+openBtn(lead,'btn small','Ler completo')+workTools(lead)+'</div></article>'+
    '<div class="empty"><p class="big">Leituras</p><p>'+works.length+' '+plural(works.length,'texto','textos')+' organizados por tipo de escrita.</p><div class="row"><button class="btn primary" data-act="layer" data-v="leituras">Ver as leituras</button></div></div>';
}
