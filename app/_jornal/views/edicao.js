/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { esc, isPoem, newId, plural, state } from '../core/base.js';
import { LINK_RE, SAFE_ID, clip, cnum, errText, note } from '../core/seguranca.js';
import { allWorks } from '../core/dados.js';
import { bylineOf, excerptOf, openBtn } from './html.js';
import { fsScale, readerTools } from './extras.js';
import { __set_artN, artFigure, artN, artSvg, closeLabel, emptyPage, hashStr, weekNow, weekRange } from './semana.js';

export let MESL, DEMO_EXTRA, DEMO_CM;

export 
function cleanRatings(r){var o={}; if(!r||typeof r!=='object')return o; Object.keys(r).slice(0,400).forEach(function(k){var v=+r[k]; if(k.length<=140&&v>=1&&v<=5)o[k]=Math.round(v)}); return o}
export 
function cleanComments(a){
  if(!Array.isArray(a))return []; var out=[], seen=Object.create(null);
  a.slice(0,40).forEach(function(c){
    if(!c||typeof c!=='object'||typeof c.id!=='string'||!SAFE_ID.test(c.id)||seen[c.id]||typeof c.k!=='string'||c.k.length>140)return; seen[c.id]=1;
    var t=clip(c.t,240).trim(); if(!t)return;
    out.push({id:c.id,k:c.k,t:t,p:clip(c.p,40).trim()||'Leitor',at:cnum(c.at,0,9e15)});
  });
  return out;
}
export 
function ratingStats(it){
  if(it.demo&&it.rat)return {avg:it.rat[0],n:it.rat[1],mine:0};
  var sum=0,n=0,mine=0;
  Object.keys(state.ratingDocs).forEach(function(u){var v=((state.ratingDocs[u]||{}).r||{})[it.key]; if(v>=1&&v<=5){sum+=v;n++; if(u===state.uid)mine=v}});
  return {avg:n?sum/n:0,n:n,mine:mine};
}
export 
function starsHtml(it){
  var st=ratingStats(it), why='';
  if(it.demo)why='Exemplo: as avaliações são fixas.';
  else if(state.dbOff||!state.uid)why='Entre na sua conta para avaliar.';
  else if(state.canWrite===false)why='Seu acesso é só de leitura.';
  else if(it.uid&&it.uid===state.uid)why='Você não pode avaliar o próprio texto.';
  else if(it.kind==='work'&&state.canEdit)why='O autor não avalia os próprios textos.';
  var h='<span class="stars" role="group" aria-label="Avaliação de 1 a 5 estrelas">';
  for(var i=1;i<=5;i++){var on=st.mine?i<=st.mine:i<=Math.round(st.avg); h+='<button type="button" class="'+(on?'':'dim')+'" data-act="rate" data-key="'+esc(it.key)+'" data-n="'+i+'" aria-label="'+i+' '+plural(i,'estrela','estrelas')+'"'+(why?' disabled title="'+esc(why)+'"':'')+'>★</button>'}
  return h+(why&&!it.demo?'<span class="why">('+esc(why.toLowerCase().replace(/\.$/,''))+')</span>':'')+'<span class="meta">'+(st.n?st.avg.toFixed(1).replace('.',',')+' · '+st.n+' '+plural(st.n,'avaliação','avaliações'):'sem avaliações')+(st.mine?' · você deu '+st.mine:'')+'</span></span>';
}
export 
async function rateItem(key,n){
  if(!state.db||!state.uid||state.canWrite===false||!(n>=1&&n<=5))return;
  var r=Object.assign({},((state.ratingDocs[state.uid]||{}).r)||{}); r[key]=n;
  var ks=Object.keys(r); if(ks.length>400)delete r[ks[0]];
  try{await state.db.doc('ratings/'+state.uid).set({r:r}); note('Obrigado pela avaliação!')}catch(err){note(errText(err),'err')}
}
export 
function commentsFor(it){
  if(it.demo)return (it.cms||[]).map(function(c,i){return {uid:'demo',id:'d'+i,p:c[0],t:c[1],at:0}});
  var out=[]; Object.keys(state.commentDocs).forEach(function(u){if(state.bans[u])return; ((state.commentDocs[u]||{}).items||[]).forEach(function(c){if(c.k===it.key)out.push({uid:u,id:c.id,p:c.p,t:c.t,at:c.at})})});
  out.sort(function(a,b){return b.at-a.at}); return out.slice(0,12);
}
export 
function commentsBox(it){
  var list=commentsFor(it), draft=state.cmDraft[it.key]||'', can=!it.demo&&state.db&&state.uid&&state.canWrite!==false;
  var h='<section class="cm-box"><h3>Comentários que motivam o escritor:</h3>';
  h+=list.length?list.map(function(c){return '<div class="cm"><b>'+esc(c.p)+'</b> — '+esc(c.t)+((c.uid!=='demo'&&(c.uid===state.uid||state.canEdit))?' <button class="hl" data-act="cmdel" data-uid="'+esc(c.uid)+'" data-id="'+esc(c.id)+'"><u>apagar</u></button>':'')+'</div>'}).join(''):'<p class="hint">Ainda sem comentários. Seja a primeira pessoa a incentivar.</p>';
  if(can)h+='<div class="cm-form"><input class="cm-input" data-key="'+esc(it.key)+'" maxlength="240" placeholder="Deixe uma palavra de incentivo para o escritor" aria-label="Comentário de incentivo" value="'+esc(draft)+'"><button class="btn small" data-act="cmsend" data-key="'+esc(it.key)+'">Comentar</button></div><p class="hint">Só comentários de incentivo e sem links. O editor remove o que não for gentil.</p>';
  else if(!it.demo)h+='<p class="hint">Entre na sua conta para comentar.</p>';
  return h+'<div class="cm-foot"><span><b class="hint">AVALIAÇÃO:</b> '+starsHtml(it)+'</span></div></section>';
}
export 
async function addComment(key){
  if(!state.db||!state.uid||state.canWrite===false)return;
  var inp=document.querySelector('.cm-input[data-key="'+CSS.escape(key)+'"]'), t=(inp?inp.value:'').replace(/[\u0000-\u001F]/g,' ').trim().slice(0,240);
  if(t.length<3){note('Escreva um comentário de incentivo.','err');return}
  if(LINK_RE.test(t)){note('Links e e-mails não são permitidos nos comentários.','err');return}
  if(Date.now()-state.cmLast<15000){note('Aguarde alguns segundos para comentar de novo.','err');return}
  var cur=((state.commentDocs[state.uid]||{}).items||[]).slice();
  if(cur.length>=40){note('Limite de comentários atingido.','err');return}
  if(cur.filter(function(c){return c.k===key}).length>=2){note('Você já comentou duas vezes neste texto.','err');return}
  var pen=''; try{pen=localStorage.getItem('gazeta-pen')||''}catch(e){}
  cur.push({id:newId(),k:key,t:t,p:(pen||'Leitor').slice(0,40),at:Date.now()});
  try{await state.db.doc('comments/'+state.uid).set({items:cur}); state.cmLast=Date.now(); state.cmDraft[key]=''; state.cmFocusKey=null; note('Comentário enviado. Obrigado por incentivar!')}catch(err){note(errText(err),'err')}
}
export 
async function delComment(uid,id){
  if(!state.db||!uid||(uid!==state.uid&&!state.canEdit))return;
  try{var ref=state.db.doc('comments/'+uid), snap=await ref.get(), d=snap.exists?snap.data():{}; await ref.set({items:(d.items||[]).filter(function(c){return c.id!==id})}); note('Comentário apagado.')}catch(err){note(errText(err),'err')}
}
export 
function cmRestore(){
  if(!state.cmFocusKey)return;
  var el=document.querySelector('.cm-input[data-key="'+CSS.escape(state.cmFocusKey)+'"]');
  if(el&&document.activeElement!==el){el.focus({preventScroll:true}); var n=el.value.length; try{el.setSelectionRange(n,n)}catch(e){}}
}
export 

