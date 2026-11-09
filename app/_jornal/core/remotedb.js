/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, state } from './base.js';
import { SAFE_ID, cleanIds, cleanItems, clip, cnum } from './seguranca.js';
import { render, schedule } from '../views/render.js';
import { BEHIND_THE_SCENES_MAX_LENGTH, MONTHLY_LETTER_MAX_LENGTH, SUBSCRIPTION_PLAN_LABELS } from '../views/assinatura.js';
import { FOLLOWING_LIMIT, PROFILE_BIO_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH } from '../views/perfil.js';
import { cleanChiefRequest, cleanProfilePhoto, safePaymentUrl } from '../views/foto.js';
import { cleanComments, cleanRatings } from '../views/edicao.js';
import { makeLocalDB } from './localdb.js';

export 
/* ---------- servidor próprio: mesma interface coleção/documento, agora pela API (leitura pública, escrita só com sessão) ---------- */
function makeRemoteDB(csrfToken,isChief){
  /* Cache em memória alimentado por UMA requisição na abertura (/api/db/bootstrap) e mantido por consulta de "o que mudou".
     Gravar atualiza a tela na hora (otimista) e desfaz se o servidor recusar; antes a tela esperava até 15 s pela próxima consulta. */
  var subs=[], cache=null, boot=null, seq=null, polling=false;
  function api(method,url,body){
    var headers={'Content-Type':'application/json'}; if(csrfToken)headers['X-CSRF-Token']=csrfToken;
    return fetch(url,{method:method,credentials:'same-origin',headers:headers,body:body===undefined?undefined:JSON.stringify(body)}).then(function(r){
      return r.json().catch(function(){return {}}).then(function(j){
        if(!r.ok){var e=new Error((j.error&&j.error.message)||'Erro'); e.code=j.error&&j.error.code; e.status=r.status; throw e}
        return j.data;
      });
    });
  }
  var path=function(c,id){return '/api/db/'+encodeURIComponent(c)+(id===undefined?'':'/'+encodeURIComponent(id))};
  function docSnap(id,r){return {id:id,exists:!!(r&&r.exists),data:function(){return r&&r.exists?r.data:undefined}}}
  function snapOf(sub){
    var m=cache&&cache[sub.c]; if(!m)return null;
    if(sub.id===undefined)return {docs:Array.from(m,function(e){return {id:e[0],exists:true,data:function(){return e[1]}}})};
    return m.has(sub.id)?docSnap(sub.id,{exists:true,data:m.get(sub.id)}):docSnap(sub.id,{exists:false});
  }
  function emit(c,id){subs.slice().forEach(function(sub){if(sub.c===c&&(id===undefined||sub.id===undefined||sub.id===id)){var s=snapOf(sub); if(s)sub.cb(s)}})}
  function put(c,id,v){var m=new Map([[id,v]]); (cache[c]||new Map()).forEach(function(x,k){if(k!==id)m.set(k,x)}); cache[c]=m} // mais recente primeiro, como o servidor lista
  function drop(c,id){if(cache[c]){var m=new Map(cache[c]); m.delete(id); cache[c]=m}}
  function pull(c,id){return api('GET',path(c,id)).then(function(r){if(!cache)return; if(r&&r.exists)put(c,id,r.data); else drop(c,id); emit(c,id)})}
  function refetch(sub){ // caminho de reserva: se a abertura em lote falhar, cada assinatura busca o seu
    var p=sub.id===undefined?api('GET',path(sub.c)).then(function(list){sub.cb({docs:list.map(function(d){return {id:d.id,exists:true,data:function(){return d.data}}})})}):api('GET',path(sub.c,sub.id)).then(function(r){sub.cb(docSnap(sub.id,r))});
    p.catch(function(e){if(sub.fail)sub.fail(e)});
  }
  function load(){
    return boot||(boot=api('GET','/api/db/bootstrap').then(function(r){
      cache={}; Object.keys(r.collections).forEach(function(c){cache[c]=new Map(r.collections[c].map(function(d){return [d.id,d.data]}))});
      seq=r.seq; return true;
    }).catch(function(){return false}));
  }
  function tick(){
    if(document.hidden||!cache)return;
    api('GET','/api/db/changes?since='+seq).then(function(r){seq=r.seq; r.items.forEach(function(m){pull(m.c,m.id).catch(function(){})})}).catch(function(){});
  }
  function open(){if(polling)return; polling=true; setInterval(tick,15000); document.addEventListener('visibilitychange',tick)}
  function listen(c,id,cb,fail){
    var sub={c:c,id:id,cb:cb,fail:fail}; subs.push(sub); open();
    load().then(function(ok){
      if(subs.indexOf(sub)<0)return;
      var s=ok&&cache[c]?snapOf(sub):null;
      if(s)cb(s); else refetch(sub);
    });
    return function(){subs=subs.filter(function(x){return x!==sub})};
  }
  /* shortcut: nas histórias o servidor reescreve o documento (status, data, consentimento), então ali a tela usa a resposta dele em vez do palpite local */
  function write(c,id,method,v,guess){
    if(!cache)return api(method,path(c,id),{data:v});
    var old=cache[c]&&cache[c].get(id), optimistic=c!=='stories'||!!isChief; // a gravação do chefe nas histórias não é reescrita pelo servidor
    if(optimistic){put(c,id,guess(old)); emit(c,id)}
    return api(method,path(c,id),{data:v}).then(function(saved){
      if(saved&&typeof saved==='object'){put(c,id,saved); emit(c,id)}
    },function(e){
      if(optimistic){if(old===undefined)drop(c,id); else put(c,id,old); emit(c,id)}
      throw e;
    });
  }
  function docRef(c,id){return {
    get:function(){return api('GET',path(c,id)).then(function(r){return docSnap(id,r)})},
    set:function(v){return write(c,id,'PUT',v,function(){return v})},
    update:function(v){return write(c,id,'PATCH',v,function(old){return Object.assign({},old,v)})},
    delete:function(){
      if(!cache)return api('DELETE',path(c,id));
      var old=cache[c]&&cache[c].get(id); drop(c,id); emit(c,id);
      return api('DELETE',path(c,id)).catch(function(e){if(old!==undefined){put(c,id,old); emit(c,id)} throw e});
    },
    onSnapshot:function(cb,fail){return listen(c,id,cb,fail)}
  }}
  return {
    collection:function(c){return {doc:function(id){return docRef(c,id)},onSnapshot:function(cb,fail){return listen(c,undefined,cb,fail)}}},
    doc:function(p){var i=p.indexOf('/'); return docRef(p.slice(0,i),p.slice(i+1))}
  };
}
export 
/* conta: entrar / sair e manter a sessão viva enquanto a pessoa escreve (expira após 30 min parada) */
function accountRender(me){
  var el=$('#acct'); if(!el)return;
  if(me){ el.innerHTML='<span class="acct-name">'+esc(me.name)+(me.canEdit?' · chefe':'')+'</span>'+(me.canEdit?'<a class="btn small" href="/chefe">Painel do chefe</a>':'')+'<button class="btn small" type="button" id="acct-out">Sair</button>'; $('#acct-out').onclick=function(){fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':me.csrfToken}}).then(function(){location.href='/'})} }
  else el.innerHTML='<a class="btn small" href="/login?next=capa" id="acct-in">Entrar</a>';
}
export 
function keepAlive(me){
  if(!me)return; var last=0;
  ['keydown','pointerdown'].forEach(function(t){document.addEventListener(t,function(){last=Date.now()},{passive:true})});
  setInterval(function(){if(Date.now()-last<5*60*1000)fetch('/api/auth/session',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(j){if(!j.data)location.href='/login?next=capa'}).catch(function(){})},5*60*1000);
}

export function init(){

(async function boot(){
  var c=window.claude;
  var db=null,user=null,me=null;
  try{ var r0=await fetch('/api/auth/session',{credentials:'same-origin'}); if(r0.ok){ me=(await r0.json()).data; db=makeRemoteDB(me&&me.csrfToken,!!(me&&me.canEdit)); state.uid=me?me.id:null; state.canEdit=!!(me&&me.canEdit); state.canWrite=me?true:null; state.remote=true; accountRender(me); keepAlive(me); } }catch(e){}
  if(!db)try{ if(c&&c.use){ var r=await Promise.all([c.use('db'),c.use('user')]); db=r[0]; user=r[1]; } }catch(e){}
  if(user){
    try{ state.uid=await user.id(); state.canEdit=await user.canEdit(); state.canWrite=await user.can('data.write'); }catch(e){}
  }
  if(!db&&!c){ db=makeLocalDB(); state.uid='local'; state.canEdit=true; state.canWrite=true; state.localMode=true; var ln=$('#localNote'); if(ln)ln.hidden=false; }
  if(!db||(!state.uid&&!state.remote)){ state.dbOff=true; state.ready.stories=state.ready.likes=true; if(!db)state.db=null; render(); if(!db)return; }
  state.db=db; state.dbOff=false;
  function fail(){state.ready.stories=state.ready.likes=true; schedule()}
  db.collection('works').onSnapshot(function(s){
    state.works=s.docs.map(function(d){var x=d.data()||{};return {id:d.id,title:clip(x.title,160),genre:clip(x.genre,40),text:clip(x.text,30000),at:cnum(x.at,0,9e15),earlyUntil:cnum(x.earlyUntil,0,9e15),behind:clip(x.behind,BEHIND_THE_SCENES_MAX_LENGTH)}}).filter(function(w){return SAFE_ID.test(w.id)&&w.title&&w.genre&&w.text});
    schedule();
  },function(){});
  db.collection('profiles').onSnapshot(function(snapshot){
    var cleaned=Object.create(null);
    snapshot.docs.slice(0,500).forEach(function(documentSnapshot){
      var data=documentSnapshot.data()||{};
      if(SAFE_ID.test(documentSnapshot.id))cleaned[documentSnapshot.id]={name:clip(data.name,PROFILE_NAME_MAX_LENGTH).trim(),bio:clip(data.bio,PROFILE_BIO_MAX_LENGTH),photo:cleanProfilePhoto(data.photo)};
    });
    state.profileDocs=cleaned; schedule();
  },function(){});
  db.collection('follows').onSnapshot(function(snapshot){
    var cleaned=Object.create(null);
    snapshot.docs.slice(0,500).forEach(function(documentSnapshot){
      if(SAFE_ID.test(documentSnapshot.id))cleaned[documentSnapshot.id]={ids:cleanIds((documentSnapshot.data()||{}).ids).slice(0,FOLLOWING_LIMIT)};
    });
    state.followDocs=cleaned; schedule();
  },function(){});
  db.collection('subscriptions').onSnapshot(function(snapshot){
    var cleaned=Object.create(null);
    snapshot.docs.slice(0,500).forEach(function(documentSnapshot){
      var data=documentSnapshot.data()||{};
      if(!SAFE_ID.test(documentSnapshot.id)||!SUBSCRIPTION_PLAN_LABELS[data.plan]||data.plan==='banca')return;
      cleaned[documentSnapshot.id]={plan:data.plan,number:cnum(data.number,0,9e6),since:cnum(data.since,0,9e15),honorName:clip(data.honorName,40)};
    });
    state.subscriptionDocs=cleaned; schedule();
  },function(){});
  db.doc('meta/subscription').onSnapshot(function(snapshot){
    var data=(snapshot.exists&&snapshot.data())||{};
    state.paymentSettings={payUrl:safePaymentUrl(data.payUrl),instructions:clip(data.instructions,300)}; schedule();
  },function(){});
  db.doc('meta/carta').onSnapshot(function(snapshot){
    var data=(snapshot.exists&&snapshot.data())||{};
    state.monthlyLetter={text:clip(data.text,MONTHLY_LETTER_MAX_LENGTH),at:cnum(data.at,0,9e15)}; schedule();
  },function(){});
  if(state.canEdit){
    db.collection('waitlist').onSnapshot(function(snapshot){
      var cleaned=Object.create(null);
      snapshot.docs.slice(0,500).forEach(function(documentSnapshot){
        var data=documentSnapshot.data()||{};
        if(SAFE_ID.test(documentSnapshot.id)&&SUBSCRIPTION_PLAN_LABELS[data.plan]&&data.plan!=='banca')cleaned[documentSnapshot.id]={plan:data.plan,at:cnum(data.at,0,9e15)};
      });
      state.waitlistDocs=cleaned; schedule();
    },function(){});
    db.collection('requests').onSnapshot(function(snapshot){
      var cleaned=Object.create(null);
      snapshot.docs.slice(0,500).forEach(function(documentSnapshot){
        var data=documentSnapshot.data()||{};
        if(SAFE_ID.test(documentSnapshot.id))cleaned[documentSnapshot.id]={personagem:cleanChiefRequest(data.personagem),tema:cleanChiefRequest(data.tema)};
      });
      state.requestDocs=cleaned; schedule();
    },function(){});
  }
  db.collection('stories').onSnapshot(function(s){
    var o=Object.create(null); s.docs.slice(0,300).forEach(function(d){if(!SAFE_ID.test(d.id))return; var dd=d.data()||{}; o[d.id]={items:cleanItems(dd.items),consent:dd.consent}});
    state.storyDocs=o; state.ready.stories=true; schedule();
  },fail);
  if(state.uid&&!state.localMode)db.doc('notices/'+state.uid).onSnapshot(function(s){
    var items=(s.exists&&s.data()&&s.data().items)||[], box=$('#noticeBox'); if(!box)return;
    box.innerHTML=items.length?'<section class="panel"><h3 class="h-mid">Aviso do chefe</h3>'+items.map(function(x){return '<p>Sua história “'+esc(x.title)+'” foi removida. Motivo: '+esc(x.reason)+'</p>'}).join('')+'<button class="btn small" id="noticeOk">Entendi</button></section>':'';
    var ok=$('#noticeOk'); if(ok)ok.onclick=function(){db.doc('notices/'+state.uid).delete().catch(function(){})};
  },function(){});
  db.collection('likes').onSnapshot(function(s){
    var o=Object.create(null); s.docs.slice(0,300).forEach(function(d){if(!SAFE_ID.test(d.id))return; o[d.id]={ids:cleanIds((d.data()||{}).ids)}});
    state.likeDocs=o; state.ready.likes=true; schedule();
  },fail);
  db.doc('meta/settings').onSnapshot(function(s){
    state.hideSamples=!!(s.exists&&s.data()&&s.data().hideSamples); schedule();
  },function(){});
  db.collection('ratings').onSnapshot(function(s){
    var o=Object.create(null); s.docs.slice(0,300).forEach(function(d){if(SAFE_ID.test(d.id))o[d.id]={r:cleanRatings((d.data()||{}).r)}});
    state.ratingDocs=o; schedule();
  },function(){});
  db.collection('comments').onSnapshot(function(s){
    var o=Object.create(null); s.docs.slice(0,300).forEach(function(d){if(SAFE_ID.test(d.id))o[d.id]={items:cleanComments((d.data()||{}).items)}});
    state.commentDocs=o; schedule();
  },function(){});
  db.collection('reviews').onSnapshot(function(s){
    var o=Object.create(null); s.docs.forEach(function(d){var id=d.id||''; if(id.indexOf('u_')===0&&(d.data()||{}).v==='bloqueado')o[id.slice(2)]=1});
    state.bans=o; schedule();
  },function(){});
  if(state.canEdit){
    db.collection('reports').onSnapshot(function(s){
      var o=Object.create(null); s.docs.forEach(function(d){var k=(d.data()||{}).key; if(typeof k==='string'&&k.length<=140)o[k]=(o[k]||0)+1});
      state.reports=o; schedule();
    },function(){});
  }
  schedule();
  try{ if(sessionStorage.getItem('gazeta-resume')==='story'&&state.uid){ sessionStorage.removeItem('gazeta-resume'); state.layer='capa'; render(); setTimeout(function(){$('#btnNewStory').click()},400) } }catch(e){}
})();
}
