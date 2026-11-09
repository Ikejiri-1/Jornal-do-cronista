/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { esc, fmtDate, isPoem, plural, state } from '../core/base.js';
import { myLikes } from '../core/dados.js';
import { authorLinkHtml } from './perfil.js';
import { behindTheScenesHtml, earlyAccessChipHtml, earlyAccessDaysLeft, lockedArticleHtml } from './foto.js';
import { fsScale, readHas, readMin, readerTools } from './extras.js';
import { artFigure, weekNow } from './semana.js';

export 

/* ---------- pedaços de HTML ---------- */
function excerptOf(it,n){
  if(it.locked)return 'Em primeira mão para assinantes. Abre para todos em '+earlyAccessDaysLeft(it.earlyUntil)+' '+plural(earlyAccessDaysLeft(it.earlyUntil),'dia','dias')+'.';
  if(isPoem(it)){
    var lines=it.text.split('\n').filter(function(l){return l.trim()}).slice(0,4);
    return lines.map(esc).join('<br>')+(it.text.split('\n').filter(function(l){return l.trim()}).length>4?'<br>…':'');
  }
  var t=it.text.replace(/\s+/g,' ').trim();
  if(t.length<=n)return esc(t);
  var cut=t.slice(0,n); cut=cut.slice(0,Math.max(cut.lastIndexOf(' '),n-30));
  return esc(cut.replace(/[\s,;:—-]+$/,''))+'…';
}
export 
function openBtn(it,cls,label){
  return '<button class="'+cls+'" data-act="open" data-kind="'+it.kind+'" data-key="'+esc(it.key)+'">'+label+'</button>';
}
export 
function workTools(w){
  if(!state.canEdit||!state.db||w.sample)return '';
  var armed=state.armed==='w:'+w.key;
  return earlyAccessChipHtml(w)+'<button class="btn small" data-act="editwork" data-key="'+esc(w.key)+'">Editar</button>'+
         '<button class="btn small danger" data-act="delwork" data-key="'+esc(w.key)+'">'+(armed?'Confirmar exclusão':'Excluir')+'</button>';
}
export 
function likeBtn(s){
  var liked=myLikes().indexOf(s.key)>=0;
  var why='';
  if(s.demo)why='Exemplo: as curtidas são fixas.';
  else if(s.wk&&s.wk<weekNow())why='A votação desta história já foi encerrada.';
  else if(s.status==='analise')why='Esta história ainda está em análise.';
  else if(state.dbOff||!state.uid)why='Entre na sua conta para curtir.';
  else if(state.canWrite===false)why='Seu acesso é só de leitura.';
  else if(s.uid===state.uid)why='Você não pode curtir a própria história.';
  return '<button class="like'+(liked?' on':'')+'" data-act="like" data-key="'+esc(s.key)+'"'+(why?' disabled title="'+esc(why)+'"':'')+' aria-pressed="'+liked+'">☞ '+(liked?'Curtida':'Curtir')+' · <b>'+s.likes+'</b></button>';
}
export 
function storyTools(s){
  if(s.demo||!state.db)return '';
  var rp=state.reported[s.key];
  var rep=(s.uid!==state.uid&&state.uid&&state.canWrite!==false)?'<button class="btn small" data-act="report" data-key="'+esc(s.key)+'"'+(rp?' disabled':'')+'>'+(rp?'Denunciada':'Denunciar')+'</button>':'';
  var rc=(state.canEdit&&state.reports[s.key])?'<span class="hint">⚑ '+state.reports[s.key]+' '+plural(state.reports[s.key],'denúncia','denúncias')+'</span>':'';
  if(!state.canEdit)return rep;
  var ed=(state.canEdit&&s.uid&&s.uid!==state.uid)?'<button class="btn small" data-act="reverify" data-key="'+esc(s.key)+'">Reverificar</button><button class="btn small danger" data-act="banuser" data-uid="'+esc(s.uid)+'">'+(state.bans[s.uid]?'Desbloquear autor':(state.armed==='ban:'+s.uid?'Confirmar bloqueio':'Bloquear autor'))+'</button>':'';
  var armed=state.armed==='s:'+s.key;
  return rep+rc+ed+'<button class="btn small danger" data-act="delstory" data-key="'+esc(s.key)+'">'+(armed?'Confirmar remoção':(s.uid===state.uid?'Retirar minha história':'Remover da Capa'))+'</button>';
}
export 
function bylineOf(it){
  if(it.kind==='work')return 'por '+authorLinkHtml(it)+' · '+fmtDate(it.at)+' · '+readMin(it)+' min'+(readHas(it.key)?' · ✓ lida':'')+(it.sample?'<span class="tag">exemplo</span>':'');
  return 'por '+authorLinkHtml(it)+' · '+fmtDate(it.at)+' · '+readMin(it)+' min'+(readHas(it.key)?' · ✓ lida':'')+(it.demo?'<span class="tag">exemplo</span>':(it.status==='analise'?'<span class="tag">em análise</span>':(it.check?'<span class="tag">✓ vistoriada</span>':'')));
}
export 

function pullQuote(it){
  if(isPoem(it))return '';
  var ps=it.text.split(/\n\s*\n/).map(function(p){return p.replace(/\s+/g,' ').trim()}).filter(Boolean);
  if(ps.length<3)return '';
  var p=ps[1].replace(/^[—–-]\s*/,'');
  var m=p.match(/^.{20,}?[.!?](?=\s|$)/);
  var q=m?m[0]:p;
  if(q.length>150){q=q.slice(0,150);q=q.slice(0,q.lastIndexOf(' '))+'…'}
  return '<blockquote class="pull">“'+esc(q)+'”</blockquote>';
}
export 
function articleHtml(it){
  var body;
  if(isPoem(it)){
    body='<div class="poem">'+esc(it.text)+'</div>';
  }else{
    body='<div class="art-body">'+it.text.split(/\n\s*\n/).map(function(p){return '<p>'+esc(p.replace(/\n/g,' ').trim())+'</p>'}).join('')+'</div>';
  }
  var back=state.layer==='leituras'?'← Voltar às leituras':(state.layer==='autor'?'← Voltar à edição':(state.layer==='envios'?'← Voltar aos enviados':(state.layer==='perfil'?'← Voltar ao perfil':'← Voltar à Capa')));
  if(it.locked)return lockedArticleHtml(it,back);
  var foot='';
  if(it.kind==='story'){
    foot='<div class="foot">'+likeBtn(it)+'<span class="count">'+(it.rank?it.rank+'º lugar no ranking':'')+'</span>'+storyTools(it)+'</div>';
  }else{
    var t=workTools(it);
    if(t)foot='<div class="foot">'+t+'</div>';
  }
  return '<article class="article" style="--fs:'+fsScale()+'">'+
    '<button class="btn small back" data-act="back">'+back+'</button>'+
    '<p class="kicker">'+esc(it.genre)+'</p>'+
    '<h2 class="h-art">'+esc(it.title)+'</h2>'+
    '<p class="byline">'+bylineOf(it)+'</p>'+
    (it.edArt?artFigure(it,false):'')+'<hr class="ornament">'+readerTools(it)+pullQuote(it)+body+'<p class="endmark">— Fim —</p>'+behindTheScenesHtml(it)+foot+'</article>';
}
