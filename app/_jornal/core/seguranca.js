/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, __set_noteTimer, noteTimer } from './base.js';
import { goLogin } from '../engine.js';

export let SAFE_ID, LINK_RE, INJ_RE;

export 
function clip(v,n){return typeof v==='string'?v.slice(0,n):''}
export 
function cnum(v,a,b){v=+v; return isFinite(v)?Math.max(a,Math.min(b,v)):a}
export 
function cleanItems(arr){
  if(!Array.isArray(arr))return [];
  var out=[], seen=Object.create(null);
  arr.slice(0,20).forEach(function(x){
    if(!x||typeof x!=='object'||typeof x.id!=='string'||!SAFE_ID.test(x.id)||seen[x.id])return; seen[x.id]=1;
    var title=clip(x.title,120).trim(), text=clip(x.text,6000), pen=clip(x.pen,40).trim();
    if(!title||!text||!pen)return;
    var c=null, k=x.check;
    if(k&&typeof k==='object')c={v:k.v===1?1:0,at:cnum(k.at,0,9e15),ia:clip(k.ia,20),motivo:clip(k.motivo,240),obra:clip(k.obra,120),similaridade:cnum(k.similaridade,0,100),trecho:cnum(k.trecho,0,99999),revisadoPorEditor:k.revisadoPorEditor===true,reverificadaPorEditor:k.reverificadaPorEditor===true};
    out.push({id:x.id,title:title,text:text,pen:pen,bio:clip(x.bio,160).trim(),genre:clip(x.genre,40)||'Contos',at:cnum(x.at,0,9e15),status:x.status==='analise'?'analise':'aprovada',check:c||undefined});
  });
  return out;
}
export 
function cleanIds(a){return Array.isArray(a)?a.filter(function(v){return typeof v==='string'&&v.length<=120}).slice(0,500):[]}
export 
function markBad(sel){var e=$(sel); if(!e)return; e.setAttribute('aria-invalid','true'); try{e.focus()}catch(x){} var f=function(){e.removeAttribute('aria-invalid'); e.removeEventListener('input',f); e.removeEventListener('change',f)}; e.addEventListener('input',f); e.addEventListener('change',f)}
export 
function note(msg,kind){
  var el=$('#note'); el.textContent=msg; el.className=kind||''; el.setAttribute('role',kind==='err'?'alert':'status'); el.hidden=false;
  clearTimeout(noteTimer); __set_noteTimer(setTimeout(function(){el.hidden=true},6000));
}
export 
function errText(e){
  var c=e&&e.code;
  if(c==='NAO_AUTENTICADO'){goLogin();return 'Sua sessão terminou. Entre de novo para continuar.'}
  if(c==='LIMITE_EXCEDIDO')return 'Muitas ações seguidas. Aguarde um instante.';
  if(c==='VALIDACAO')return e.message||'Confira os dados e tente de novo.';
  if(c==='quota_exceeded')return 'A gráfica está sem espaço para novos textos.';
  if(c==='invalid_argument')return 'Seu acesso não permite essa ação. Peça permissão de colaborador ao dono da página.';
  if(c==='resource_exhausted')return 'Muitas ações seguidas. Aguarde um instante.';
  return 'Não foi possível concluir agora. Tente de novo em instantes.';
}

export function init(){

/* ---------- segurança: tudo que vem do banco é tratado como não confiável ---------- */
SAFE_ID=/^[A-Za-z0-9_-]{1,64}$/;

LINK_RE=/https?:\/\/|www\.|\S+@\S+\.\S+|\b[a-z0-9-]{2,}\.(com|net|org|xyz|top|ly|me|io)(\.br)?\b/i;

INJ_RE=/ignore\s+(all|any|previous|as\s+instru|todas)|desconsidere\s+(as|todas|tudo)|system\s*prompt|prompt\s+do\s+sistema|responda\s+(apenas|somente)|aprove\s+(esta|essa)|veredito/i;
}
