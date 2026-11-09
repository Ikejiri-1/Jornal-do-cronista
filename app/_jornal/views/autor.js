/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, isPoem, plural, state } from '../core/base.js';
import { allWorks, findItem } from '../core/dados.js';
import { articleHtml, bylineOf, excerptOf, openBtn, workTools } from './html.js';
import { mountAutor, unmountLeitura } from './LeiturasView';

export 

/* ---------- camada do autor ---------- */
function renderAutor(){
  var box=$('#autorList');
  $('#view-autor').classList.toggle('reading',!!state.reading);
  if(state.reading){
    var it=findItem(state.reading);
    if(!it){state.reading=null;return renderAutor()}
    unmountLeitura(box); box.innerHTML=articleHtml(it); return;
  }
  mountAutor(box);
}
