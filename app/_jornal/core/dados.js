/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { DEFAULT_GENRES, DEMO, SEED, state } from './base.js';
import { canReadEarlyAccess } from '../views/foto.js';
import { pendingStories } from '../engine.js';
import { weekNoOf } from '../views/semana.js';

export 

/* ---------- dados ---------- */
function genres(){
  var set=DEFAULT_GENRES.slice();
  state.works.forEach(function(w){if(w.genre&&set.indexOf(w.genre)<0)set.push(w.genre)});
  return set;
}
export 
function allWorks(){
  var base=state.hideSamples?[]:SEED;
  var mine=state.works.map(function(w){return {id:w.id,title:w.title,genre:w.genre,text:w.text,at:w.at||0,earlyUntil:w.earlyUntil||0,behind:w.behind||''}});
  return base.concat(mine).sort(function(a,b){return (b.at||0)-(a.at||0)}).map(function(w){
    var earlyUntil=w.earlyUntil||0, isLocked=earlyUntil>Date.now()&&!canReadEarlyAccess();
    return {kind:'work',key:w.id,id:w.id,title:w.title,genre:w.genre,text:isLocked?'':w.text,at:w.at,by:'Raul Xavier',sample:!!w.sample,
      earlyUntil:earlyUntil,locked:isLocked,readMinutes:Math.max(1,Math.round((w.text||'').trim().split(/\s+/).length/200)),behind:canReadEarlyAccess()?(w.behind||''):'',hasBehind:!!w.behind};
  });
}
export 
function rankedStories(){
  var counts={};
  Object.keys(state.likeDocs).forEach(function(k){
    ((state.likeDocs[k]||{}).ids||[]).forEach(function(id){counts[id]=(counts[id]||0)+1});
  });
  var out=[];
  Object.keys(state.storyDocs).forEach(function(uid){
    ((state.storyDocs[uid]||{}).items||[]).forEach(function(it){
      if((it.status||'aprovada')!=='aprovada'||!(it.check&&it.check.v)||state.bans[uid])return;
      var key=uid+':'+it.id;
      out.push({kind:'story',key:key,uid:uid,id:it.id,pen:it.pen,title:it.title,genre:it.genre,text:it.text,bio:it.bio||'',at:it.at||0,likes:counts[key]||0,status:'aprovada',check:it.check,wk:weekNoOf(it.at||0)});
    });
  });
  if(state.demo){
    DEMO.forEach(function(d,i){
      out.push({kind:'story',key:'demo:'+i,uid:'demo',demo:true,pen:d.pen,title:d.title,genre:d.genre,text:d.text,at:d.at,likes:d.likes});
    });
  }
  out.sort(function(a,b){return b.likes-a.likes||b.at-a.at});
  return out;
}
export 
function findItem(r){
  if(!r)return null;
  if(r.kind==='work')return allWorks().filter(function(w){return w.key===r.key})[0]||null;
  var arr=rankedStories();
  for(var i=0;i<arr.length;i++){if(arr[i].key===r.key){arr[i].rank=i+1;return arr[i]}}
  var pd=pendingStories();
  for(var j=0;j<pd.length;j++){if(pd[j].key===r.key)return pd[j]}
  return null;
}
export 
function myLikes(){return (state.likeDocs[state.uid]||{}).ids||[]}
