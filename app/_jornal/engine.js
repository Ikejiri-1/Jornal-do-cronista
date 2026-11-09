/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, fmtDate, plural, state } from './core/base.js';
import { INJ_RE, errText, note } from './core/seguranca.js';
import { allWorks, findItem, rankedStories } from './core/dados.js';
import { articleHtml, bylineOf, openBtn, storyTools } from './views/html.js';
import { ord, renderComposer, storyPiece } from './views/capa.js';
import { render, toTop } from './views/render.js';
import { lsGet, lsSet, norm } from './views/extras.js';
import { pageRustle } from './views/imersivo.js';
import { WK_EPOCH, artFigure, closeLabel, dShort, deckOf, editionData, emptyPage, likeCounts, weekLabel, weekNoOf, weekNow, weekRange } from './views/semana.js';
import { MESL, colsHtml, edHead, editionPage } from './views/edicao.js';
import { inEl, introFinish, introSize } from './views/introducao.js';
import { mountCapa, unmountCapa } from './views/CapaView';
import { mountEnvios, unmountEnvios } from './views/EnviosView';
import { createOriginality } from './features/originality/index.js';
import { initTypewriter, tw as twBridge } from './features/typewriter/controller';
import { createUx } from './features/ux/index.js';
import { createIos } from './features/ios/index.js';

/* Etapa 3: vistoria, máquina de escrever, xadrez, UX e iOS moram em features/. Aqui ficam só o que é da Etapa 2
   (coverHtml, renderCapa, renderEnvios, introDive) e as pontes que as views já importavam deste arquivo. */
export let inDiveCtl, tw, ux, ios, orig;
export function __set_inDiveCtl(v){ inDiveCtl=v; return v; }

/* pontes: as views importam estes nomes daqui; os módulos só existem depois dos init_* */
export function isTwOpen(){ return !!tw&&tw.isOpen(); }
export function twSoundOn(){ return !!tw&&tw.sound(); }
export function twSetSound(v){ return tw.setSound(v); }
export function twAc(){ return tw&&tw.ac(); }
export function twCtx(){ return tw&&tw.ctx(); }
export function twHit(t,o){ return tw.hit(t,o); }
export function twThump(t,fq,d,g,ty){ return tw.thump(t,fq,d,g,ty); }
export function openTypewriter(k){ return tw.open(k); }
export function goLogin(){ return ux.goLogin(); }
export function dlgOpen(d){ return ios.dlgOpen(d); }
export function dlgClose(d){ return ios.dlgClose(d); }
export function pendingStories(){ return orig.pendingStories(); }
export function vistoria(a,b,c){ return orig.vistoria(a,b,c); }
export function approveStory(k){ return orig.approveStory(k); }
export function reverify(k){ return orig.reverify(k); }
export function auditAll(){ return orig.auditAll(); }
export function banUser(u){ return orig.banUser(u); }
export function renderPending(){ return orig.renderPending(); }

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
export 

/* aba Enviados da semana: o que eu enviei, o que está em análise e quem concorre */
function chipOf(x){
  if(x.status==='analise'||!(x.check&&x.check.v))return '<span class="chip wait">Em análise do editor</span>';
  return '<span class="chip ok">'+(x.check.revisadoPorEditor?'Aprovada pelo editor':'Aprovada na vistoria')+'</span>';
}
export 
function renderEnvios(){
  var W=weekNow(), box=$('#enBody'); renderComposer(); renderPending();
  $('#enSub').textContent='Semana nº '+W+' · '+weekLabel(W)+'. Fecha em '+closeLabel()+' (domingo, 23h59). Na segunda-feira, o texto mais votado vira a manchete da Capa e os seguintes ocupam as páginas.';
  if(state.reading){
    var it=findItem(state.reading); if(!it){state.reading=null;return renderEnvios()}
    $('#pendingBox').hidden=true; unmountEnvios(box); box.innerHTML=articleHtml(it); return;
  }
  $('#pendingBox').hidden=false; mountEnvios(box);
}

