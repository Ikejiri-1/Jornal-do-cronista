/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { lsGet, lsSet } from '../views/extras.js';

export 

/* ---------- modo local: quando o arquivo é aberto fora da plataforma, tudo funciona neste navegador ---------- */
function makeLocalDB(){
  var KEY='gazeta-localdb', data=lsGet(KEY,{}), subs=[];
  if(!data||typeof data!=='object'||Array.isArray(data))data={};
  function save(){lsSet(KEY,data)}
  function clone(v){return JSON.parse(JSON.stringify(v))}
  function notify(){subs.slice().forEach(function(f){f()})}
  function snap(c,id){var v=data[c]&&data[c][id]; return {id:id,exists:v!==undefined,data:function(){return v===undefined?undefined:clone(v)}}}
  function listen(f){subs.push(f); setTimeout(f,0); return function(){subs=subs.filter(function(x){return x!==f})}}
  function docRef(c,id){return {
    get:async function(){return snap(c,id)},
    set:async function(v){(data[c]||(data[c]={}))[id]=clone(v); save(); notify()},
    update:async function(v){var current=(data[c]&&data[c][id])||{}; (data[c]||(data[c]={}))[id]=Object.assign({},current,clone(v)); save(); notify()},
    delete:async function(){if(data[c])delete data[c][id]; save(); notify()},
    onSnapshot:function(cb){return listen(function(){cb(snap(c,id))})}
  }}
  return {
    collection:function(c){return {doc:function(id){return docRef(c,id)},onSnapshot:function(cb){return listen(function(){cb({docs:Object.keys(data[c]||{}).map(function(id){return snap(c,id)})})})}}},
    doc:function(path){var i=path.indexOf('/'); return docRef(path.slice(0,i),path.slice(i+1))}
  };
}