function avatarSvg(name){
  var h=hashStr(name), g=['#d8d8d3','#bdbdb7','#a0a09a','#7c7c78','#e6e6e1'][h%5], id='v'+(__set_artN(artN+1));
  var ini=(String(name||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('')||'?').toUpperCase();
  return '<svg class="avatar" viewBox="0 0 64 64" role="img" aria-label="Retrato ilustrado de '+esc(name)+'"><defs><pattern id="'+id+'" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.5" cy="2.5" r="1.1" fill="#000"/></pattern><clipPath id="c'+id+'"><circle cx="32" cy="32" r="31"/></clipPath></defs><g clip-path="url(#c'+id+')"><rect width="64" height="64" fill="'+g+'"/><circle cx="32" cy="26" r="11" fill="#111"/><path d="M8 64q0-22 24-22t24 22z" fill="#111"/><rect width="64" height="64" fill="url(#'+id+')" opacity=".25"/></g><text x="32" y="59" text-anchor="middle" font-size="11" font-family="monospace" fill="#fff">'+esc(ini)+'</text></svg>';
}
export 
function nameOf(it){return it.kind==='work'?'Raul Xavier':(it.pen||'Autor')}
export 
function bioOf(it){
  if(it.kind==='work')return 'Autor e editor do jornal O Contista.';
  return it.bio?it.bio:('Autor(a) de “'+it.title+'”, na seção '+it.genre+(it.likes?', com '+it.likes+' '+plural(it.likes,'voto','votos'):'')+'.');
}
export 
function bodyOf(it){
  if(isPoem(it))return '<div class="poem">'+esc(it.text)+'</div>';
  return '<div class="art-body">'+it.text.split(/\n\s*\n/).map(function(p){return '<p>'+esc(p.replace(/\n/g,' ').trim())+'</p>'}).join('')+'</div>';
}
export 
function edHead(p,ed){
  var d=ed.mode==='real'?weekRange(weekNow())[0]:new Date();
  return '<p class="ed-head"><span class="l">'+d.getDate()+' de '+MESL[d.getMonth()]+' de '+d.getFullYear()+'</span><span class="c">'+(p===1?'Capa':'Página nº '+(p-1))+'</span><span class="r">'+(ed.mode==='real'?'Edição #'+ed.week:'Edição inaugural')+'</span></p>';
}
export 
function editionPage(it,p){
  var isEd=(p===5), c=Object.assign({},it,{edArt:true});
  return '<div class="edpage"><span class="ed-tab">'+esc(it.title)+'</span>'+(isEd?'<p class="ed-by">Autor: Editor</p>':'')+
    '<div class="ed-box" style="--fs:'+fsScale()+'"><p class="kicker">'+(isEd?'Texto do editor':(p-1)+'º lugar')+' · '+esc(it.genre)+(isEd?'':' · '+it.likes+' '+plural(it.likes,'voto','votos'))+'</p>'+
    artFigure(it,false)+readerTools(it)+bodyOf(it)+'<p class="endmark">— Fim —</p>'+
    '<div class="ed-foot"><span>Dias faltando: '+closeLabel()+' para a próxima edição</span><span class="who">'+esc(nameOf(it))+'</span></div></div>'+
    commentsBox(it)+'</div>';
}
export 
function colsHtml(ed){
  var short=ed.list.slice(3).concat(allWorks().filter(function(w){return !ed.pick||w.key!==ed.pick.key})).sort(function(a,b){return String(a.text).length-String(b.text).length}).slice(0,4);
  var others=ed.list.slice(3,6); if(others.length<3)others=others.concat(allWorks().filter(function(w){return !ed.pick||w.key!==ed.pick.key}).slice(0,3-others.length));
  var h='<h3 class="sec-banner">Contos e histórias para quem tem muita pressa</h3>';
  h+=short.length?'<div class="cols4">'+short.map(function(x){
    return '<article class="piece"><p class="kicker">'+esc(x.genre)+'</p><h3 class="h-mid">'+openBtn(x,'hl',esc(x.title))+'</h3><p class="byline">'+bylineOf(x)+'</p><p class="excerpt">'+excerptOf(x,520)+'</p><p class="jump">'+openBtn(x,'hl','Ler completo ›')+'</p><div class="rate">'+starsHtml(x)+'</div></article>';
  }).join('')+'</div>':emptyPage(6);
  var au=ed.list.slice(0,3);
  if(au.length)h+='<h3 class="sec-banner">Sobre os autores da semana:</h3><div class="authors3">'+au.map(function(x){
    return '<div class="acard">'+avatarSvg(nameOf(x))+'<div><b>'+esc(nameOf(x))+'</b><p>'+esc(bioOf(x))+'</p><p>'+openBtn(x,'hl','Ler “'+esc(x.title)+'” ›')+'</p></div></div>';
  }).join('')+'</div>';
  if(others.length)h+='<h3 class="sec-banner">Conheça mais sobre os outros escritores</h3><div class="others3">'+others.map(function(x){
    return '<div class="ocard">'+artSvg(x.genre,x.title,false)+'<p class="lbl">Sobre:</p><p>'+esc(nameOf(x))+' · '+esc(bioOf(x))+'</p><p class="lbl">Texto:</p><p>'+openBtn(x,'hl','Ler “'+esc(x.title)+'” ›')+'</p></div>';
  }).join('')+'</div>';
  return h;
}

export function init(){

/* ---------- páginas da edição conforme o desenho: avaliação, comentários, autores ---------- */
MESL=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

DEMO_EXTRA={'Cecília P.':{bio:'Escreve contos curtos no ônibus, entre uma parada e outra.',rat:[4.7,23]},'Henrique B.':{bio:'Poeta de domingo e leitor de jornal impresso.',rat:[4.5,19]},'Duda L.':{bio:'Cresceu perto do mar e escreve sobre faróis e viagens.',rat:[4.4,17]},'Iara M.':{bio:'Contadora de histórias de dragões e de segundas-feiras.',rat:[4.2,14]},'Otávio R.':{bio:'Engenheiro de dia, escritor de ficção científica à noite.',rat:[4.0,11]},'Lúcia F.':{bio:'Cronista de cozinha, de família e de memória.',rat:[4.8,9]}};

DEMO_CM={0:[['Marina','Que delicadeza! Continue escrevendo, a gata merece mais histórias.'],['João','Li duas vezes. Obrigado por esse texto.']],1:[['Paulo','Versos que acalmam. Parabéns, Henrique!']],2:[['Clara','O faroleiro ficou na minha cabeça o dia todo.']]};

document.addEventListener('input',function(e){var t=e.target; if(t&&t.classList&&t.classList.contains('cm-input')){state.cmDraft[t.dataset.key]=t.value; state.cmFocusKey=t.dataset.key}});

document.addEventListener('pointerdown',function(e){if(!(e.target.closest&&e.target.closest('.cm-input')))state.cmFocusKey=null},true);

document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.classList&&e.target.classList.contains('cm-input')){e.preventDefault(); addComment(e.target.dataset.key)}});
}