export 
function dvPage(kind){
  var m='<div class="dv-mast">O CONTISTA</div>';
  if(kind==='front')return m+'<div class="dv-head"></div><div class="dv-lines"></div><div class="dv-fig"></div><div class="dv-lines"></div>';
  if(kind==='left')return '<div class="dv-head"></div><div class="dv-cols"><i></i><i></i><i></i></div><div class="dv-fig"></div><div class="dv-cols"><i></i><i></i></div>';
  return '<div class="dv-fig"></div><div class="dv-head"></div><div class="dv-cols"><i></i><i></i></div><div class="dv-lines"></div><div class="dv-cols"><i></i><i></i><i></i></div>';
}
export 
function introDive(cb,sh){
  var went=false, go=function(){if(went)return; went=true; state.quietTurn=true; if(cb)cb(); state.quietTurn=false; [].forEach.call(document.querySelectorAll('main.turn'),function(e){e.classList.remove('turn')})};
  var W=inEl.clientWidth, H=inEl.clientHeight, hz=parseFloat(inEl.style.getPropertyValue('--hz'))||H*.58;
  var ir=inEl.getBoundingClientRect(), br=$('#in-boat').getBoundingClientRect(), bx=br.left-ir.left, by=br.top-ir.top, bw=br.width, bh=br.height;
  var pw=Math.round(Math.min(W*.42,280,H*.28)), ph=Math.round(pw*1.35), nx=Math.round(W/2-pw/2), ny=Math.round(H*.68-ph);
  var d=document.createElement('div'); d.id='in-dive'; d.setAttribute('aria-hidden','true');
  d.style.setProperty('--pw',pw+'px'); d.style.setProperty('--ph',ph+'px'); d.style.setProperty('--wv',getComputedStyle($('.w1')).backgroundImage);
  var bub='', i, rr=function(a,b){return a+Math.random()*(b-a)};
  for(i=0;i<8;i++){var sz=Math.round(rr(6,18)); bub+='<i style="left:'+Math.round(rr(W*.12,W*.88))+'px;top:'+Math.round(rr(H*.55,H*.95))+'px;width:'+sz+'px;height:'+sz+'px"></i>'}
  d.innerHTML='<div class="dv-water"></div><div class="dv-rays"><i style="left:10%"></i><i style="left:32%"></i><i style="left:56%"></i><i style="left:79%"></i></div><div class="dv-bubbles">'+bub+'</div>'+
    '<div class="dv-seabed"><i class="dv-rock" style="left:12%;width:16%;height:'+Math.round(H*.05)+'px"></i><i class="dv-rock" style="left:70%;width:20%;height:'+Math.round(H*.07)+'px"></i></div>'+
    '<div class="dv-boat" style="left:'+bx+'px;top:'+by+'px;width:'+bw+'px;height:'+bh+'px"></div>'+
    '<div class="dv-pos" style="left:'+nx+'px;top:'+ny+'px"><div class="dv-pulse"><div class="dv-spread"><div class="dv-r">'+dvPage('right')+'</div><div class="dv-l"><div class="dv-face">'+dvPage('front')+'</div><div class="dv-face dv-back">'+dvPage('left')+'</div></div></div></div></div>';
  inEl.appendChild(d);
  var cl=$('#in-boat svg').cloneNode(true); d.querySelector('.dv-boat').appendChild(cl); $('#in-boat').style.visibility='hidden';
  var A=[], T=[], sheet=sh, q=function(sel){return d.querySelector(sel)};
  var an=function(el,kf,o){o.fill='both'; var a=el.animate(kf,o); A.push(a); return a};
  var ui=['.in-top','.in-nav','.in-card','.in-copy']; ui.forEach(function(sel){var e=inEl.querySelector(sel); if(e)an(e,[{opacity:1},{opacity:0}],{duration:260})});
  inEl.classList.add('dv-still'); T.push(setTimeout(function(){inEl.classList.add('dv-cover')},1150));
  an(q('.dv-water'),[{transform:'translateY('+hz+'px)'},{transform:'translateY(0)'}],{delay:100,duration:1000,easing:'cubic-bezier(.5,0,.2,1)'});
  an(q('.dv-rays'),[{opacity:0},{opacity:1}],{delay:700,duration:600}); 
  var dx=(W/2-bw/2)-bx, dy=(ny-bh*.15)-by;
  an(q('.dv-boat'),[{transform:'translate(0,0) rotate(0deg) scale(1)'},{transform:'translate('+dx*.1+'px,'+dy*.2+'px) rotate(-9deg) scale(1)',offset:.22},{transform:'translate('+dx*.55+'px,'+dy*.62+'px) rotate(24deg) scale(.82)',offset:.62},{transform:'translate('+dx+'px,'+dy+'px) rotate(34deg) scale(.5)'}],{delay:150,duration:2150,easing:'cubic-bezier(.45,.05,.4,1)'});
  an(q('.dv-boat'),[{opacity:1},{opacity:0}],{delay:2150,duration:220});
  d.querySelectorAll('.dv-bubbles i').forEach(function(b){var dl=Math.round(rr(500,2300)), du=Math.round(rr(1300,2100)); an(b,[{transform:'translateY(0) scale(.6)',opacity:0},{opacity:.85,offset:.2},{transform:'translateY('+(-H*rr(.25,.55))+'px) scale(1)',opacity:0}],{delay:dl,duration:du,easing:'ease-out'})});
  an(q('.dv-seabed'),[{transform:'translateY(100%)'},{transform:'translateY(0)'}],{delay:1000,duration:1000,easing:'ease-out'});
  an(q('.dv-seabed'),[{transform:'translateY(0)'},{transform:'translateY(100%)'}],{delay:2400,duration:450,easing:'ease-in'});
  an(q('.dv-pos'),[{opacity:0,transform:'translate(0,30px) scale(1)'},{opacity:1,transform:'translate(0,0) scale(1)'}],{delay:1300,duration:500});
  an(q('.dv-pulse'),[{transform:'scale(1)'},{transform:'scale(1.08)'},{transform:'scale(1)'}],{delay:2200,duration:320});
  var s1=Math.min(1.6,(W*.86)/(2*pw),(H*.6)/ph), cy=H/2-(ny+ph/2), s2=Math.max(W/(2*pw),H/ph)*1.35;
  an(q('.dv-pos'),[{transform:'translate(0,0) scale(1)'},{transform:'translate(0,'+cy+'px) scale('+s1+')'}],{delay:2400,duration:700,easing:'cubic-bezier(.5,0,.2,1)'});
  an(q('.dv-l'),[{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}],{delay:2750,duration:900,easing:'cubic-bezier(.45,0,.25,1)'});
  an(q('.dv-spread'),[{transform:'translateX(0)'},{transform:'translateX('+(pw/2)+'px)'}],{delay:2750,duration:900,easing:'cubic-bezier(.45,0,.25,1)'});
  an(q('.dv-pos'),[{transform:'translate(0,'+cy+'px) scale('+s1+')'},{transform:'translate(0,'+cy+'px) scale('+s2+')'}],{delay:3650,duration:750,easing:'cubic-bezier(.55,0,.8,.4)'});
  an(inEl,[{opacity:1},{opacity:0}],{delay:3950,duration:450,easing:'linear'});
  var end=function(){go(); sheet.classList.remove('in-hidden'); document.body.style.overflow=''; A.forEach(function(a){try{a.cancel()}catch(e){}}); var dd=$('#in-dive'); if(dd)dd.remove(); $('#in-boat').style.visibility=''; inEl.classList.remove('dv-still','dv-cover'); inDiveCtl=null; introFinish()};
  T.push(setTimeout(function(){go(); sheet.classList.remove('in-hidden'); document.body.style.overflow=''},3900));
  T.push(setTimeout(end,4450));
  for(i=0;i<5;i++)(function(k){T.push(setTimeout(function(){if(tw.sound()&&tw.ctx())tw.ring(tw.ac().currentTime,rr(600,1300),.07,.035)},350+k*380))})(i);
  T.push(setTimeout(function(){if(tw.sound())pageRustle()},2800));
  inDiveCtl={finish:function(){T.forEach(clearTimeout); end()}};
}


