/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, fmtDate, plural, state } from '../core/base.js';
import { LINK_RE, SAFE_ID, clip, errText, markBad, note } from '../core/seguranca.js';
import { allWorks, findItem, rankedStories } from '../core/dados.js';
import { articleHtml, excerptOf, openBtn } from './html.js';
import { render, toTop } from './render.js';
import { SUBSCRIPTION_PLAN_LABELS } from './assinatura.js';
import { currentReaderPlan, formatMonthAndYear, profileAvatarHtml, profilePhotoOf, profilePhotoRowHtml, readerCodeOf, removeProfilePhotoAsEditor } from './foto.js';
import { lsGet, readMin } from './extras.js';
import { chipOf, pendingStories } from '../engine.js';
import { ratingStats } from './edicao.js';

export let RAUL_PROFILE_ID, PROFILE_BIO_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH, FOLLOWING_LIMIT, RAUL_DEFAULT_BIO;

export 

function profileHasData(profileId){
  return profileId===RAUL_PROFILE_ID||!!state.profileDocs[profileId]||!!(state.storyDocs[profileId]&&state.storyDocs[profileId].items.length)||profileId===state.uid;
}
export 
function latestStoryOf(profileId){
  var items=((state.storyDocs[profileId]||{}).items||[]).slice().sort(function(first,second){return (second.at||0)-(first.at||0)});
  return items[0]||null;
}
export 
function profileNameOf(profileId){
  if(profileId===RAUL_PROFILE_ID)return (state.profileDocs[profileId]&&state.profileDocs[profileId].name)||'Raul Xavier';
  var profile=state.profileDocs[profileId], latest=latestStoryOf(profileId);
  return (profile&&profile.name)||(latest&&latest.pen)||('Leitor '+readerCodeOf(profileId));
}
export 
function profileBioOf(profileId){
  var profile=state.profileDocs[profileId], latest=latestStoryOf(profileId);
  if(profileId===RAUL_PROFILE_ID)return (profile&&profile.bio)||RAUL_DEFAULT_BIO;
  return (profile&&profile.bio)||(latest&&latest.bio)||'';
}
export 
function profileStoriesOf(profileId){
  if(profileId===RAUL_PROFILE_ID)return allWorks();
  var published=rankedStories().filter(function(story){return story.uid===profileId&&!story.demo});
  var pending=(profileId===state.uid||state.canEdit)?pendingStories().filter(function(story){return story.uid===profileId}):[];
  return published.map(function(story){story.pending=false; return story}).concat(pending.map(function(story){story.pending=true; return story}));
}
export 
function followersOf(profileId){return Object.keys(state.followDocs).filter(function(readerId){return state.followDocs[readerId].ids.indexOf(profileId)>=0})}
export 
function followingOf(profileId){return (state.followDocs[profileId]||{ids:[]}).ids}
export 
function isFollowing(profileId){return !!state.uid&&followingOf(state.uid).indexOf(profileId)>=0}
export 
function profileIdOfItem(item){return item.kind==='work'?RAUL_PROFILE_ID:item.uid}
export 
function authorLinkHtml(item){
  var profileId=profileIdOfItem(item), label=item.kind==='work'?'Raul Xavier':(item.pen||'Anônimo');
  if(!profileId||item.demo)return '<b>'+esc(label)+'</b>';
  return '<button class="author-link" data-act="profile" data-profile="'+esc(profileId)+'" title="Ver o perfil de '+esc(label)+'"><b>'+esc(label)+'</b></button>';
}
export 
function openProfile(profileId){
  if(!profileId||!SAFE_ID.test(profileId))return;
  if(state.layer!=='perfil')state.profileFrom=state.layer;
  state.profileViewId=profileId; state.layer='perfil'; state.reading=null;
  state.profileTab='historias'; state.profileGenre=''; state.profileList=''; state.profileEditing=false;
  render(); toTop();
}
export 

