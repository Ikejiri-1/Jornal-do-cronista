import { CE, sqName, sqRC, mvName, mvOf } from './engine.js';
import { PZ_DIA, PZ_DOM, CHESS_FACTS } from './puzzles.js';
// Tabuleiro interativo e o bloco "Como anda o mundo do xadrez". Carregado sob demanda (import()).
export function createChess(c){
  var state=c.state,$=c.$,esc=c.esc,plural=c.plural,lsGet=c.lsGet,lsSet=c.lsSet,weekNow=c.weekNow,MESL=c.MESL,WK_EPOCH=c.WK_EPOCH;
  var PGLY={K:'\u265A\uFE0E',Q:'\u265B\uFE0E',R:'\u265C\uFE0E',B:'\u265D\uFE0E',N:'\u265E\uFE0E',P:'\u265F\uFE0E'};
  var PNOME={K:'Rei',Q:'Dama',R:'Torre',B:'Bispo',N:'Cavalo',P:'Peão'};
/* ---------- puzzle interativo ---------- */
function dayKey(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function pzGen(row){
  var fen=row[0], mv=row[1].split(' '), n=row[2], sn=row[3].split('|'), black=/ b$/.test(fen);
  var sol=black?(n===1?'1…'+sn[0]:'1…'+sn[0]+' 2. '+sn[1]+' '+sn[2]):(n===1?'1. '+sn[0]:'1. '+sn[0]+' '+sn[1]+' 2. '+sn[2]);
  return {fen:fen+' -',line:mv,alts:[],goal:(black?'As Pretas':'As Brancas')+' jogam e dão mate em '+n,lbl:'Origem',game:'Posição inédita criada para o jornal',place:'',
    note:'Cada puzzle do dia é conferido por computador e tem uma solução única.',sol:sol,
    why:n===1?'O lance '+sn[0]+' dá xeque-mate: o rei não tem casa livre e nenhuma peça captura ou bloqueia o xeque.':'O primeiro lance ('+sn[0]+') não deixa defesa. Depois de '+sn[1]+', a resposta mais teimosa, o lance '+sn[2]+' dá xeque-mate.',
    hint:n===1?'Procure um xeque que deixe o rei sem casas livres.':'O primeiro lance costuma ser um xeque, ou tirar casas de fuga do rei. O mate vem logo depois.'};
}
function pzToday(){
  var t=new Date(), d0=new Date(t.getFullYear(),t.getMonth(),t.getDate()), i=Math.max(0,Math.round((d0-WK_EPOCH)/864e5)), w=Math.floor(i/7), dow=i%7, dom=(dow===6);
  var z=dom?PZ_DOM[w%PZ_DOM.length]:pzGen(PZ_DIA[(w*6+dow)%PZ_DIA.length]);
  return {z:z,k:dayKey(d0),dom:dom,d:d0};
}
function chessDays(){return lsGet('gazeta-chess-days',[])}
function chessStreak(){
  var set={}, d=new Date(), n=0; chessDays().forEach(function(k){set[k]=1}); d=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(!set[dayKey(d)])d.setDate(d.getDate()-1);
  while(set[dayKey(d)]){n++; d.setDate(d.getDate()-1)}
  return n;
}
function chessStreakText(){var n=chessStreak(), t=chessDays().length; return 'Sequência: '+n+' '+plural(n,'dia','dias')+' · '+t+' '+plural(t,'puzzle resolvido','puzzles resolvidos')}
function chessNew(z,k,dom){
  var S=CE.parse(z.fen), kp=CE.kingPos(S.b,S.turn);
  return {z:z,k:k,dom:dom,S:S,step:0,cur:null,sel:null,moves:[],last:null,tries:0,solved:false,busy:false,focus:sqName(kp[0],kp[1]),
    fb:{k:'info',t:'Clique na peça que você quer mover e depois na casa de destino. Se errar, é só tentar de novo.'}};
}
function chessState(){
  var td=pzToday();
  if(!state.chess||state.chess.k!==td.k)state.chess=chessNew(td.z,td.k,td.dom);
  return state.chess;
}
function pieceLabel(p){var t=p.toUpperCase(), fem=(t==='Q'||t==='R'); return PNOME[t]+' '+(CE.isW(p)?(fem?'branca':'branco'):(fem?'preta':'preto'))}
function chessBoardHtml(ch){
  var b=ch.S.b, dest={}, chk=CE.inCheck(b,ch.S.turn)?CE.kingPos(b,ch.S.turn):null, h='', r, c, i, rk='', fl='', side={w:[],b:[]};
  ch.moves.forEach(function(m){dest[m[2]+','+m[3]]=b[m[2]][m[3]]?'cap':'go'});
  for(r=0;r<8;r++)for(c=0;c<8;c++){
    var p=b[r][c], n=sqName(r,c), cls='sq '+((r+c)%2?'d':'l');
    if(ch.sel&&ch.sel[0]===r&&ch.sel[1]===c)cls+=' sel';
    if(dest[r+','+c])cls+=' '+dest[r+','+c];
    if(ch.last&&((ch.last[0]===r&&ch.last[1]===c)||(ch.last[2]===r&&ch.last[3]===c)))cls+=' last';
    if(chk&&chk[0]===r&&chk[1]===c)cls+=' chk';
    if(p)side[CE.isW(p)?'w':'b'].push(PNOME[p.toUpperCase()]+' '+n);
    h+='<button type="button" class="'+cls+'" data-sq="'+n+'" tabindex="'+(ch.focus===n?0:-1)+'" aria-label="'+esc(n+', '+(p?pieceLabel(p):'casa vazia')+(dest[r+','+c]?', destino possível':''))+'">'+(p?'<span class="pc '+(CE.isW(p)?'w':'b')+'" aria-hidden="true">'+PGLY[p.toUpperCase()]+'</span>':'')+'</button>';
  }
  for(i=8;i>=1;i--)rk+='<span>'+i+'</span>'; for(i=0;i<8;i++)fl+='<span>'+'abcdefgh'.charAt(i)+'</span>';
  return '<div class="cb-wrap"><div class="cb-ranks" aria-hidden="true">'+rk+'</div><div class="cb" role="group" aria-label="'+esc('Tabuleiro do puzzle. Brancas: '+side.w.join(', ')+'. Pretas: '+side.b.join(', ')+'. Use as setas para andar pelas casas e Enter para escolher.')+'">'+h+'</div><div class="cb-files" aria-hidden="true">'+fl+'</div></div>';
}
function chessFbHtml(ch){return ch.fb.t}
function chessRefresh(){
  var ch=chessState(), b=$('#chess-board'), f=$('#chess-fb'), t=$('#chess-turn'); if(!b)return;
  var had=!!(document.activeElement&&b.contains(document.activeElement));
  b.innerHTML=chessBoardHtml(ch); f.className='chess-fb '+ch.fb.k; f.textContent=ch.fb.t;
  if(t)t.textContent=ch.S.turn?'Brancas':'Pretas';
  var done=$('#chess-done'); if(done)done.hidden=!(ch.solved||chessDays().indexOf(ch.k)>=0);
  var stk=$('#chess-streak'); if(stk)stk.textContent=chessStreakText();
  var el=b.querySelector('[data-sq="'+ch.focus+'"]'); if(el&&had)el.focus({preventScroll:true});
}
function chessSelect(r,c){
  var ch=chessState(); ch.focus=sqName(r,c); ch.sel=[r,c];
  ch.moves=CE.legal(ch.S).filter(function(m){return m[0]===r&&m[1]===c});
  if(ch.moves.length)ch.fb={k:'info',t:'Agora clique na casa de destino.'}; else{ch.sel=null; ch.fb={k:'err',t:'Essa peça não tem nenhum lance possível agora.'}}
  chessRefresh();
}
function chessClick(n){
  var ch=chessState(); if(ch.busy||ch.solved)return;
  var rc=sqRC(n), r=rc[0], c=rc[1], p=ch.S.b[r][c]; ch.focus=n;
  if(ch.sel){
    if(ch.sel[0]===r&&ch.sel[1]===c){ch.sel=null; ch.moves=[]; ch.fb={k:'info',t:'Peça solta. Escolha outra peça.'}; return chessRefresh()}
    var mv=ch.moves.filter(function(m){return m[2]===r&&m[3]===c})[0];
    if(mv)return chessTry(mv);
    if(p&&CE.isW(p)===ch.S.turn)return chessSelect(r,c);
    ch.sel=null; ch.moves=[]; ch.fb={k:'err',t:'Essa peça não pode ir para lá. Escolha outra casa ou outra peça.'}; return chessRefresh();
  }
  if(!p){ch.fb={k:'info',t:'Primeiro clique na peça que você quer mover.'}; return chessRefresh()}
  if(CE.isW(p)!==ch.S.turn){ch.fb={k:'err',t:'Essa peça não é sua: é a vez das '+(ch.S.turn?'Brancas':'Pretas')+'.'}; return chessRefresh()}
  chessSelect(r,c);
}
function chessTry(m){
  var ch=chessState(), S0=ch.S, prevLast=ch.last, S1=CE.apply(S0,m), mine=mvName(m);
  if(ch.step===0&&!ch.cur)ch.cur=[ch.z.line].concat(ch.z.alts||[]).filter(function(L){return L[0]===mine})[0]||null;
  var L=ch.cur||ch.z.line, total=L.length, exp=L[ch.step*2];
  var lastUser=(ch.step*2===total-1), mate=CE.mated(S1), left0=(total+1)/2-ch.step, alt=false, reps0;
  if(!lastUser&&!mate&&ch.step>=1&&mine!==exp){reps0=CE.legal(S1); alt=reps0.length>0&&reps0.every(function(d){return CE.exists(CE.apply(S1,d),left0-1)})}
  ch.sel=null; ch.moves=[]; ch.busy=true; ch.S=S1; ch.last=m;
  if(mine===exp||(lastUser&&mate)||alt){
    if(lastUser){
      ch.solved=true; ch.busy=false;
      var altSol=!!ch.cur&&ch.cur!==ch.z.line;
      ch.fb={k:'ok',t:'Xeque-mate! '+(ch.tries?'Você resolveu em '+(ch.tries+1)+' tentativas.':'Resolveu de primeira!')+' '+(altSol?'Essa é uma solução alternativa, e também vale. A solução principal é: '+ch.z.sol+'.':ch.z.why)};
      var days=chessDays(); if(days.indexOf(ch.k)<0){days.push(ch.k); lsSet('gazeta-chess-days',days.slice(-400))}
      return chessRefresh();
    }
    ch.fb={k:'ok',t:'Muito bem, é esse lance! Veja como o adversário responde…'}; chessRefresh();
    setTimeout(function(){
      var st=chessState(); if(st!==ch)return;
      var rm=(mine===L[ch.step*2])?mvOf(L[ch.step*2+1]):CE.bestDefense(ch.S,left0-1); ch.S=CE.apply(ch.S,rm); ch.last=rm; ch.step++; ch.busy=false;
      ch.fb={k:'info',t:left0-1===1?'Agora dê o golpe final: o mate.':'Continue: ainda faltam '+(left0-1)+' lances para o mate.'}; chessRefresh();
    },800);
    return;
  }
  ch.tries++;
  var left=(total+1)/2-ch.step, gives=CE.inCheck(S1.b,S1.turn), txt=gives?'Dá xeque, mas o rei consegue se defender. Esse lance não leva ao mate em '+left+'.':'Não é esse. Esse lance não leva ao mate em '+left+'.';
  if(ch.tries>=2)txt+=' Abra “Quer uma dica?” se precisar.'; if(ch.tries>=4)txt+=' Ou veja a solução.';
  ch.fb={k:'err',t:txt}; chessRefresh();
  setTimeout(function(){var st=chessState(); if(st!==ch)return; ch.S=S0; ch.last=prevLast; ch.busy=false; ch.focus=sqName(m[0],m[1]); chessRefresh()},1200);
}
function chessReset(){var c=chessState(); state.chess=chessNew(c.z,c.k,c.dom); chessRefresh()}
document.addEventListener('click',function(e){var q=e.target.closest&&e.target.closest('#chess-board .sq'); if(q)chessClick(q.dataset.sq)});
document.addEventListener('keydown',function(e){
  var q=e.target.closest&&e.target.closest('#chess-board .sq'); if(!q)return;
  var k={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowUp:[-1,0],ArrowDown:[1,0]}[e.key]; if(!k)return; e.preventDefault();
  var rc=sqRC(q.dataset.sq), r=Math.max(0,Math.min(7,rc[0]+k[0])), c=Math.max(0,Math.min(7,rc[1]+k[1])), n=sqName(r,c), ch=chessState();
  var cur=q; ch.focus=n; var nx=document.querySelector('#chess-board [data-sq="'+n+'"]'); if(nx){cur.tabIndex=-1; nx.tabIndex=0; nx.focus()}
});
function chessHtml(){
  var ch=chessState(), z=ch.z, w=weekNow(), k=CHESS_FACTS[((Math.round((pzToday().d-WK_EPOCH)/864e5)%CHESS_FACTS.length)+CHESS_FACTS.length)%CHESS_FACTS.length], d=pzToday().d;
  var done=ch.solved||chessDays().indexOf(ch.k)>=0;
  var tag=ch.dom?(z.hard?'Puzzle de domingo · desafio de mate em 3':'Puzzle de domingo · partida famosa'):'Puzzle do dia · '+d.getDate()+' de '+MESL[d.getMonth()];
  return '<section class="chess" aria-labelledby="chess-t"><h3 class="sec-banner" id="chess-t">Como anda o mundo do xadrez</h3><div class="chess-grid">'+
    '<div class="chess-puzzle"><p class="kicker">'+esc(tag)+'</p><p><b>'+esc(z.goal)+'</b> <span class="chess-done" id="chess-done"'+(done?'':' hidden')+'>· ✔ resolvido hoje</span></p><div class="chess-main"><div id="chess-board">'+chessBoardHtml(ch)+'</div>'+
    '<div class="chess-info"><p><b class="lbl">Vez das</b> <span id="chess-turn">'+(ch.S.turn?'Brancas':'Pretas')+'</span></p><div class="chess-fb '+ch.fb.k+'" id="chess-fb" role="status" aria-live="polite">'+esc(ch.fb.t)+'</div>'+
    '<div class="chess-act"><button class="btn small" type="button" data-act="chessreset">Recomeçar o puzzle</button></div>'+
    '<p><b class="lbl">'+esc(z.lbl)+'</b><br>'+esc(z.game)+(z.place?', '+esc(z.place):'')+'.</p>'+(z.note?'<p>'+esc(z.note)+'</p>':'')+
    '<details><summary>Quer uma dica?</summary><p>'+esc(z.hint)+'</p></details>'+
    '<details><summary>Ver a solução</summary><p class="sol">'+esc(z.sol)+'</p><p>'+esc(z.why)+'</p></details></div></div>'+
    '<p class="hint" id="chess-streak">'+esc(chessStreakText())+'</p><p class="hint">Um puzzle novo todo dia, à meia-noite. Aos domingos, um desafio: uma partida famosa ou um mate em 3.</p></div>'+
    '<aside class="chess-fact"><p class="kicker">Curiosidade do dia</p><p class="fact">'+esc(k)+'</p><p class="hint">Muda todos os dias.</p></aside></div></section>';
}
  return {html:chessHtml, reset:chessReset};
}
