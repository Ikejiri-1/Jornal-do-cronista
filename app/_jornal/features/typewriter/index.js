import { IOS } from '../ios/platform.js';
import { createSound } from './sound.js';
// Máquina de escrever: 4 modelos de teclado, som, rascunho (draftRestore vem de ux), travas de envio e iOS (visualViewport).
export function createTypewriter(c){
  var state=c.state,$=c.$,lsGet=c.lsGet,lsSet=c.lsSet,render=c.render,toTop=c.toTop,draftRestore=c.draftRestore;
  var snd=createSound(function(){return twMode});
  var twCtx=snd.ctx, twKbHit=snd.kbHit, twHit=snd.hit, twThump=snd.thump, twRing=snd.ring;
  var twEl=$('#tw'), twOpen=false, twKb=false, twKbKeys={}, twBase=0, twKind='story', twForm=null, twHome=null, twSound=lsGet('gazeta-tw-sound',1)!==0, twKeys={};
(function(){
  var rows=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'], h='';
  rows.forEach(function(r){h+='<div class="tw-row">'+r.split('').map(function(c){return '<span class="tw-key" data-k="'+c+'">'+c+'</span>'}).join('')+'</div>'});
  h+='<div class="tw-row"><span class="tw-key sp" data-k=" "></span></div>';
  $('#tw-keys').innerHTML=h;
  twEl.querySelectorAll('.tw-key').forEach(function(k){twKeys[k.dataset.k]=k});
  $('#tw-sound').textContent='Som: '+(twSound?'ligado':'desligado'); $('#tw-sound').setAttribute('aria-pressed',String(twSound));
})();
function twKbPress(name){var k=twKbKeys[name]; if(k){k.classList.add('down'); setTimeout(function(){k.classList.remove('down')},90)}}
function twStrike(ch){
  if(twKb){twKbPress((ch||' ').toUpperCase()); if(twSound&&twCtx())twKbHit(ch===' '?'space':'k',Math.random()); return}
  var k=twKeys[(ch||' ').toUpperCase()]||(ch===' '?twKeys[' ']:null);
  if(k){k.classList.add('down'); setTimeout(function(){k.classList.remove('down')},90)}
  if(!twSound||!twCtx())return;
  var t=snd.ac().currentTime+.002, r=Math.random();
  if(ch===' '){ twThump(t,85+r*10,.1,.45); twHit(t,{d:.05,g:.3,f:900,q:.8}); twHit(t+.03,{d:.06,g:.12,f:380,q:.7}); return }
  twHit(t,{d:.016,g:.5+r*.15,f:3000+r*1100,q:1.3});
  twThump(t+.004,115+r*40,.075,.4);
  twHit(t+.014,{d:.05,g:.16,f:620+r*120,q:.8});
  twHit(t+.05,{d:.03,g:.08,f:1500,q:2});
}
function twBack(){
  if(twKb){twKbPress('BACK'); if(twSound&&twCtx())twKbHit('back',Math.random()); return}
  if(!twSound||!twCtx())return; var t=snd.ac().currentTime+.002;
  twHit(t,{d:.02,g:.25,f:2200,q:1}); twThump(t,150,.05,.18); twHit(t+.03,{d:.03,g:.1,f:900,q:1});
}
function twReturn(){
  if(twKb){twKbPress('ENTER'); if(twSound&&twCtx())twKbHit('enter',Math.random()); return}
  if(!twSound||!twCtx())return; var t=snd.ac().currentTime+.002, i;
  twHit(t,{d:.03,g:.4,f:1800,q:1.2});
  twHit(t+.04,{d:.34,g:.1,f:520,type:'lowpass',q:.7});
  for(i=0;i<14;i++)twHit(t+.05+i*.022,{d:.011,g:.17,f:2700+i*45,q:2});
  twThump(t+.38,72,.16,.55); twHit(t+.38,{d:.07,g:.4,f:620,q:.8});
}
function twBell(){
  if(twKb||!twSound||!twCtx())return; var t=snd.ac().currentTime+.002;
  twHit(t,{d:.01,g:.3,f:5000,q:1});
  twRing(t,2400,1.5,.2); twRing(t,2400*2.76,.9,.1); twRing(t,2400*5.4,.5,.05); twRing(t,2410,1.2,.1);
}
function twAuto(t){t=t||$(twKind==='work'?'#w-text':'#s-text'); if(!t)return; t.style.height='auto'; t.style.height=(t.scrollHeight+4)+'px'}
function twFit(){
  var vv=window.visualViewport, h=vv?vv.height:window.innerHeight;
  twEl.style.height=h+'px'; twEl.style.top=(vv?vv.offsetTop:0)+'px'; twEl.classList.toggle('compact',h<560);
}
function openTypewriter(kind){
  kind=kind||'story';
  if(twOpen)return true;
  var form=$(kind==='work'?'#workForm':'#storyForm'), first=$(kind==='work'?'#w-title':'#s-pen');
  twKind=kind; twForm=form; twHome={p:form.parentNode,n:form.nextSibling};
  if(kind==='story'&&!first.value){try{first.value=localStorage.getItem('gazeta-pen')||''}catch(x){}}
  var why='';
  if(kind==='story'){
    if(!state.uid)why='Você pode escrever agora. Ao enviar, pedimos o seu login e guardamos o rascunho.';
    else if(state.canWrite===false)why='Seu acesso a esta página é só de leitura. Você pode escrever aqui, mas para publicar peça ao dono acesso de colaborador.';
  }
  $('#tw-lock').textContent=why; var sv=$(kind==='work'?'#w-save':'#s-save'); if(sv)sv.disabled=!!why&&!!state.uid;
  $('#tw-slot').appendChild(form); form.hidden=false;
  $('#tw-where').textContent=kind==='work'?'Mesa do redator · Original':'Redação · O Contista';
  try{$('#tw-date').textContent=new Date().toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'}).toUpperCase()}catch(x){}
  document.querySelector('.sheet').classList.add('in-hidden'); document.body.style.overflow='hidden';
  twBase=state.lastPost; window.scrollTo(0,0); twEl.hidden=false; twOpen=true; twFit(); twAuto(); $('#tw-msg').textContent='';
  if(kind==='story')draftRestore();
  var ftw=function(){try{(kind==='story'&&$('#s-pen').value?$('#s-title'):first).focus({preventScroll:true})}catch(x){}};
  if(IOS)ftw();
  setTimeout(ftw,60);
  return true;
}
function closeTypewriter(){
  if(!twOpen)return; twOpen=false;
  if(twForm&&twHome&&twHome.p)twHome.p.insertBefore(twForm,twHome.n);
  twEl.hidden=true; document.body.style.overflow=''; document.querySelector('.sheet').classList.remove('in-hidden');
  if(twKind==='work'){state.workFormOpen=false; state.editing=null}else state.composerOpen=false;
  twAuto($('#s-text')); twAuto($('#w-text')); render();
  var b=document.querySelector(twKind==='work'?'[data-act="newwork"]':'#btnNewStory'); if(b)b.focus({preventScroll:true});
  twForm=null; twHome=null; $('#tw-lock').textContent=''; var sv2=$('#s-save'); if(sv2)sv2.disabled=false;
  if(state.goEnvios){state.goEnvios=false; state.layer='envios'; state.reading=null; render(); toTop()}
}
/* teclados: desenho (um só, com 3 aparências em CSS), troca de modelo e memória da escolha */
var TW_M=['type','office','mech','mem'], TW_L={type:'máquina',office:'escritório',mech:'mecânico',mem:'membrana'}, twMode=lsGet('gazeta-tw-mode','');
(function(){
  var R=[
   ['1','2','3','4','5','6','7','8','9','0',{k:'⌫',n:'BACK',w:1.6}],
   [{s:.5},'Q','W','E','R','T','Y','U','I','O','P',{s:1.1}],
   [{s:.75},'A','S','D','F','G','H','J','K','L',{k:'↵',n:'ENTER',w:1.85}],
   [{s:1.25},'Z','X','C','V','B','N','M',',','.',{s:1.35}],
   [{k:'Ctrl',m:1,w:1.3},{k:'Alt',m:1,w:1.3},{n:' ',w:5.5},{k:'Alt',m:1,w:1.3},{k:'Ctrl',m:1,w:1.3},{s:.9}]
  ], h='<div class="kb-wrap">';
  R.forEach(function(row){
    h+='<div class="kb-r">'+row.map(function(c){
      if(typeof c==='string')return '<span class="kb-k" data-k="'+c+'">'+c+'</span>';
      if(c.s)return '<span class="kb-s" style="flex-grow:'+c.s+'"></span>';
      return '<span class="kb-k'+(c.m?' mod':'')+'"'+(c.n?' data-k="'+c.n+'"':'')+' style="flex-grow:'+(c.w||1)+'">'+(c.k||'')+'</span>';
    }).join('')+'</div>';
  });
  $('#tw-kbd').innerHTML=h+'</div>';
  $('#tw-kbd').querySelectorAll('[data-k]').forEach(function(e){twKbKeys[e.dataset.k]=e});
  if(TW_M.indexOf(twMode)<0)twMode=lsGet('gazeta-tw-kb',0)===1?'office':'type'; // migra a escolha antiga (0/1)
})();
function twApplyKb(){
  twKb=twMode!=='type';
  twEl.classList.toggle('kb',twKb);
  TW_M.forEach(function(m){twEl.classList.toggle('m-'+m,m===twMode)});
  var b=$('#tw-kbtoggle'); b.textContent='Teclado: '+TW_L[twMode];
}
twApplyKb();
$('#tw-kbtoggle').addEventListener('click',function(){
  twMode=TW_M[(TW_M.indexOf(twMode)+1)%TW_M.length]; lsSet('gazeta-tw-mode',twMode); twApplyKb(); twFit();
  if(twSound&&twCtx()){ if(twKb)twKbHit('k',.5); else twBell() }
  var t=$(twKind==='work'?'#w-text':'#s-text'); if(t&&twOpen)t.focus({preventScroll:true});
});
$('#tw-exit').addEventListener('click',closeTypewriter);
$('#tw-sound').addEventListener('click',function(){twSound=!twSound; lsSet('gazeta-tw-sound',twSound?1:0); this.textContent='Som: '+(twSound?'ligado':'desligado'); this.setAttribute('aria-pressed',String(twSound)); if(twSound){twCtx(); twBell()}});
twEl.addEventListener('click',function(e){if(e.target.closest('[data-act="closestory"],[data-act="cancelwork"]'))closeTypewriter()});
document.addEventListener('keydown',function(e){if(twOpen&&e.key==='Escape')closeTypewriter()});
if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){if(twOpen)twFit()}); window.visualViewport.addEventListener('scroll',function(){if(twOpen)twFit()})}
window.addEventListener('resize',function(){if(twOpen)twFit()});
['#s-text','#s-title','#s-pen','#s-bio','#w-text','#w-title','#w-genre-new','#w-behind'].forEach(function(sel){
  $(sel).addEventListener('input',function(e){
    var big=(sel==='#s-text'||sel==='#w-text'), t=e.inputType||'', ch=e.data;
    if(big)twAuto(this);
    if(!twOpen)return;
    if(t==='insertLineBreak'||(big&&ch==='\n'))twReturn();
    else if(t.indexOf('delete')===0)twBack();
    else if(ch)twStrike(ch);
    if(big){
      var v=this.value, pos=this.selectionStart, ls=v.lastIndexOf('\n',pos-1)+1;
      if(t.indexOf('insert')===0&&pos-ls===60)twBell();
      if(pos===v.length){var sc=$('#tw-scroll'); sc.scrollTop=sc.scrollHeight}
    }
  });
});
new MutationObserver(function(){
  if(!twOpen)return; var n=$('#note'), m=$('#tw-msg');
  m.textContent=n.hidden?'':n.textContent; m.className='tw-msg'+(n.classList.contains('err')?' err':'');
}).observe($('#note'),{childList:true,characterData:true,subtree:true,attributes:true});
$('#workForm').addEventListener('submit',function(){
  if(!twOpen)return; var n=0, iv=setInterval(function(){
    n++; if(!twOpen||n>220){clearInterval(iv);return}
    if(!state.workFormOpen){clearInterval(iv); setTimeout(function(){if(twOpen)closeTypewriter()},2200)}
  },400);
});
$('#storyForm').addEventListener('submit',function(){
  if(!twOpen)return; var t0=twBase, n=0;
  var iv=setInterval(function(){
    n++; if(!twOpen||n>220){clearInterval(iv);return}
    if(state.lastPost>t0){clearInterval(iv); setTimeout(function(){if(twOpen){state.goEnvios=true; closeTypewriter()}},2600)}
  },400);
});

  return {open:openTypewriter, close:closeTypewriter, isOpen:function(){return twOpen}, fit:twFit,
    sound:function(){return twSound}, setSound:function(v){twSound=!!v; lsSet('gazeta-tw-sound',twSound?1:0)},
    ctx:snd.ctx, hit:snd.hit, thump:snd.thump, ring:snd.ring, ac:snd.ac};
}