/* xadrez: puzzles + motor + tabuleiro (features/chess) só são baixados quando o bloco chega perto da tela */
var chessMod=null, chessLoading=false, chessIO=null;
export function chessHtml(){
  if(chessMod)return chessMod.html();
  setTimeout(chessWatch,0);
  return '<section class="chess" id="chess-slot" aria-labelledby="chess-t"><h3 class="sec-banner" id="chess-t">Como anda o mundo do xadrez</h3><p class="hint">Carregando o puzzle do dia…</p></section>';
}
function chessWatch(){
  var el=$('#chess-slot'); if(!el||chessMod||chessLoading)return;
  var go=function(){
    if(chessLoading)return; chessLoading=true;
    import('./features/chess/ui.js').then(function(m){
      chessMod=m.createChess({state:state,$:$,esc:esc,plural:plural,lsGet:lsGet,lsSet:lsSet,weekNow:weekNow,MESL:MESL,WK_EPOCH:WK_EPOCH});
      var s=$('#chess-slot'); if(s)s.outerHTML=chessMod.html();
    }).catch(function(){chessLoading=false});
  };
  if(!('IntersectionObserver' in window))return go();
  if(chessIO)chessIO.disconnect();
  chessIO=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){chessIO.disconnect(); go()}},{rootMargin:'300px'});
  chessIO.observe(el);
}
export function chessReset(){if(chessMod)chessMod.reset()}

/* init_*: mantidos com os mesmos nomes porque main.js os chama na ordem original */
export function init_maquina(){
  // 'render' e 'note' são importados por ligação viva (podem ser trocados por __set_*): sempre chamados pelo nome
  orig=createOriginality({state:state,$:$,esc:esc,note:function(a,b){return note(a,b)},errText:errText,plural:plural,render:function(){return render()},allWorks:allWorks,INJ_RE:INJ_RE,openBtn:openBtn,bylineOf:bylineOf,storyTools:storyTools});
  tw=twBridge;
  initTypewriter({state:state,render:function(){return render()},toTop:toTop,draftRestore:function(){ux.draftRestore()}});
}
export function init_skill(){}
export function init_motor(){}
export function init_puzzle(){}
export function init_ux(){ ux=createUx({$:$,note:function(a,b){return note(a,b)},lsGet:lsGet,lsSet:lsSet}); }
export function init_ios(){ ios=createIos({$:$,tw:tw,inEl:inEl,introSize:introSize}); }