/* pedaços de HTML do perfil */
function profileActionsHtml(profileId){
  if(profileId===state.uid)return '<button class="btn small" data-act="editprofile">Editar perfil</button>';
  if(!state.uid||!state.db)return '<button class="btn small" disabled title="Entre na sua conta para seguir.">Seguir</button>';
  var following=isFollowing(profileId);
  return '<button class="btn small'+(following?'':' primary')+'" data-act="follow" data-profile="'+esc(profileId)+'" aria-pressed="'+following+'">'+(following?'Seguindo':'Seguir')+'</button>';
}
export 
function profileHeaderHtml(profileId){
  var name=profileNameOf(profileId), stories=profileStoriesOf(profileId), publicStories=stories.filter(function(story){return !story.pending});
  var likesReceived=publicStories.reduce(function(total,story){return total+(story.likes||0)},0);
  var ratings=publicStories.filter(function(story){return story.kind==='story'}).map(ratingStats).filter(function(stats){return stats.n});
  var ratingCount=ratings.reduce(function(total,stats){return total+stats.n},0), ratingAverage=ratingCount?ratings.reduce(function(total,stats){return total+stats.avg*stats.n},0)/ratingCount:0;
  var oldest=stories.reduce(function(lowest,story){return story.at&&(!lowest||story.at<lowest)?story.at:lowest},0);
  var bio=profileBioOf(profileId), followers=followersOf(profileId).length, following=followingOf(profileId).length;
  var moderation=(state.canEdit&&profileId!==RAUL_PROFILE_ID&&state.profileDocs[profileId])?'<button class="btn small danger" data-act="clearprofile" data-profile="'+esc(profileId)+'">'+(state.armed==='pf:'+profileId?'Confirmar limpeza':'Limpar perfil (editor)')+'</button>':'';
  var hasPhoto=!!profilePhotoOf(profileId);
  var photoModeration=(state.canEdit&&hasPhoto)?'<button class="btn small danger" data-act="clearphoto" data-profile="'+esc(profileId)+'">'+(state.armed==='ph:'+profileId?'Confirmar remoção':'Remover foto (editor)')+'</button>':'';
  return '<header class="pf-head"><div class="pf-avatar'+(hasPhoto?' has-photo':'')+'">'+profileAvatarHtml(profileId,name)+'</div><div class="pf-main">'+
    '<div class="pf-line"><h2 class="pf-name">'+esc(name)+'</h2>'+(profileId===RAUL_PROFILE_ID?'<span class="chip ok">Autor e editor</span>':'')+'</div>'+
    '<div class="pf-actions">'+profileActionsHtml(profileId)+moderation+photoModeration+'</div>'+
    '<ul class="pf-stats"><li><b>'+stories.length+'</b> '+plural(stories.length,'história','histórias')+'</li>'+
    '<li><button data-act="pflist" data-list="followers"><b>'+followers+'</b> '+plural(followers,'seguidor','seguidores')+'</button></li>'+
    '<li><button data-act="pflist" data-list="following"><b>'+following+'</b> seguindo</button></li></ul>'+
    (bio?'<p class="pf-bio">'+esc(bio)+'</p>':'<p class="pf-bio pf-empty">'+(profileId===state.uid?'Conte em poucas palavras quem você é. Use “Editar perfil”.':'Este perfil ainda não tem bio.')+'</p>')+
    '<p class="pf-meta">'+(oldest?'Escreve desde '+esc(formatMonthAndYear(oldest))+' · ':'')+'♥ '+likesReceived+' '+plural(likesReceived,'curtida recebida','curtidas recebidas')+(ratingCount?' · ★ '+ratingAverage.toFixed(1).replace('.',',')+' de média':'')+'</p></div></header>';
}
export 
function profileHighlightsHtml(profileId){
  var counts={}; profileStoriesOf(profileId).forEach(function(story){counts[story.genre]=(counts[story.genre]||0)+1});
  var genreNames=Object.keys(counts).sort(function(first,second){return counts[second]-counts[first]});
  if(!genreNames.length)return '';
  function circleHtml(label,genre,count){
    var selected=state.profileGenre===genre;
    return '<button class="pf-hl" data-act="pfgenre" data-genre="'+esc(genre)+'" aria-pressed="'+selected+'"><span class="pf-hl-circle">'+esc(label.charAt(0).toUpperCase())+'</span><span class="pf-hl-name">'+esc(label)+'</span><span class="pf-hl-count">'+count+'</span></button>';
  }
  return '<div class="pf-highlights" role="group" aria-label="Tipos de escrita">'+circleHtml('Todas','',profileStoriesOf(profileId).length)+genreNames.map(function(genre){return circleHtml(genre,genre,counts[genre])}).join('')+'</div>';
}
export 
function profileTabsHtml(profileId){
  var tabs=[['historias','Histórias']]; if(profileId===state.uid)tabs.push(['salvos','Salvos']); tabs.push(['sobre','Sobre']);
  return '<div class="pf-tabs" role="tablist" aria-label="Seções do perfil">'+tabs.map(function(tab){return '<button role="tab" data-act="pftab" data-tab="'+tab[0]+'" aria-selected="'+(state.profileTab===tab[0])+'">'+tab[1]+'</button>'}).join('')+'</div>';
}
export 
function profileStoryCardHtml(story){
  var rating=story.kind==='story'?ratingStats(story):null;
  var meta=story.kind==='work'?readMin(story)+' min de leitura':'♥ '+(story.likes||0)+(rating&&rating.n?' · ★ '+rating.avg.toFixed(1).replace('.',','):'')+' · '+fmtDate(story.at);
  return '<article class="pf-card"><p class="kicker">'+esc(story.genre)+'</p><h3 class="h-mid">'+openBtn(story,'hl',esc(story.title))+'</h3>'+
    '<p class="excerpt">'+excerptOf(story,130)+'</p><p class="pf-card-meta">'+(story.pending?chipOf(story):meta)+'</p></article>';
}
export 
function profileGridHtml(stories,emptyHtml){
  return stories.length?'<div class="pf-grid">'+stories.map(profileStoryCardHtml).join('')+'</div>':emptyHtml;
}
export 
function profilePeopleListHtml(profileId){
  var kind=state.profileList, ids=(kind==='followers'?followersOf(profileId):followingOf(profileId)).slice(0,100);
  var title=kind==='followers'?'Seguidores':'Seguindo';
  return '<section class="pf-people"><div class="pf-people-head"><h3>'+title+' ('+ids.length+')</h3><button class="btn small" data-act="pflist" data-list="">Fechar</button></div>'+
    (ids.length?ids.map(function(readerId){
      var name=profileNameOf(readerId), bio=profileBioOf(readerId);
      return '<div class="pf-person"><span class="pf-person-avatar">'+profileAvatarHtml(readerId,name)+'</span><span class="pf-person-text"><button class="author-link" data-act="profile" data-profile="'+esc(readerId)+'"><b>'+esc(name)+'</b></button>'+(bio?'<small>'+esc(clip(bio,80))+'</small>':'')+'</span>'+(readerId===state.uid?'':profileActionsHtml(readerId))+'</div>';
    }).join(''):'<p class="hint">Ninguém por aqui ainda.</p>')+'</section>';
}
export 
function profileAboutHtml(profileId){
  var latest=latestStoryOf(profileId), isOwn=profileId===state.uid, plan=currentReaderPlan();
  return '<section class="pf-about"><h3>Sobre</h3><p>'+(profileBioOf(profileId)?esc(profileBioOf(profileId)):'Sem bio por enquanto.')+'</p>'+
    (isOwn?'<p class="hint">Seu código de leitor: <b class="sub-code">'+readerCodeOf(state.uid)+'</b> · Plano '+SUBSCRIPTION_PLAN_LABELS[plan]+' · <button class="hl" data-act="layer" data-v="assinatura"><u>Ver a assinatura</u></button></p>':'')+
    (latest&&latest.pen&&!isOwn&&profileId!==RAUL_PROFILE_ID?'<p class="hint">Assina as histórias como “'+esc(latest.pen)+'”.</p>':'')+'</section>';
}
export 
function profileEditFormHtml(){
  var draft=state.profileTextDraft, savedProfile=state.profileDocs[state.uid];
  var name=draft?draft.name:(savedProfile?savedProfile.name:(profileNameOf(state.uid).indexOf('Leitor ')===0?'':profileNameOf(state.uid)));
  var bio=draft?draft.bio:profileBioOf(state.uid);
  var previewPhoto=state.profilePhotoDraft!==undefined?state.profilePhotoDraft:profilePhotoOf(state.uid);
  return '<section class="sub-block pf-edit"><h3>Editar perfil</h3>'+profilePhotoRowHtml(previewPhoto,name||profileNameOf(state.uid))+
    '<div class="sub-form"><label for="pf-name-input">Nome de autor<input id="pf-name-input" maxlength="'+PROFILE_NAME_MAX_LENGTH+'" autocomplete="off" value="'+esc(name)+'"></label>'+
    '<label for="pf-bio-input">Bio (até '+PROFILE_BIO_MAX_LENGTH+' caracteres)<textarea id="pf-bio-input" maxlength="'+PROFILE_BIO_MAX_LENGTH+'" rows="3">'+esc(bio)+'</textarea></label>'+
    '<p class="hint">O perfil é público: nome, bio e foto aparecem para todos. Links e e-mails não são permitidos.</p>'+
    '<div class="row"><button class="btn primary" data-act="saveprofile">Salvar perfil</button><button class="btn" data-act="cancelprofile">Cancelar</button></div></div></section>';
}
export 
function renderProfile(){
  var body=$('#pfBody'), focused=document.activeElement;
  if(focused&&body.contains(focused)&&/^(INPUT|TEXTAREA)$/.test(focused.tagName))return;
  var profileId=state.profileViewId||state.uid||RAUL_PROFILE_ID;
  $('#pfSub').textContent=profileId===state.uid?'Este é o seu perfil. Os leitores veem o mesmo que você.':'Perfil público.';
  $('#pfBack').hidden=!state.profileViewId||state.profileViewId===state.uid;
  if(state.reading){
    var openedItem=findItem(state.reading);
    if(openedItem){body.innerHTML=articleHtml(openedItem); return}
    state.reading=null;
  }
  if(!profileHasData(profileId)){body.innerHTML='<div class="empty"><p class="big">Perfil não encontrado</p><p>Este autor ainda não publicou nada.</p></div>'; return}
  var stories=profileStoriesOf(profileId), filtered=state.profileGenre?stories.filter(function(story){return story.genre===state.profileGenre}):stories, content;
  if(state.profileList)content=profilePeopleListHtml(profileId);
  else if(state.profileTab==='sobre')content=profileAboutHtml(profileId);
  else if(state.profileTab==='salvos'&&profileId===state.uid){
    var savedItems=lsGet('gazeta-shelf',[]).map(function(key){return findItem({kind:key.indexOf(':')>0?'story':'work',key:key})}).filter(Boolean);
    content=profileGridHtml(savedItems,'<div class="empty"><p class="big">Nada guardado</p><p>Use “Guardar” em qualquer leitura para ela aparecer aqui.</p></div>');
  }else content=profileGridHtml(filtered,'<div class="empty"><p class="big">Nenhuma história ainda</p><p>'+(profileId===state.uid?'Envie a sua primeira história para concorrer à capa da semana.':'Volte em breve.')+'</p>'+(profileId===state.uid?'<div class="row"><button class="btn primary" data-act="newstory">Escrever e enviar ao editor</button></div>':'')+'</div>');
  body.innerHTML=(state.profileEditing&&profileId===state.uid?profileEditFormHtml():'')+profileHeaderHtml(profileId)+(state.profileList?'':profileHighlightsHtml(profileId)+profileTabsHtml(profileId))+content;
}
export 

