/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, state } from '../core/base.js';
import { findItem, genres } from '../core/dados.js';
import { ord } from './capa.js';
import { lsSet } from './extras.js';
import { twAc, twCtx, twHit, twSetSound, twSoundOn, twThump } from '../engine.js';

export let npKey;

export 

/* ---------- jornal imersivo: faixa de seções, índice, cabeçalho de página, virada de página ---------- */
function pageOfWork(w){var i=genres().indexOf(w.genre); return 'B'+(i<0?2:i+2)}
export 
function renderSecbar(){
  var el=$('#secbar'); if(!el)return;
  var h=genres().map(function(g){return '<button class="hl" data-act="secgo" data-v="'+esc(g)+'">'+esc(g)+'</button>'}).join('<i>·</i>');
  if(el.dataset.k!==h){el.innerHTML=h; el.dataset.k=h}
}
export 
function renderIndex(){
  var box=$('#idxBody'); if(!box)return;
  var h='<ul class="idx">'+genres().map(function(g,i){return '<li><button class="hl" data-act="secgo" data-v="'+esc(g)+'">'+esc(g)+'</button><span class="dots"></span><b>B'+(i+2)+'</b></li>'}).join('')+
    '<li><button class="hl" data-act="shelfview">Minha estante</button><span class="dots"></span><b>B1</b></li>'+
    '<li><button class="hl" data-act="layer" data-v="envios">Enviados da semana</button><span class="dots"></span><b>D1</b></li>'+
    '<li><button class="hl" data-act="layer" data-v="capa">Capa do Jornal</button><span class="dots"></span><b>C1</b></li></ul>';
  if(box.dataset.k!==h){box.innerHTML=h; box.dataset.k=h}
}
export 
function folioNow(){
  var gs=genres(), gi=function(g){var i=gs.indexOf(g); return i<0?0:i}, L='';
  if(state.layer==='autor')L='A1 · Edição do Autor';
  else if(state.layer==='leituras'){
    if(state.reading){var it=findItem(state.reading); L=it?'B'+(2+gi(it.genre))+' · '+it.genre:'B · Leituras'}
    else if(!state.lsec)L='B1 · Catálogo de leituras';
    else if(state.lsec==='__shelf')L='B1 · Minha estante';
    else if(state.lsec==='Todas')L='B1 · Todas as leituras';
    else L='B'+(2+gi(state.lsec))+' · '+state.lsec;
  }else if(state.layer==='envios')L='D1 · Enviados da semana'; else if(state.layer==='assinatura')L='E1 · Assinatura do Contista'; else if(state.layer==='perfil')L='F1 · Perfil'; else L='C'+state.capaPage+' · '+(state.reading?'Leitura':(state.capaPage===1?'Capa do Jornal':ord(state.capaPage)));
  $('#fo-l').textContent=L; $('#fo-r').textContent='Edição nº '+$('#dl-n').textContent;
}
export 
function pageRustle(){
  if(!twSoundOn()||!twCtx())return; var t=twAc().currentTime+.002;
  twHit(t,{d:.34,g:.1,f:3200,q:.6}); twHit(t+.05,{d:.22,g:.06,f:5200,q:.8}); twHit(t+.17,{d:.16,g:.05,f:2400,q:.7});
  twThump(t,110,.09,.05,'triangle');
}
export 
function newsExtras(){
  renderSecbar(); renderIndex(); folioNow();
  var co=$('#co-n'); if(co)co.textContent=$('#dl-n').textContent;
  var ps=$('#pg-sound'); if(ps)ps.firstElementChild.textContent='Som das páginas: '+(twSoundOn()?'ligado':'desligado');
  var key=state.layer+'|'+state.capaPage+'|'+(state.lsec||'')+'|'+(state.reading?state.reading.kind+':'+state.reading.key:'');
  if(npKey!==null&&key!==npKey&&!state.quietTurn){
    var v=document.querySelector('main:not([hidden])');
    if(v){v.classList.remove('turn'); void v.offsetWidth; v.classList.add('turn'); v.addEventListener('animationend',function(e){if(e.target===v)v.classList.remove('turn')},{once:false})}
    pageRustle();
  }
  npKey=key;
}

export function init(){

npKey=null;

$('#pg-sound').addEventListener('click',function(){
  twSetSound(!twSoundOn());
  var b=$('#tw-sound'); b.textContent='Som: '+(twSoundOn()?'ligado':'desligado'); b.setAttribute('aria-pressed',String(twSoundOn()));
  if(twSoundOn())pageRustle(); newsExtras();
});
}
