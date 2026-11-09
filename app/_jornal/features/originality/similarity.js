// Parte pura da vistoria: compara um texto com uma lista de outros textos (sem DOM, sem estado).
function norm(x){return (x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
export function wordsOf(t){return norm(t).replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean)}
export function shingles(t,n){var w=wordsOf(t),o={}; if(w.length<n){o[w.join(' ')]=1;return o} for(var i=0;i<=w.length-n;i++)o[w.slice(i,i+n).join(' ')]=1; return o}
export function overlap(a,b){var k=Object.keys(a),c=0; if(!k.length)return 0; k.forEach(function(x){if(b[x])c++}); return c/k.length}
// others: [{t:texto, n:nome para mostrar}]. Devolve a pior semelhança encontrada.
// tick (opcional) é chamado entre os textos: se devolver uma Promise, a comparação espera por ela.
// Quem chama passa um "ceder à tela" para a vistoria não travar o navegador (ver index.js).
function scorer(text){
  var n=5, mw=wordsOf(text), mine=shingles(text,n), best={p:0,run:0,onde:'',score:0};
  return {best:best, add:function(o){
    var set=shingles(o.t||'',n), p=overlap(mine,set), run=0, cur=0;
    for(var i=0;i<=mw.length-n;i++){ if(set[mw.slice(i,i+n).join(' ')]){cur++; if(cur>run)run=cur}else cur=0 }
    var words=run?run+n-1:0, score=Math.max(p,words/60);
    if(p>best.p)best.p=p; if(words>best.run)best.run=words;
    if(score>best.score){best.score=score; best.onde=o.n}
  }};
}
export function localCheck(text,others){ var s=scorer(text); others.forEach(s.add); return s.best; }
// Versão que devolve o controle ao navegador a cada ~12 ms (nenhuma fatia passa de ~1 texto).
export async function localCheckIdle(text,others,yieldFn){
  var s=scorer(text), t=Date.now();
  for(var i=0;i<others.length;i++){
    s.add(others[i]);
    if(Date.now()-t>12){ await yieldFn(); t=Date.now(); }
  }
  return s.best;
}