/* ações do perfil */
async function toggleFollow(profileId){
  if(!state.db||!state.uid||profileId===state.uid||!SAFE_ID.test(profileId))return;
  if(state.canWrite===false){note('Seu acesso é só de leitura.','err');return}
  var ids=followingOf(state.uid).slice(), position=ids.indexOf(profileId);
  if(position>=0)ids.splice(position,1);
  else{
    if(ids.length>=FOLLOWING_LIMIT){note('Você já segue '+FOLLOWING_LIMIT+' perfis. Deixe de seguir algum para seguir outro.','err');return}
    ids.push(profileId);
  }
  try{await state.db.doc('follows/'+state.uid).set({ids:ids}); note(position>=0?'Você deixou de seguir '+profileNameOf(profileId)+'.':'Você agora segue '+profileNameOf(profileId)+'.')}
  catch(error){note(errText(error),'err')}
}
export 
async function saveProfile(){
  if(!state.db||!state.uid)return;
  if(state.canWrite===false){note('Seu acesso é só de leitura.','err');return}
  var name=$('#pf-name-input').value.replace(/[\u0000-\u001F]/g,' ').trim().slice(0,PROFILE_NAME_MAX_LENGTH), bio=$('#pf-bio-input').value.replace(/[\u0000-\u001F]/g,' ').trim().slice(0,PROFILE_BIO_MAX_LENGTH);
  if(name.length<2){markBad('#pf-name-input'); note('O nome de autor precisa ter pelo menos 2 caracteres.','err');return}
  if(LINK_RE.test(name+' '+bio)){markBad(LINK_RE.test(name)?'#pf-name-input':'#pf-bio-input'); note('Links e e-mails não são permitidos no perfil.','err');return}
  try{
    var photo=state.profilePhotoDraft!==undefined?state.profilePhotoDraft:profilePhotoOf(state.uid);
    await state.db.doc('profiles/'+state.uid).set({name:name,bio:bio,photo:photo,at:Date.now()});
    try{localStorage.setItem('gazeta-pen',name)}catch(error){}
    state.profileEditing=false; state.profilePhotoDraft=undefined; state.profileTextDraft=null; note('Perfil salvo.');
  }catch(error){note(errText(error),'err')}
  render();
}
export 
async function clearProfile(profileId){
  if(!state.canEdit||!state.db||!SAFE_ID.test(profileId)||profileId===RAUL_PROFILE_ID)return;
  if(state.armed!=='pf:'+profileId){state.armed='pf:'+profileId; render(); return}
  state.armed=null;
  try{await state.db.doc('profiles/'+profileId).delete(); note('Perfil limpo. O nome e a bio voltam ao que está nas histórias.')}
  catch(error){note(errText(error),'err')}
}
export 
function handleProfileAction(action,button){
  switch(action){
    case 'layer': if(button.dataset.v==='perfil'){state.profileViewId=null; state.profileTab='historias'; state.profileGenre=''; state.profileList=''; state.profileEditing=false} return false;
    case 'profile': openProfile(button.dataset.profile); return true;
    case 'pfback': state.layer=state.profileFrom||'autor'; state.profileViewId=null; state.reading=null; render(); toTop(); return true;
    case 'follow': toggleFollow(button.dataset.profile); return true;
    case 'editprofile': state.profileEditing=true; state.profilePhotoDraft=undefined; state.profileTextDraft=null; state.profileList=''; render(); if($('#pf-name-input'))$('#pf-name-input').focus(); return true;
    case 'cancelprofile': state.profileEditing=false; state.profilePhotoDraft=undefined; state.profileTextDraft=null; render(); return true;
    case 'removephoto': state.profilePhotoDraft=''; var nameField=$('#pf-name-input'), bioField=$('#pf-bio-input'); if(nameField&&bioField)state.profileTextDraft={name:nameField.value,bio:bioField.value}; render(); return true;
    case 'clearphoto': removeProfilePhotoAsEditor(button.dataset.profile); return true;
    case 'saveprofile': saveProfile(); return true;
    case 'pftab': state.profileTab=button.dataset.tab; state.profileList=''; render(); return true;
    case 'pfgenre': state.profileGenre=button.dataset.genre||''; state.profileTab='historias'; state.profileList=''; render(); return true;
    case 'pflist': state.profileList=button.dataset.list||''; render(); return true;
    case 'clearprofile': clearProfile(button.dataset.profile); return true;
  }
  return false;
}

export function init(){


/* ---------- Perfil dos autores ---------- */
RAUL_PROFILE_ID='raul';

PROFILE_BIO_MAX_LENGTH=200;

PROFILE_NAME_MAX_LENGTH=40;

FOLLOWING_LIMIT=150;

RAUL_DEFAULT_BIO='Autor e editor do jornal O Contista. Escreve contos, poemas, aventuras e fantasia.';

state.profileDocs=Object.create(null);
 state.followDocs=Object.create(null);

state.profileViewId=null;
 state.profileFrom='autor';
 state.profileTab='historias';
 state.profileGenre='';
 state.profileList='';
 state.profileEditing=false;
}
