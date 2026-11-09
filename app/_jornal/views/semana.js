/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { DEMO, esc, isPoem, plural, state } from '../core/base.js';
import { allWorks, rankedStories } from '../core/dados.js';
import { ord } from './capa.js';
import { DEMO_CM, DEMO_EXTRA } from './edicao.js';
import { ART_TOP, IN_ONCE, IN_SC } from './introducao.js';

export let WK_EPOCH, MES, ART_SC, ART_CAP, ART_ST, artN;
export function __set_artN(v){ artN=v; return v; }

export 
function weekStartOf(ts){var d=new Date(ts),k=(d.getDay()+6)%7; return new Date(d.getFullYear(),d.getMonth(),d.getDate()-k)}
export 
function weekNoOf(ts){return Math.round((weekStartOf(ts)-WK_EPOCH)/(7*864e5))+1}
export 
function weekNow(){return weekNoOf(Date.now())}
export 
function weekRange(n){var a=new Date(WK_EPOCH.getFullYear(),WK_EPOCH.getMonth(),WK_EPOCH.getDate()+(n-1)*7); return [a,new Date(a.getFullYear(),a.getMonth(),a.getDate()+6)]}
export 
function dShort(d){return d.getDate()+' de '+MES[d.getMonth()]}
export 
function weekLabel(n){var r=weekRange(n); return dShort(r[0])+' a '+dShort(r[1])}
export 
function closeLabel(){
  var r=weekRange(weekNow()), end=new Date(r[1].getFullYear(),r[1].getMonth(),r[1].getDate()+1), ms=Math.max(0,end-Date.now());
  var d=Math.floor(ms/864e5), h=Math.floor(ms%864e5/36e5), m=Math.floor(ms%36e5/6e4);
  return d>0?d+' '+plural(d,'dia','dias')+' e '+h+' h':(h>0?h+' h e '+m+' min':m+' min');
}
export 
function likeCounts(){var c={}; Object.keys(state.likeDocs).forEach(function(k){((state.likeDocs[k]||{}).ids||[]).forEach(function(id){c[id]=(c[id]||0)+1})}); return c}
export 
function demoStories(){return DEMO.map(function(d,i){return {kind:'story',key:'demo:'+i,uid:'demo',demo:true,pen:d.pen,title:d.title,genre:d.genre,text:d.text,at:d.at,likes:d.likes,wk:0,bio:(DEMO_EXTRA[d.pen]||{}).bio,rat:(DEMO_EXTRA[d.pen]||{}).rat,cms:DEMO_CM[i]||[]}})}
export 
function hashStr(t){var h=7,i; t=String(t||''); for(i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0; return h}
export 
function artSvg(genre,title,tall){
  var sc=ART_SC[genre]||'vila', st=ART_ST[sc], id='a'+(++artN), H=tall==='world'?480:(tall?330:190);
  var fit=Math.min(1,H/(200-(ART_TOP[sc]||-60)+12)), tileWidth=880*fit, left=(880-tileWidth)/2, baseY=H-200*fit, ground='', k;
  for(k=-3;k<=3;k++)ground+='<g transform="translate('+(left+k*tileWidth).toFixed(1)+','+baseY.toFixed(1)+') scale('+fit.toFixed(3)+')">'+IN_SC[sc]+'</g>';
  return '<svg class="art" viewBox="0 0 880 '+H+'" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Ilustração: '+esc(ART_CAP[sc])+'"><defs><linearGradient id="g'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+st[0]+'"/><stop offset="1" stop-color="'+st[1]+'"/></linearGradient><pattern id="h'+id+'" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="3.5" cy="3.5" r="1.7" fill="#000"/></pattern></defs>'+
    '<rect width="880" height="'+H+'" fill="url(#g'+id+')"/><g style="color:'+st[2]+'" fill="currentColor">'+ground+'<g transform="translate('+left.toFixed(1)+','+baseY.toFixed(1)+') scale('+fit.toFixed(3)+')">'+IN_ONCE[sc]+'</g></g><rect width="880" height="'+H+'" fill="url(#h'+id+')" opacity=".2"/></svg>';
}
export 
function artFigure(it,tall){var sc=ART_SC[it.genre]||'vila'; return '<figure class="cover-fig">'+artSvg(it.genre,it.title,tall)+'<figcaption>Ilustração da edição · '+esc(ART_CAP[sc])+'</figcaption></figure>'}
export 
function deckOf(it){
  var t=String(it.text||'').trim();
  if(isPoem(it))return esc(t.split('\n').filter(function(l){return l.trim()}).slice(0,2).join(' / '));
  t=t.replace(/\s+/g,' '); var m=t.match(/^.{40,}?[.!?](?=\s|$)/); return esc((m?m[0]:t.slice(0,150)).slice(0,190));
}
export 

/* edição: textos mais votados da semana anterior; na primeira semana (ou semana sem envios) usa exemplos */
function authorPick(){var w=allWorks().filter(function(work){return !work.locked}); return w.length?w.slice().sort(function(a,b){return (b.at||0)-(a.at||0)})[0]:null}
export 
function editionData(){
  var EW=weekNow()-1, all=rankedStories().filter(function(s){return !s.demo}), list=[], mode;
  if(EW>=1){list=all.filter(function(s){return s.wk===EW}); mode=list.length?'real':'vazia'} else mode='inaugural';
  if(mode!=='real')list=demoStories();
  list.sort(function(a,b){return b.likes-a.likes||a.at-b.at});
  var pick=authorPick(), cols=list.slice(3,7);
  if(cols.length<4)cols=cols.concat(allWorks().filter(function(w){return !w.locked&&(!pick||w.key!==pick.key)}).slice(0,4-cols.length));
  return {week:EW,mode:mode,list:list,pick:pick,cols:cols};
}
export 
function emptyPage(p){return '<div class="empty"><p class="big">Página em branco</p><p>Ainda não há texto para a '+ord(p)+' desta edição.</p></div>'}

export function init(){


/* ---------- semana: envios, votação e edição da Capa ---------- */
WK_EPOCH=new Date(2026,9,19);
MES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];


/* ilustração da manchete: arte do próprio jornal (cenário do gênero, céu em degradê, retícula de meio-tom e variação pelo título) */
ART_SC={'Contos':'vila','Poemas':'lago','Aventuras':'ilha','Fantasia':'castelo','Crônicas':'cidade','Ficção Científica':'colonia','Terror e Suspense':'casarao'};

ART_CAP={porto:'o porto da redação',vila:'a vila do era uma vez',lago:'o lago sob a lua',ilha:'a ilha do tesouro',castelo:'o castelo flutuante',cidade:'a cidade ao amanhecer',colonia:'a colônia espacial',casarao:'o casarão no morro',farol:'o farol do porto'};

ART_ST={porto:['#f4f3ee','#d9d8d1','#111'],vila:['#f4f3ee','#dcdbd4','#111'],lago:['#a9a9a4','#6f6f6b','#111'],ilha:['#d8d8d3','#a9a9a4','#111'],castelo:['#a6a6a1','#6f6f6b','#111'],cidade:['#7a7a77','#3d3d3b','#0a0a0a'],colonia:['#3a3a3a','#141414','#f2f2ee'],casarao:['#4a4a47','#1f1f1e','#050505'],farol:['#9c9c97','#5c5c58','#111']};

artN=0;

}
