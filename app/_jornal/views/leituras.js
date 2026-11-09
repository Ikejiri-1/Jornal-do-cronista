/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
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
    body.innerHTML=articleHtml(it); return;
  }
  head.hidden=false;
  var nr=works.filter(function(w){return readHas(w.key)}).length;
  $('#l-prog').textContent=works.length?'Você já leu '+nr+' de '+works.length+' '+plural(works.length,'leitura','leituras')+'.':'';
  $('#l-shelf').textContent='Minha estante ('+lsGet('gazeta-shelf',[]).length+')';
  var qn=norm(state.q);
  if(qn){
    var found=works.filter(function(w){return norm(w.title+' '+w.genre+' '+w.text).indexOf(qn)>=0});
    body.innerHTML='<div class="sec-head"><h3>Resultados</h3><button class="btn small" data-act="clearq">Limpar busca</button></div><p class="pageinfo">'+found.length+' '+plural(found.length,'leitura','leituras')+' para “'+esc(state.q)+'”</p>'+
      (found.length?'<div class="paper-cols">'+found.map(leituraPiece).join('')+'</div>':'<div class="empty"><p class="big">Nada encontrado</p><p>Tente outra palavra ou volte ao catálogo.</p></div>');
    return;
  }
  var cnt={}; works.forEach(function(w){cnt[w.genre]=(cnt[w.genre]||0)+1});
  if(state.lsec&&state.lsec!=='Todas'&&state.lsec!=='__shelf'&&gs.indexOf(state.lsec)<0)state.lsec=null;
  if(!state.lsec){
    var cards=['Todas'].concat(gs).map(function(g){
      var n=g==='Todas'?works.length:(cnt[g]||0);
      var d=g==='Todas'?'Todos os textos, do mais recente ao mais antigo.':(GENRE_DESC[g]||'Textos desta seção.');
      return '<button class="cat-card'+(g==='Todas'?' all':'')+'" data-act="ltype" data-v="'+esc(g)+'">'+
        '<span class="cat-n">'+n+'</span><span class="h-mid">'+esc(g)+'</span><p>'+esc(d)+'</p>'+
        '<span class="cnt">'+(n?'Abrir '+plural(n,'leitura','leituras'):'Em breve')+'</span></button>';
    }).join('');
    body.innerHTML='<p class="pageinfo">Catálogo · tipos de escrita</p><div class="catalog">'+cards+'</div>';
    return;
  }
  var list=state.lsec==='Todas'?works:(state.lsec==='__shelf'?works.filter(function(w){return shelfHas(w.key)}):works.filter(function(w){return w.genre===state.lsec}));
  var h='<div class="sec-head"><h3>'+esc(state.lsec==='Todas'?'Todas as leituras':(state.lsec==='__shelf'?'Minha estante':state.lsec))+'</h3><button class="btn small" data-act="ltypes">← Todos os tipos</button></div>'+
    (state.lsec!=='Todas'&&state.lsec!=='__shelf'?'<figure class="sec-art" aria-hidden="true">'+artSvg(state.lsec,state.lsec,false)+'</figure>':'')+
    '<p class="pageinfo">'+list.length+' '+plural(list.length,'leitura','leituras')+'</p>';
  if(!list.length){
    h+='<div class="empty"><p class="big">Seção sem textos</p><p>'+(state.lsec==='__shelf'?'Toque em “Guardar” dentro de uma leitura para ela aparecer aqui.':'Ainda não há nada em '+esc(state.lsec)+'.')+'</p></div>';
  }else{
    h+='<div class="paper-cols">'+list.map(function(w){
      return '<article class="piece"><p class="kicker">'+esc(w.genre)+'</p>'+
        '<h3 class="h-mid">'+openBtn(w,'hl',esc(w.title))+'</h3>'+
        '<p class="byline">'+bylineOf(w)+'</p>'+
        '<p class="excerpt">'+excerptOf(w,260)+'</p>'+'<p class="jump">Continua na página '+pageOfWork(w)+' ›</p>'+
        '<div class="foot">'+openBtn(w,'btn small','Ler completo')+workTools(w)+'</div></article>';
    }).join('')+'</div>';
  }
  body.innerHTML=h;
}
