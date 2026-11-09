// Correções de iOS: destravar o som no primeiro toque, girar o aparelho e <dialog> sem showModal.
export function createIos(c){
  var $=c.$,tw=c.tw,inEl=c.inEl,introSize=c.introSize;
/* o iOS só libera o som depois de um toque: destrava o áudio no primeiro gesto e de novo se o sistema o interromper */
function audioUnlock(){
  try{
    if(tw.ac()&&tw.ac().state==='running')return;
    var a=tw.ctx(); if(!a)return; if(a.state!=='running'&&a.resume)a.resume();
    var b=a.createBuffer(1,1,22050), src=a.createBufferSource(); src.buffer=b; src.connect(a.destination); src.start(0);
  }catch(e){}
}
['touchend','pointerup','click','keydown'].forEach(function(ev){document.addEventListener(ev,audioUnlock,true)});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&tw.ac()&&tw.ac().state!=='running'&&tw.ac().state!=='closed'&&tw.ac().resume){try{tw.ac().resume()}catch(e){}}});
/* girar o aparelho: o iOS avisa o tamanho novo com atraso */
window.addEventListener('orientationchange',function(){setTimeout(function(){if(!inEl.hidden)introSize(); if(tw.isOpen())tw.fit()},350)});
/* <dialog> só existe a partir do iOS 15.4: abre e fecha de um jeito que funciona nos dois casos */
function dlgOpen(d){
  if(!d)return; var bd=$('#dlg-bd');
  if(typeof d.showModal==='function'){try{d.showModal(); return}catch(e){}}
  if(!bd){bd=document.createElement('div'); bd.id='dlg-bd'; bd.addEventListener('click',function(){dlgClose(d)}); document.body.appendChild(bd)}
  bd.hidden=false; d.setAttribute('open',''); d.classList.add('dlg-fb');
}
function dlgClose(d){
  if(!d)return; var bd=$('#dlg-bd'); if(bd)bd.hidden=true;
  if(typeof d.close==='function'&&!d.classList.contains('dlg-fb')){try{d.close(); return}catch(e){}}
  d.removeAttribute('open'); d.classList.remove('dlg-fb');
}
  return {dlgOpen:dlgOpen, dlgClose:dlgClose};
}
