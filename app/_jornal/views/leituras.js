/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { mountLeituras, unmountLeitura } from './LeiturasView';
import { $, GENRE_DESC, esc, plural, state } from '../core/base.js';
import { allWorks, findItem, genres } from '../core/dados.js';
import { articleHtml, bylineOf, excerptOf, openBtn, workTools } from './html.js';
import { leituraPiece, lsGet, norm, readHas, shelfHas } from './extras.js';
import { pageOfWork } from './imersivo.js';
import { artSvg } from './semana.js';

export 

/* ---------- camada das leituras ---------- */
function renderLeituras(){
  var works=allWorks(), gs=genres(), body=$('#leiturasBody'), head=$('#leiturasHead');
  if(state.reading){
    head.hidden=true;
    var it=findItem(state.reading);
    if(!it){state.reading=null;return renderLeituras()}
    unmountLeitura(body); body.innerHTML=articleHtml(it); return;
  }
  head.hidden=false;
  var nr=works.filter(function(w){return readHas(w.key)}).length;
  $('#l-prog').textContent=works.length?'Você já leu '+nr+' de '+works.length+' '+plural(works.length,'leitura','leituras')+'.':'';
  $('#l-shelf').textContent='Minha estante ('+lsGet('gazeta-shelf',[]).length+')';
  mountLeituras(body);
}
