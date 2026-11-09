/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { state } from '../core/base.js';
import { render } from './render.js';



export function init(){


/* ---------- início ---------- */
(function(){
  var h=(location.hash||'').slice(1);
  if(h==='capa'||h==='autor'||h==='leituras'||h==='envios'||h==='assinatura'||h==='perfil')state.layer=h;
})();

render();
}
