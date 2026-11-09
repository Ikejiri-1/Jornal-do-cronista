/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, fmtDate, plural, state } from '../core/base.js';
import { LINK_RE, SAFE_ID, clip, errText, markBad, note } from '../core/seguranca.js';
import { allWorks, findItem, rankedStories } from '../core/dados.js';
import { articleHtml, excerptOf, openBtn } from './html.js';
import { render, toTop } from './render.js';
import { SUBSCRIPTION_PLAN_LABELS } from './assinatura.js';
import { currentReaderPlan, formatMonthAndYear, profilePhotoOf, readerCodeOf, removeProfilePhotoAsEditor } from './foto.js';
import { lsGet, readMin } from './extras.js';
import { pendingStories } from '../engine.js';
import { ratingStats } from './edicao.js';
import { mountPerfil, unmountPerfil } from './PerfilView';

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
/* as peças do perfil agora são React: views/PerfilView.tsx */
export 
function renderProfile(){
  var body=$('#pfBody'), focused=document.activeElement;
  if(focused&&body.contains(focused)&&/^(INPUT|TEXTAREA)$/.test(focused.tagName))return;
  var profileId=state.profileViewId||state.uid||RAUL_PROFILE_ID;
  $('#pfSub').textContent=profileId===state.uid?'Este é o seu perfil. Os leitores veem o mesmo que você.':'Perfil público.';
  $('#pfBack').hidden=!state.profileViewId||state.profileViewId===state.uid;
  if(state.reading){
    var openedItem=findItem(state.reading);
    if(openedItem){unmountPerfil(body); body.innerHTML=articleHtml(openedItem); return}
    state.reading=null;
  }
  mountPerfil(body,profileId);
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
