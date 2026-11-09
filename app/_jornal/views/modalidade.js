/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { tw } from '../engine.js';
import { pageRustle } from './imersivo.js';
import { $, esc, state } from '../core/base.js';
import { render } from './render.js';
import { lsGet, lsSet } from './extras.js';
import { artSvg } from './semana.js';
import { IN_STOPS, __set_inLeaving, __set_inLock, closeIntro, inAuto, inEl, inI, inLeaving, inLock, inReduced, introAutoStop, introFinish, introGo, introLayout, introPan, introSize, introStill, openIntro } from './introducao.js';


export let inDiveCtl;
export function __set_inDiveCtl(v){ inDiveCtl=v; return v; }
export let MODALITY_ATMOSPHERE_BY_GENRE, MODALITY_WORLD_TIMINGS, POEM_WORDS, SAIL_TURN_MILLISECONDS, SAIL_DURATION_MILLISECONDS, SAIL_WORLD_START_MILLISECONDS, SAIL_CAMERA_ZOOM, SAIL_WAKE_POINTS, SAIL_FOAM_COUNT, BOAT_REAR_SVG, inT, rmq;

export 
function seededPosition(seed,minimum,maximum){var value=Math.sin(seed*91.7)*43758.5453; return minimum+(value-Math.floor(value))*(maximum-minimum)}
export 
function modalityAtmosphereHtml(kind){
  var html='', index;
  if(kind==='contos'){
    for(index=0;index<9;index++)html+='<i class="atm-window" style="left:'+(8+index*10).toFixed(1)+'%;bottom:'+seededPosition(index,7,20).toFixed(1)+'%;animation-delay:'+(index*130)+'ms"></i>';
    html+='<i class="atm-bird" style="top:22%;animation-delay:0ms"></i><i class="atm-bird" style="top:30%;animation-delay:350ms"></i>';
  }else if(kind==='poemas'){
    html+='<i class="atm-moonglow"></i>';
    POEM_WORDS.forEach(function(word,position){html+='<span class="atm-word" style="left:'+seededPosition(position+3,4,88).toFixed(1)+'%;animation-delay:'+(position*140)+'ms">'+word+'</span>'});
  }else if(kind==='aventuras'){
    html+='<svg class="atm-route" viewBox="0 0 100 60" preserveAspectRatio="none"><path d="M4 52 C 20 40, 26 48, 38 34 S 60 30, 66 20 S 86 16, 94 8"/></svg><span class="atm-mark">✕</span>';
  }else if(kind==='fantasia'){
    for(index=0;index<26;index++)html+='<span class="atm-spark" style="left:'+seededPosition(index,3,96).toFixed(1)+'%;top:'+seededPosition(index+40,10,85).toFixed(1)+'%;animation-delay:'+(index*70)+'ms">✦</span>';
  }else if(kind==='cronicas'){
    html+='<i class="atm-sunrise"></i>';
    for(index=0;index<9;index++)html+='<i class="atm-window lit" style="left:'+(10+index*9.5).toFixed(1)+'%;bottom:'+seededPosition(index+9,8,26).toFixed(1)+'%;animation-delay:'+(600+index*110)+'ms"></i>';
  }else if(kind==='ficcao'){
    for(index=0;index<46;index++)html+='<i class="atm-star" style="left:'+seededPosition(index,1,99).toFixed(1)+'%;top:'+seededPosition(index+70,2,70).toFixed(1)+'%;animation-delay:'+(index*37)+'ms"></i>';
    html+='<i class="atm-scan"></i>';
  }else if(kind==='terror'){
    html+='<i class="atm-dark"></i><i class="atm-fog"></i><i class="atm-fog second"></i><i class="atm-flash"></i>';
  }
  return html;
}
export 
function openModalitySection(genre){
  state.layer='leituras'; state.lsec=genre||null; state.reading=null; render(); window.scrollTo(0,0);
}
export 
function startModalityWorld(genre,startInsets,cleanup,sceneStartOffset){
  var world=document.createElement('div'), kind=MODALITY_ATMOSPHERE_BY_GENRE[genre]||'contos';
  world.id='np-world'; world.className='atm-'+kind; world.setAttribute('aria-hidden','true');
  world.innerHTML='<div class="np-world-scene">'+artSvg(genre,genre,'world')+'</div><div class="np-world-atmosphere">'+modalityAtmosphereHtml(kind)+'</div>'+
    '<div class="np-world-title"><span class="np-kicker">Caderno de</span><strong>'+esc(genre)+'</strong></div><div class="np-world-dissolve"></div>';
  world.style.clipPath=world.style.webkitClipPath='inset('+startInsets.top+'px '+startInsets.right+'px '+startInsets.bottom+'px '+startInsets.left+'px)';
  var scene=world.querySelector('.np-world-scene');
  if(sceneStartOffset){scene.style.transition='none'; scene.style.transform='translateY('+sceneStartOffset+'px)'}
  inEl.appendChild(world);
  var timers=[], dissolveFrame=0, finished=false;
  function finishWorld(){
    if(finished)return; finished=true;
    timers.forEach(clearTimeout); cancelAnimationFrame(dissolveFrame);
    openModalitySection(genre);
    document.querySelector('.sheet').classList.remove('in-hidden'); document.body.style.overflow='';
    inEl.style.transition='opacity 200ms linear'; inEl.style.opacity='0';
    setTimeout(function(){var element=$('#np-world'); if(element)element.remove(); if(cleanup)cleanup(); __set_inDiveCtl(null); introFinish()},230);
  }
  requestAnimationFrame(function(){requestAnimationFrame(function(){scene.style.transition=''; scene.style.transform=''; world.style.clipPath=world.style.webkitClipPath='inset(0px 0px 0px 0px)'; world.classList.add('grow')})});
  timers.push(setTimeout(function(){world.classList.add('alive')},MODALITY_WORLD_TIMINGS.atmosphere));
  timers.push(setTimeout(function(){world.classList.add('titled')},MODALITY_WORLD_TIMINGS.title));
  timers.push(setTimeout(function(){
    var dissolve=world.querySelector('.np-world-dissolve'), startTime=performance.now();
    function frame(now){
      var elapsed=Math.min(1,(now-startTime)/MODALITY_WORLD_TIMINGS.dissolve);
      dissolve.style.setProperty('--dot',(elapsed*elapsed*14).toFixed(2)+'px');
      if(elapsed<1)dissolveFrame=requestAnimationFrame(frame); else finishWorld();
    }
    dissolveFrame=requestAnimationFrame(frame);
  },MODALITY_WORLD_TIMINGS.dissolveStart));
  return finishWorld;
}
export 
function easeInOutCubic(value){return value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2}
export 
function easeInOutSine(value){return -(Math.cos(Math.PI*value)-1)/2}
export 
function clampUnit(value){return Math.max(0,Math.min(1,value))}
export 
function introSailToModality(genre){
  if(inLeaving)return;
  if(inReduced()||!inEl.animate)return closeIntro('fast',function(){openModalitySection(genre)});
  __set_inLeaving(true); __set_inLock(true); introAutoStop();
  try{sessionStorage.setItem('gazeta-intro','1')}catch(error){}
  var introRectangle=inEl.getBoundingClientRect(), width=introRectangle.width, height=introRectangle.height;
  var horizon=parseFloat(inEl.style.getPropertyValue('--hz'))||height*.58, sceneryHeight=parseFloat(inEl.style.getPropertyValue('--sh'))||height*.3;
  var boat=$('#in-boat'), boatRectangle=boat.getBoundingClientRect(), boatWidth=boatRectangle.width, boatHeight=boatRectangle.height;
  var startX=boatRectangle.left-introRectangle.left+boatWidth/2, startY=boatRectangle.top-introRectangle.top+boatHeight*.85;
  var targetX=width/2, targetY=horizon-1, sideSign=startX<=targetX?-1:1;
  var sky=$('#in-sky'), sea=$('#in-sea'), cameraElements=[sky,sea].filter(Boolean);
  cameraElements.forEach(function(element){var rectangle=element.getBoundingClientRect(); element.style.transformOrigin=(targetX-(rectangle.left-introRectangle.left))+'px '+(targetY-(rectangle.top-introRectangle.top))+'px'});
  /* camadas: esteira (recortada no mar) e o barco com duas vistas, de lado e de popa */
  var layer=document.createElement('div'), foamHtml='', index;
  for(index=0;index<SAIL_FOAM_COUNT;index++)foamHtml+='<ellipse class="sail-foam" fill="none" stroke="#fff" stroke-width="2" rx="0" ry="0" opacity="0"/>';
  layer.id='sail-layer'; layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<svg class="sail-wake" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" style="clip-path:inset('+horizon+'px 0 0 0);-webkit-clip-path:inset('+horizon+'px 0 0 0)">'+
    '<polyline class="sail-wake-left" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/><polyline class="sail-wake-right" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>'+foamHtml+'</svg>'+
    '<div class="sail-boat" style="width:'+boatWidth+'px;height:'+boatHeight+'px"><div class="sail-view sail-side"></div><div class="sail-view sail-rear">'+BOAT_REAR_SVG+'</div></div>';
  inEl.appendChild(layer);
  var boatElement=layer.querySelector('.sail-boat'), sideView=layer.querySelector('.sail-side'), rearView=layer.querySelector('.sail-rear');
  sideView.appendChild(boat.querySelector('svg').cloneNode(true)); boat.style.visibility='hidden';
  var wakeLeft=layer.querySelector('.sail-wake-left'), wakeRight=layer.querySelector('.sail-wake-right'), foams=[].slice.call(layer.querySelectorAll('.sail-foam'));
  var animations=[], timers=[], trail=[], foamState=foams.map(function(){return null}), nextFoam=0, lastFoamTime=0, frameRequest=0, worldFinish=null, startTime=performance.now(), previousX=startX;
  function animate(element,keyframes,options){options.fill='both'; var animation=element.animate(keyframes,options); animations.push(animation); return animation}
  ['.in-top','.in-nav','.in-card','.in-copy','.in-motion'].forEach(function(selector){var element=inEl.querySelector(selector); if(element)animate(element,[{opacity:1},{opacity:0}],{duration:260})});
  /* o giro: a vista de lado vira de perfil e a de popa aparece, como uma carta virando */
  animate(sideView,[{transform:'perspective(320px) rotateY(0deg)'},{transform:'perspective(320px) rotateY('+(sideSign>0?'-':'')+'90deg)'}],{duration:SAIL_TURN_MILLISECONDS/2,easing:'ease-in'});
  animate(rearView,[{transform:'perspective(320px) rotateY('+(sideSign>0?'':'-')+'90deg)'},{transform:'perspective(320px) rotateY(0deg)'}],{delay:SAIL_TURN_MILLISECONDS/2,duration:SAIL_TURN_MILLISECONDS/2,easing:'ease-out'});
  function toScreen(x,y,zoom){return [targetX+(x-targetX)*zoom,targetY+(y-targetY)*zoom]}
  function frame(now){
    var elapsed=now-startTime;
    var zoom=1+(SAIL_CAMERA_ZOOM-1)*easeInOutCubic(clampUnit((elapsed-300)/(SAIL_DURATION_MILLISECONDS)));
    cameraElements.forEach(function(element){element.style.transform='scale('+zoom.toFixed(4)+')'});
    var progress=easeInOutSine(clampUnit((elapsed-SAIL_TURN_MILLISECONDS*.55)/(SAIL_DURATION_MILLISECONDS-SAIL_TURN_MILLISECONDS*.55)));
    /* o barco está na linha d'água e o cenário fica na outra margem: ele segue pela água até o centro e diminui ao se afastar */
    var worldX=startX+(targetX-startX)*progress, worldY=startY+(targetY-startY)*progress, perspectiveScale=1-.74*Math.pow(progress,.9);
    var bob=Math.sin(elapsed/150)*2.4*perspectiveScale, lean=Math.max(-10,Math.min(10,(worldX-previousX)*2.2)); previousX=worldX;
    var screen=toScreen(worldX,worldY+bob,zoom), displayScale=perspectiveScale*zoom;
    boatElement.style.transform='translate('+(screen[0]-boatWidth/2).toFixed(1)+'px,'+(screen[1]-boatHeight*.85).toFixed(1)+'px) rotate('+(Math.sin(elapsed/260)*2.5+lean).toFixed(2)+'deg) scale('+displayScale.toFixed(3)+')';
    boatElement.style.opacity=progress>.9?String(clampUnit((1-progress)/.1)):'1';
    /* esteira em V: cada ponto do rastro se abre para os lados e some com o tempo */
    if(progress>0&&progress<1){trail.push({x:worldX,y:worldY,scale:perspectiveScale,time:now}); if(trail.length>SAIL_WAKE_POINTS)trail.shift()}
    var leftPoints=[], rightPoints=[];
    trail.forEach(function(point){
      var age=(now-point.time)/1000; if(age>1.3)return;
      var spread=(boatWidth*.12+age*boatWidth*.9)*point.scale, drift=age*10*point.scale;
      var left=toScreen(point.x-spread,point.y+drift,zoom), right=toScreen(point.x+spread,point.y+drift,zoom);
      leftPoints.push(left[0].toFixed(1)+','+left[1].toFixed(1)); rightPoints.push(right[0].toFixed(1)+','+right[1].toFixed(1));
    });
    var wakeOpacity=(.7*(1-clampUnit((progress-.75)/.25))).toFixed(2);
    wakeLeft.setAttribute('points',leftPoints.join(' ')); wakeRight.setAttribute('points',rightPoints.join(' '));
    wakeLeft.setAttribute('opacity',wakeOpacity); wakeRight.setAttribute('opacity',wakeOpacity);
    /* espuma na popa: anéis que nascem atrás do barco e se desfazem */
    if(progress>0&&progress<.95&&now-lastFoamTime>150){lastFoamTime=now; foamState[nextFoam]={x:worldX,y:worldY+boatHeight*.05*perspectiveScale,scale:perspectiveScale,time:now}; nextFoam=(nextFoam+1)%SAIL_FOAM_COUNT}
    foams.forEach(function(foam,position){
      var state=foamState[position]; if(!state){foam.setAttribute('opacity','0'); return}
      var age=(now-state.time)/900; if(age>1){foam.setAttribute('opacity','0'); return}
      var center=toScreen(state.x,state.y,zoom), radius=(6+age*30)*state.scale*zoom;
      foam.setAttribute('cx',center[0].toFixed(1)); foam.setAttribute('cy',center[1].toFixed(1)); foam.setAttribute('rx',radius.toFixed(1)); foam.setAttribute('ry',(radius*.32).toFixed(1)); foam.setAttribute('opacity',(.8*(1-age)).toFixed(2));
    });
    if(elapsed<SAIL_WORLD_START_MILLISECONDS+1000)frameRequest=requestAnimationFrame(frame);
  }
  frameRequest=requestAnimationFrame(frame);
  function cleanupSail(){
    cancelAnimationFrame(frameRequest);
    animations.forEach(function(animation){try{animation.cancel()}catch(error){}});
    var element=$('#sail-layer'); if(element)element.remove();
    boat.style.visibility=''; cameraElements.forEach(function(cameraElement){cameraElement.style.transformOrigin=''; cameraElement.style.transform=''});
    inEl.classList.remove('dv-cover','dv-still'); __set_inLock(false);
  }
  __set_inDiveCtl({finish:function(){
    if(worldFinish){worldFinish(); return}
    timers.forEach(clearTimeout); openModalitySection(genre); cleanupSail();
    document.querySelector('.sheet').classList.remove('in-hidden'); document.body.style.overflow='';
    __set_inDiveCtl(null); introFinish();
  }});
  /* o barco toca o horizonte: o cenário cresce até ocupar a tela (o mergulho) */
  timers.push(setTimeout(function(){
    var zoomNow=1+(SAIL_CAMERA_ZOOM-1)*easeInOutCubic(clampUnit((SAIL_WORLD_START_MILLISECONDS-300)/SAIL_DURATION_MILLISECONDS));
    var top=Math.max(0,horizon-sceneryHeight*zoomNow), bottom=Math.max(0,height-horizon);
    worldFinish=startModalityWorld(genre,{top:top,right:0,bottom:bottom,left:0},cleanupSail,horizon-height);
  },SAIL_WORLD_START_MILLISECONDS));
  timers.push(setTimeout(function(){inEl.classList.add('dv-cover','dv-still')},SAIL_WORLD_START_MILLISECONDS+950));
}
export 
function introStep(d){if(inLock)return; __set_inLock(true); setTimeout(function(){__set_inLock(false)},750); introGo(inI+d)}
export 
function introRead(g){closeIntro('ink',function(){state.layer='leituras'; state.lsec=g||null; state.reading=null; render()})}
export 
function motionInit(){
  var on=lsGet('gazeta-motion',0)===1; document.documentElement.classList.toggle('motion-ok',on);
  var n=$('#in-motion'); if(n)n.hidden=!(rmq&&rmq.matches&&!on);
  if(!inEl.hidden)introLayout();
}

