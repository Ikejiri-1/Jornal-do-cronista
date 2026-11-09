/* Pontes entre as telas e os módulos de features/ (Etapa 3). O código das telas mora em views/ e core/. */
import { $, esc, plural, state } from './core/base.js';
import { INJ_RE, errText, note } from './core/seguranca.js';
import { allWorks } from './core/dados.js';
import { bylineOf, openBtn, storyTools } from './views/html.js';
import { render, toTop } from './views/render.js';
import { lsGet, lsSet } from './views/extras.js';
import { WK_EPOCH, weekNow } from './views/semana.js';
import { MESL } from './views/edicao.js';
import { inEl, introSize } from './views/introducao.js';
import { createOriginality } from './features/originality/index.js';
import { initTypewriter, tw as twBridge } from './features/typewriter/controller';
import { createUx } from './features/ux/index.js';
import { createIos } from './features/ios/index.js';

/* Etapa 3: vistoria, máquina de escrever, xadrez, UX e iOS moram em features/. Aqui ficam só as pontes que as views importam.
   Quem for tirar essas pontes (Agente 3) deve trocar os imports das views por features/. */
export let tw, ux, ios, orig;

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
