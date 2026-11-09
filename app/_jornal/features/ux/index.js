// Idioma, "pular para o conteúdo", erros amigáveis, rascunho automático, atalho de envio e setas nas abas.
export function createUx(c){
  var $=c.$,note=c.note,lsGet=c.lsGet,lsSet=c.lsSet;
try{document.documentElement.lang='pt-BR'}catch(e){}
$('#skip').addEventListener('click',function(e){
  e.preventDefault();
  var m=document.querySelector('main:not([hidden])'); if(!m)return;
  m.setAttribute('tabindex','-1'); m.focus({preventScroll:true}); m.scrollIntoView({block:'start'});
});
var lastErr=0;
function softError(){
  if(Date.now()-lastErr<30000)return; lastErr=Date.now();
  try{note('Algo não saiu como esperado. Se continuar assim, recarregue a página.','err')}catch(e){}
}
window.addEventListener('error',function(e){if(e&&e.message&&/ResizeObserver/.test(e.message))return; softError()});
window.addEventListener('unhandledrejection',softError);

var draftT=0;
/* Sem login: guarda o rascunho agora, marca que a pessoa estava publicando e vai para a tela de entrada. */
function goLogin(){
  draftNow(); try{sessionStorage.setItem('gazeta-resume','story')}catch(e){}
  location.href='/login?next=capa';
}
function draftSave(){
  clearTimeout(draftT);
  draftT=setTimeout(draftNow,500);
}
function draftNow(){
  {
    var d={pen:$('#s-pen').value,genre:$('#s-genre').value,title:$('#s-title').value,bio:$('#s-bio').value,text:$('#s-text').value,at:Date.now()};
    if(!d.title&&!d.text){try{localStorage.removeItem('gazeta-draft')}catch(e){} $('#s-draft').textContent=''; return}
    lsSet('gazeta-draft',d); $('#s-draft').textContent='· rascunho salvo neste aparelho · Ctrl+Enter envia';
  }
}
function draftRestore(){
  var d=lsGet('gazeta-draft',null); if(!d||typeof d!=='object'||Date.now()-(+d.at||0)>14*864e5)return;
  if($('#s-title').value||$('#s-text').value)return;
  if(typeof d.pen==='string'&&!$('#s-pen').value)$('#s-pen').value=d.pen.slice(0,40);
  if(typeof d.genre==='string'&&[].some.call($('#s-genre').options,function(o){return o.value===d.genre}))$('#s-genre').value=d.genre;
  $('#s-title').value=String(d.title||'').slice(0,120); $('#s-bio').value=String(d.bio||'').slice(0,160); $('#s-text').value=String(d.text||'').slice(0,6000);
  $('#s-text').dispatchEvent(new Event('input',{bubbles:true}));
  $('#s-draft').textContent='· rascunho recuperado · Ctrl+Enter envia';
}
['#s-pen','#s-genre','#s-title','#s-bio','#s-text'].forEach(function(sel){$(sel).addEventListener('input',draftSave); $(sel).addEventListener('change',draftSave)});
$('#s-text').addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault(); $('#s-save').click()}});
$('#w-text').addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault(); $('#w-save').click()}});
document.addEventListener('toggle',function(e){var t=e.target; if(t&&t.classList&&t.classList.contains('how')&&!t.open)lsSet('gazeta-how',1)},true);
document.querySelector('.layers').addEventListener('keydown',function(e){
  if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
  var tabs=[].slice.call(this.querySelectorAll('.layer')), i=tabs.indexOf(document.activeElement); if(i<0)return;
  e.preventDefault(); var n=tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]; n.focus(); n.click();
});

  return {goLogin:goLogin, draftRestore:draftRestore};
}