export function init(){

/* ---------- entrar numa modalidade ---------- */
MODALITY_ATMOSPHERE_BY_GENRE={'Contos':'contos','Poemas':'poemas','Aventuras':'aventuras','Fantasia':'fantasia','Crônicas':'cronicas','Ficção Científica':'ficcao','Terror e Suspense':'terror'};

MODALITY_WORLD_TIMINGS={atmosphere:350,title:650,dissolveStart:1450,dissolve:650};

POEM_WORDS=['luar','verso','rima','silêncio','saudade','mar','estrela','vento','pétala','eco','céu','alma'];

/* escolher uma modalidade: o barco vira, navega pela água até a peça principal do cenário e a câmera vai junto */
SAIL_TURN_MILLISECONDS=520;
SAIL_DURATION_MILLISECONDS=2100;
SAIL_WORLD_START_MILLISECONDS=1900;
SAIL_CAMERA_ZOOM=1.6;

SAIL_WAKE_POINTS=70;
SAIL_FOAM_COUNT=8;

BOAT_REAR_SVG='<svg viewBox="0 0 120 92"><path d="M42 72h36l-8 14H50z" fill="#dcdcd8" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M60 72V12l13 60z" fill="#fff" stroke="#000" stroke-width="3" stroke-linejoin="round"/><path d="M60 72V12L47 72z" fill="#dcdcd8" stroke="#000" stroke-width="3" stroke-linejoin="round"/></svg>';

inEl.addEventListener('click',function(e){
  if(inDiveCtl){inDiveCtl.finish(); return}
  var t=e.target.closest('[data-i]'); if(!t)return; var v=t.dataset.i;
  if(v!=='pause')introAutoStop();
  if(v==='skip')closeIntro('fast'); else if(v==='pause')introStill(); else if(v==='next')introStep(1); else if(v==='prev')introStep(-1);
  else if(v==='enter')closeIntro('ink'); else if(v==='read')introRead(null);
  else if(v==='see')introSailToModality(IN_STOPS[inI].g); else introGo(parseInt(v,10));
});

inEl.addEventListener('wheel',function(e){if(Math.abs(e.deltaY)>20)introStep(e.deltaY>0?1:-1)},{passive:true});

inT=null;

inEl.addEventListener('touchstart',function(e){var t=e.touches[0]; inT={x:t.clientX,y:t.clientY,dx:0,dy:0,h:null,t:Date.now()}},{passive:true});

inEl.addEventListener('touchmove',function(e){
  if(!inT)return; var t=e.touches[0]; inT.dx=t.clientX-inT.x; inT.dy=t.clientY-inT.y;
  if(inT.h===null&&(Math.abs(inT.dx)>8||Math.abs(inT.dy)>8))inT.h=Math.abs(inT.dx)>Math.abs(inT.dy);
  if(inT.h){var lim=(inEl.clientWidth||390)*.6, d=Math.max(-lim,Math.min(lim,inT.dx)); if((inI===0&&d>0)||(inI===IN_STOPS.length-1&&d<0))d*=.25; introPan(inI,false,d)}
},{passive:true});

inEl.addEventListener('touchend',function(e){
  if(!inT)return; var a=inT, W=inEl.clientWidth||390, v=a.dx/Math.max(1,Date.now()-a.t); inT=null;
  if(a.h){ if(a.dx<-W*.2||v<-.5)introStep(1); else if(a.dx>W*.2||v>.5)introStep(-1); else introPan(inI,true) }
  else if(Math.abs(a.dy)>60)introStep(a.dy<0?1:-1);
},{passive:true});

window.addEventListener('resize',function(){if(!inEl.hidden)introSize()});

document.addEventListener('keydown',function(e){
  if(inEl.hidden)return;
  if(inDiveCtl){inDiveCtl.finish(); return}
  introAutoStop();
  if(e.key==='Escape')closeIntro('fast');
  else if(e.key==='ArrowRight'||e.key==='ArrowDown')introStep(1);
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp')introStep(-1);
});

rmq=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');

$('#in-motion-on').addEventListener('click',function(){lsSet('gazeta-motion',1); motionInit()});

motionInit();

if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(!inEl.hidden)introLayout()});

try{ if((navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=2))inEl.classList.add('lite') }catch(e){}

['pointerdown','wheel','touchstart'].forEach(function(t){inEl.addEventListener(t,function(e){if(inAuto&&!(e.target.closest&&e.target.closest('#in-pause')))introAutoStop()},{passive:true,capture:true})});

$('#in-open').addEventListener('click',openIntro);

(function(){var seen=false; try{seen=sessionStorage.getItem('gazeta-intro')==='1'}catch(e){} if(!seen&&!location.hash)openIntro()})();
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

