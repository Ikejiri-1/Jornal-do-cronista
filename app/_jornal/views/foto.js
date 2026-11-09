/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, fmtDate, newId, plural, state } from '../core/base.js';
import { LINK_RE, SAFE_ID, clip, cnum, errText, markBad, note } from '../core/seguranca.js';
import { findItem, myLikes } from '../core/dados.js';
import { bylineOf } from './html.js';
import { __set_render, render, schedule, toTop } from './render.js';
import { delWork, openWorkForm, saveWork } from './acoes.js';
import { CHIEF_REQUEST_MAX_LENGTH, EARLY_ACCESS_DAYS, MONTHLY_LETTER_MAX_LENGTH, SUBSCRIPTION_PLAN_DETAILS, SUBSCRIPTION_PLAN_LABELS, SUBSCRIPTION_PLAN_ORDER, WEEKLY_SUBMISSION_LIMIT_BY_PLAN } from './assinatura.js';
import { handleProfileAction } from './perfil.js';
import { changeFs, lsGet, lsSet, markRead, surprise, toggleShelf, updateProg } from './extras.js';
import { approveStory, auditAll, banUser, chessReset, dlgClose, dlgOpen, goLogin, openTypewriter, reverify, vistoria } from '../engine.js';
import { newsExtras } from './imersivo.js';
import { mountAssinatura } from './AssinaturaView';
import { dShort, hashStr, weekNoOf, weekNow, weekRange } from './semana.js';
import { addComment, avatarSvg, cmRestore, delComment, rateItem } from './edicao.js';

export let PROFILE_PHOTO_SIZE, PROFILE_PHOTO_MAX_CHARACTERS, PROFILE_PHOTO_MAX_FILE_BYTES, PROFILE_PHOTO_PATTERN, _render;

export 

function cleanProfilePhoto(value){return typeof value==='string'&&value.length<=PROFILE_PHOTO_MAX_CHARACTERS&&PROFILE_PHOTO_PATTERN.test(value)?value:''}
export 
function profilePhotoOf(profileId){var profile=state.profileDocs[profileId]; return profile?profile.photo:''}
export 
function profileAvatarHtml(profileId,name,photoOverride){
  var photo=photoOverride!==undefined?photoOverride:profilePhotoOf(profileId);
  return photo?'<img class="avatar-photo" src="'+photo+'" alt="Foto de perfil de '+esc(name)+'" width="'+PROFILE_PHOTO_SIZE+'" height="'+PROFILE_PHOTO_SIZE+'">':avatarSvg(name);
}
export 
function profilePhotoRowHtml(previewPhoto,name){
  return '<div class="pf-photo-row"><span class="pf-avatar pf-avatar-preview'+(previewPhoto?' has-photo':'')+'">'+profileAvatarHtml(state.uid,name,previewPhoto)+'</span>'+
    '<div class="pf-photo-actions"><label class="btn small" for="pf-photo-input">'+(previewPhoto?'Trocar foto':'Escolher foto')+'</label>'+
    '<input id="pf-photo-input" class="pf-file" type="file" accept="image/*">'+
    (previewPhoto?'<button class="btn small" data-act="removephoto">Remover foto</button>':'')+
    '<p class="hint">A foto fica pública no seu perfil. Use uma foto sua ou um desenho. Ela é cortada em quadrado e reduzida no seu aparelho, e os dados da câmera, como a localização, são apagados. Não envie fotos de outras pessoas, de crianças, nudez ou conteúdo ofensivo.</p></div></div>';
}
export 
function loadImageFromFile(file){
  return new Promise(function(resolve,reject){
    var objectUrl=URL.createObjectURL(file), image=new Image();
    image.onload=function(){URL.revokeObjectURL(objectUrl); resolve(image)};
    image.onerror=function(){URL.revokeObjectURL(objectUrl); reject(new Error('Não foi possível abrir esta imagem. Tente outra foto, em JPG, PNG ou WebP.'))};
    image.src=objectUrl;
  });
}
export 
async function resizeFileToProfilePhoto(file){
  if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type))throw new Error('Escolha uma foto em JPG, PNG ou WebP.');
  if(file.size>PROFILE_PHOTO_MAX_FILE_BYTES)throw new Error('Esta foto é grande demais. Escolha uma de até 15 MB.');
  var image=await loadImageFromFile(file), shortestSide=Math.min(image.naturalWidth,image.naturalHeight);
  if(!shortestSide)throw new Error('Não foi possível abrir esta imagem. Tente outra foto, em JPG, PNG ou WebP.');
  var canvas=document.createElement('canvas'); canvas.width=canvas.height=PROFILE_PHOTO_SIZE;
  var context=canvas.getContext('2d'); context.fillStyle='#fff'; context.fillRect(0,0,PROFILE_PHOTO_SIZE,PROFILE_PHOTO_SIZE);
  context.drawImage(image,(image.naturalWidth-shortestSide)/2,(image.naturalHeight-shortestSide)/2,shortestSide,shortestSide,0,0,PROFILE_PHOTO_SIZE,PROFILE_PHOTO_SIZE);
  var quality=.8, dataUrl=canvas.toDataURL('image/jpeg',quality);
  while(dataUrl.length>PROFILE_PHOTO_MAX_CHARACTERS&&quality>.3){quality-=.1; dataUrl=canvas.toDataURL('image/jpeg',quality)}
  if(!cleanProfilePhoto(dataUrl))throw new Error('Não foi possível preparar esta foto. Tente outra.');
  return dataUrl;
}
export 
async function handleProfilePhotoChosen(fileInput){
  var file=fileInput.files&&fileInput.files[0]; fileInput.value='';
  if(!file)return;
  var nameInput=$('#pf-name-input'), bioInput=$('#pf-bio-input');
  if(nameInput&&bioInput)state.profileTextDraft={name:nameInput.value,bio:bioInput.value};
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  try{state.profilePhotoDraft=await resizeFileToProfilePhoto(file); note('Foto preparada. Toque em Salvar perfil para publicar.')}
  catch(error){note(error.message,'err')}
  render();
}
export 
async function removeProfilePhotoAsEditor(profileId){
  if(!state.canEdit||!state.db||!SAFE_ID.test(profileId))return;
  if(state.armed!=='ph:'+profileId){state.armed='ph:'+profileId; render(); return}
  state.armed=null;
  try{await state.db.doc('profiles/'+profileId).update({photo:''}); note('Foto removida do perfil.')}
  catch(error){note(errText(error),'err')}
}
export 
function markReadUnlessLocked(reference){var item=findItem(reference); if(!item||!item.locked)markRead(reference.key)}
export 
function readerCodeOf(readerId){return hashStr(readerId).toString(36).toUpperCase().padStart(6,'0')}
export 
function subscriptionPlanOf(readerId){var subscription=state.subscriptionDocs[readerId]; return subscription?subscription.plan:'banca'}
export 
function currentReaderPlan(){return state.uid?subscriptionPlanOf(state.uid):'banca'}
export 
function subscriptionPlanRank(plan){return SUBSCRIPTION_PLAN_ORDER.indexOf(plan)}
export 
function canReadEarlyAccess(){return !!state.canEdit||currentReaderPlan()!=='banca'}
export 
function earlyAccessDaysLeft(untilTimestamp){return Math.max(1,Math.ceil((untilTimestamp-Date.now())/864e5))}
export 
function safePaymentUrl(value){return typeof value==='string'&&/^https:\/\/[^\s<>"']{4,300}$/.test(value)?value:''}
export 
function formatSubscriberNumber(number){return String(number).padStart(4,'0')}
export 
function formatMonthAndYear(timestamp){try{return new Date(timestamp).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}catch(error){return ''}}
export 
function waitlistPlanOfCurrentReader(){
  var stored=lsGet('gazeta-waitlist','');
  if(stored&&currentReaderPlan()!=='banca'){lsSet('gazeta-waitlist',''); return ''}
  return SUBSCRIPTION_PLAN_LABELS[stored]&&stored!=='banca'?stored:'';
}
export 
function cleanChiefRequest(entry){return entry&&typeof entry==='object'&&typeof entry.text==='string'?{text:clip(entry.text,CHIEF_REQUEST_MAX_LENGTH),at:cnum(entry.at,0,9e15)}:null}
export 
function knownReaderIds(){
  var ids=Object.create(null);
  [state.storyDocs,state.likeDocs,state.ratingDocs,state.commentDocs,state.waitlistDocs,state.subscriptionDocs].forEach(function(documents){Object.keys(documents||{}).forEach(function(id){ids[id]=1})});
  return Object.keys(ids);
}
export 
function nextSubscriberNumber(){
  return Object.keys(state.subscriptionDocs).reduce(function(highest,id){return Math.max(highest,state.subscriptionDocs[id].number)},0)+1;
}
export 

/* limite semanal: 1 história por leitor, só para concorrer à capa da semana */
function storySubmissionsThisWeek(readerId){
  var items=(state.storyDocs[readerId]||{}).items||[];
  return items.filter(function(item){return item.status!=='recusada'&&weekNoOf(item.at)===weekNow()}).length;
}
export 
function weeklySubmissionBlockMessage(){
  if(!state.uid||!state.db)return '';
  var limit=WEEKLY_SUBMISSION_LIMIT_BY_PLAN[currentReaderPlan()];
  if(storySubmissionsThisWeek(state.uid)<limit)return '';
  return 'Você já enviou a história desta semana. Cada leitor envia '+limit+' '+plural(limit,'história','histórias')+' por semana, só para concorrer à capa. A próxima semana começa na segunda-feira, '+dShort(weekRange(weekNow()+1)[0])+'.';
}
export 
function renderWeeklySubmissionHint(){
  var limit=WEEKLY_SUBMISSION_LIMIT_BY_PLAN[currentReaderPlan()], blockMessage=weeklySubmissionBlockMessage();
  var text=blockMessage||('Cada leitor envia '+limit+' '+plural(limit,'história','histórias')+' por semana, só para concorrer à capa da semana.'+(state.uid?' O seu envio desta semana está disponível.':''));
  [].forEach.call(document.querySelectorAll('.weekly-slot-hint'),function(element){element.textContent=text});
}
export 
function renderHonorRoll(){
  var names=Object.keys(state.subscriptionDocs).map(function(id){return state.subscriptionDocs[id]}).filter(function(subscription){return subscription.plan==='editor'&&subscription.honorName}).map(function(subscription){return esc(subscription.honorName)});
  var element=$('#honorRoll'); element.hidden=!names.length; element.innerHTML=names.length?' · Editores-chefe: '+names.join(', '):'';
}
export 

/* primeira mão: o texto só chega a quem assina até o fim do prazo */
function lockedArticleHtml(work,backLabel){
  return '<article class="article"><button class="btn small back" data-act="back">'+backLabel+'</button>'+
    '<p class="kicker">'+esc(work.genre)+' · Em primeira mão</p><h2 class="h-art">'+esc(work.title)+'</h2><p class="byline">'+bylineOf(work)+'</p><hr class="ornament">'+
    '<div class="locked-note"><p class="big">Este conto é de primeira mão para assinantes.</p>'+
    '<p>Ele abre de graça para todos em '+earlyAccessDaysLeft(work.earlyUntil)+' '+plural(earlyAccessDaysLeft(work.earlyUntil),'dia','dias')+' ('+dShort(new Date(work.earlyUntil))+').</p>'+
    '<div class="row"><button class="btn primary" data-act="layer" data-v="assinatura">Ver a assinatura</button></div></div></article>';
}
export 
function behindTheScenesHtml(work){
  if(work.kind!=='work'||!(work.behind||work.hasBehind))return '';
  if(!work.behind)return '<aside class="behind"><p class="kicker">Bastidores</p><p>Este conto tem bastidores, só para assinantes.</p><div class="row"><button class="btn small" data-act="layer" data-v="assinatura">Ver a assinatura</button></div></aside>';
  return '<aside class="behind"><p class="kicker">Bastidores · só para assinantes</p>'+work.behind.split(/\n\s*\n/).map(function(paragraph){return '<p>'+esc(paragraph.replace(/\n/g,' ').trim())+'</p>'}).join('')+'</aside>';
}
export 
function earlyAccessChipHtml(work){
  return work.earlyUntil>Date.now()?'<span class="chip">Primeira mão · '+earlyAccessDaysLeft(work.earlyUntil)+' '+plural(earlyAccessDaysLeft(work.earlyUntil),'dia','dias')+'</span>':'';
}
/* a aba Assinatura agora é React: views/Assinatura.tsx */
export 
function renderSubscription(){
  var body=$('#subBody'), focused=document.activeElement;
  if(focused&&body.contains(focused)&&/^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName))return;
  var plan=currentReaderPlan(), waitingPlan=waitlistPlanOfCurrentReader();
  $('#subSub').textContent=plan==='banca'?'Leia o conto novo do Raul uma semana antes de todo mundo.':'Você é '+SUBSCRIPTION_PLAN_LABELS[plan]+'. Obrigado por manter o jornal.';
  mountAssinatura(body);
}
export 

/* ações da assinatura */
async function joinSubscriptionWaitlist(plan){
  if(!state.db||!state.uid){note('Para entrar na lista, abra esta página com a sua conta ativa.','err');return}
  if(state.canWrite===false){note('Seu acesso é só de leitura.','err');return}
  if(!SUBSCRIPTION_PLAN_LABELS[plan]||plan==='banca')return;
  try{
    await state.db.doc('waitlist/'+state.uid).set({plan:plan,at:Date.now()});
    lsSet('gazeta-waitlist',plan);
    note('Você entrou na lista de espera do plano '+SUBSCRIPTION_PLAN_LABELS[plan]+'. Seu código de leitor é '+readerCodeOf(state.uid)+'.');
  }catch(error){note(errText(error),'err')}
  render();
}
export 
async function leaveSubscriptionWaitlist(){
  if(!state.db||!state.uid)return;
  try{await state.db.doc('waitlist/'+state.uid).delete(); lsSet('gazeta-waitlist',''); note('Você saiu da lista de espera.')}
  catch(error){note(errText(error),'err')}
  render();
}
export 
async function savePaymentSettings(){
  if(!state.canEdit||!state.db)return;
  var payUrl=$('#sub-pay-url').value.trim(), instructions=$('#sub-pay-text').value.trim().slice(0,300);
  if(payUrl&&!safePaymentUrl(payUrl)){markBad('#sub-pay-url'); note('O link de pagamento precisa começar com https://.','err');return}
  try{await state.db.doc('meta/subscription').set({payUrl:payUrl,instructions:instructions}); note('Dados de pagamento salvos.')}
  catch(error){note(errText(error),'err')}
}
export 
async function saveMonthlyLetter(){
  if(!state.canEdit||!state.db)return;
  var text=$('#sub-letter-text').value.replace(/\r/g,'').trim().slice(0,MONTHLY_LETTER_MAX_LENGTH);
  try{await state.db.doc('meta/carta').set({text:text,at:Date.now()}); note(text?'Carta publicada para os assinantes.':'Carta removida.')}
  catch(error){note(errText(error),'err')}
}
export 
async function activateSubscription(readerId,plan){
  if(!state.canEdit||!state.db||!SAFE_ID.test(readerId)||!SUBSCRIPTION_PLAN_LABELS[plan]||plan==='banca')return;
  var existing=state.subscriptionDocs[readerId], honorInput=$('#sub-honor-name');
  var honorName=plan==='editor'&&honorInput?clip(honorInput.value.trim(),40):'';
  try{
    await state.db.doc('subscriptions/'+readerId).set({plan:plan,number:existing?existing.number:nextSubscriberNumber(),since:existing?existing.since:Date.now(),honorName:honorName});
    try{await state.db.doc('waitlist/'+readerId).delete()}catch(error){}
    note('Plano '+SUBSCRIPTION_PLAN_LABELS[plan]+' ativado para o código '+readerCodeOf(readerId)+'.');
  }catch(error){note(errText(error),'err')}
}
export 
function activateSubscriptionByCode(){
  var code=$('#sub-code-input').value.trim().toUpperCase(), plan=$('#sub-code-plan').value;
  var matches=knownReaderIds().filter(function(readerId){return readerCodeOf(readerId)===code});
  if(!code||matches.length!==1){markBad('#sub-code-input'); note(matches.length>1?'Mais de um leitor com esse código. Use a lista de espera.':'Nenhum leitor encontrado com esse código.','err');return}
  activateSubscription(matches[0],plan);
}
export 
async function revokeSubscription(readerId){
  if(!state.canEdit||!state.db||!SAFE_ID.test(readerId))return;
  if(state.armed!=='sub:'+readerId){state.armed='sub:'+readerId; render(); return}
  state.armed=null;
  try{await state.db.doc('subscriptions/'+readerId).delete(); note('Assinatura encerrada. O leitor volta para a banca.')}
  catch(error){note(errText(error),'err')}
}
export 
async function sendEditorChiefRequest(){
  if(!state.db||!state.uid||currentReaderPlan()!=='editor')return;
  var kind=$('#req-kind').value==='tema'?'tema':'personagem', text=$('#req-text').value.replace(/[\u0000-\u001F]/g,' ').trim().slice(0,CHIEF_REQUEST_MAX_LENGTH);
  if(text.length<3){markBad('#req-text'); note('Escreva o nome ou o tema com pelo menos 3 caracteres.','err');return}
  if(LINK_RE.test(text)){markBad('#req-text'); note('Links e e-mails não são permitidos no pedido.','err');return}
  var now=new Date(), currentMonth=now.getFullYear()+'-'+(now.getMonth()+1), sentMonths=lsGet('gazeta-requests',{});
  if(kind==='personagem'&&sentMonths.personagem===currentMonth){note('Você já fez o pedido de personagem deste mês. O próximo pode ser feito no mês que vem.','err');return}
  var payload={}; payload[kind]={text:text,at:Date.now()};
  var reference=state.db.doc('requests/'+state.uid);
  try{
    try{await reference.update(payload)}catch(error){await reference.set(payload)}
    if(kind==='personagem'){sentMonths.personagem=currentMonth; lsSet('gazeta-requests',sentMonths)}
    $('#req-text').value=''; note('Pedido enviado ao Raul.');
  }catch(error){note(errText(error),'err')}
}
export 
async function deleteChiefRequest(readerId,kind){
  if(!state.canEdit||!state.db||!SAFE_ID.test(readerId)||(kind!=='personagem'&&kind!=='tema'))return;
  var payload={}; payload[kind]=null;
  try{await state.db.doc('requests/'+readerId).update(payload); note('Pedido marcado como concluído.')}
  catch(error){note(errText(error),'err')}
}
export 
function handleSubscriptionAction(action,button){
  switch(action){
    case 'joinwaitlist': joinSubscriptionWaitlist(button.dataset.plan); return true;
    case 'leavewaitlist': leaveSubscriptionWaitlist(); return true;
    case 'savepayment': savePaymentSettings(); return true;
    case 'savecarta': saveMonthlyLetter(); return true;
    case 'activatesub': activateSubscription(button.dataset.reader,button.dataset.plan); return true;
    case 'activatebycode': activateSubscriptionByCode(); return true;
    case 'revokesub': revokeSubscription(button.dataset.reader); return true;
    case 'sendrequest': sendEditorChiefRequest(); return true;
    case 'delrequest': deleteChiefRequest(button.dataset.reader,button.dataset.kind); return true;
  }
  return false;
}
export 
async function reportStory(key){
  if(!state.db||!state.uid||state.reported[key])return;
  state.reportN=(state.reportN||0)+1; if(state.reportN>8){note('Muitas denúncias nesta visita. Tente de novo mais tarde.','err');return}
  try{
    var rid='r'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    await state.db.doc('reports/'+rid).set({key:key,by:state.uid,at:Date.now()});
    state.reported[key]=1; note('Denúncia enviada ao editor. Obrigado por avisar.'); render();
  }catch(err){note(errText(err),'err')}
}
export 
async function downloadMyData(){
  try{
    var dl=await window.claude.use('downloads');
    if(!dl){note('O download não está disponível neste acesso.','err');return}
    var mine=state.storyDocs[state.uid]||{}, lk=state.likeDocs[state.uid]||{};
    await dl.save({filename:'meus-dados-gazeta.json',data:JSON.stringify({historias:mine.items||[],consentimento:mine.consent||null,curtidas:lk.ids||[],comentarios:(state.commentDocs[state.uid]||{}).items||[],avaliacoes:(state.ratingDocs[state.uid]||{}).r||{}},null,2)});
  }catch(err){}
}
export 
async function deleteMyData(){
  if(!state.db||!state.uid)return;
  var b=$('#dd-btn');
  if(state.armed!=='mydata'){state.armed='mydata'; b.textContent='Confirmar exclusão dos meus dados'; return}
  state.armed=null; b.textContent='Excluir meus dados';
  try{
    try{await state.db.doc('stories/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('likes/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('comments/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('ratings/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('waitlist/'+state.uid).delete(); lsSet('gazeta-waitlist','')}catch(x){}
    try{await state.db.doc('requests/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('profiles/'+state.uid).delete()}catch(x){}
    try{await state.db.doc('follows/'+state.uid).delete()}catch(x){}
    note('Seus dados foram excluídos.'); dlgClose($('#privacyDlg'));
  }catch(err){note(errText(err),'err')}
}
export 
function restoreFocus(){
  if(!state.focusKey)return;
  var el=document.querySelector('[data-act="like"][data-key="'+state.focusKey.replace(/["\\]/g,'')+'"]');
  if(el&&document.activeElement!==el)el.focus({preventScroll:true});
}
export 
async function saveStory(e){
  e.preventDefault();
  if(state.busy)return;
  if(!state.uid){goLogin();return}
  if(!state.db)return;
  var pen=$('#s-pen').value.trim().slice(0,40), title=$('#s-title').value.trim().slice(0,120), genre=$('#s-genre').value, bio=($('#s-bio')?$('#s-bio').value:'').replace(/[\u0000-\u001F]/g,' ').trim().slice(0,160);
  var text=$('#s-text').value.replace(/\r/g,'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,6000);
  if(!pen||!title||text.length<40){markBad(!pen?'#s-pen':(!title?'#s-title':'#s-text')); note('Preencha nome de autor, título e uma história com pelo menos 40 caracteres.','err');return}
  if($('#s-hp').value)return;
  if(state.bans[state.uid]){note('Seu acesso à Capa foi bloqueado pelo editor.','err');return}
  if(!$('#s-consent').checked){markBad('#s-consent'); note('Marque a concordância com a política de privacidade para publicar.','err');return}
  if(state.canWrite===false){note('Seu acesso é só de leitura.','err');return}
  var weeklyBlockMessage=weeklySubmissionBlockMessage();
  if(weeklyBlockMessage){note(weeklyBlockMessage,'err');return}
  if(LINK_RE.test(pen+' '+title+' '+text+' '+bio)){note('Links e e-mails não são permitidos no nome, no título nem na história.','err');return}
  var pubs=lsGet('gazeta-pubs',[]).filter(function(t){return Date.now()-t<864e5});
  if(pubs.length>=5){note('Limite de 5 envios por dia neste aparelho. Volte amanhã.','err');return}
  if(Date.now()-state.lastPost<30000){note('Aguarde alguns segundos antes de publicar outra história.','err');return}
  pubs.push(Date.now()); lsSet('gazeta-pubs',pubs);
  state.busy=true; $('#s-save').disabled=true;
  try{
    try{localStorage.setItem('gazeta-pen',pen)}catch(x){}
    note('Fazendo a vistoria de originalidade da sua história…');
    var v=await vistoria(title,text);
    if(v.status==='rejeitada'){note(v.msg,'err'); state.busy=false; $('#s-save').disabled=false; return}
    var ref=state.db.doc('stories/'+state.uid);
    var snap=await ref.get();
    var items=snap.exists?((snap.data().items)||[]).slice():[];
    if(items.length>=20){note('Limite de 20 histórias por leitor. Retire uma para publicar outra.','err')}
    else{
      items.push({id:newId(),pen:pen,bio:bio,title:title,genre:genre,text:text,at:Date.now(),status:v.status,check:v.check});
      await ref.set({items:items,consent:{ok:true,at:Date.now(),v:'2026-10'}});
      state.lastPost=Date.now(); $('#s-consent').checked=false; try{localStorage.removeItem('gazeta-draft')}catch(x){} $('#s-draft').textContent='';
      $('#s-title').value=''; $('#s-text').value=''; $('#s-count').textContent='0 / 6000';
      state.composerOpen=false; state.capaPage=1;
      note(v.status==='aprovada'?'Enviado ao editor. A vistoria não achou problemas, então seu texto já concorre nesta semana. Acompanhe na aba Enviados da semana.':'Enviado ao editor. O texto ficou em análise e vai concorrer assim que for aprovado. Acompanhe na aba Enviados da semana.');
    }
  }catch(err){note(errText(err),'err')}
  state.busy=false; $('#s-save').disabled=false; render();
}
export 
async function delStory(key){
  if(!state.db)return;
  if(!state.canEdit)return;
  var i=key.indexOf(':'), uid=key.slice(0,i), id=key.slice(i+1);
  var reason=prompt('Motivo da remoção (o autor verá este aviso):');
  if(reason===null)return;
  reason=reason.trim().slice(0,500);
  if(!reason){note('Escreva o motivo da remoção.','err');return}
  try{
    // leituras juntas, depois gravações juntas: eram 4 idas ao servidor em fila
    var ref=state.db.doc('stories/'+uid), nref=state.db.doc('notices/'+uid);
    var snaps=await Promise.all([ref.get(),nref.get()]), snap=snaps[0], nsnap=snaps[1];
    var gone=((snap.exists&&snap.data().items)||[]).filter(function(x){return x.id===id})[0];
    var items=((snap.exists&&snap.data().items)||[]).filter(function(x){return x.id!==id});
    var prior=((nsnap.exists&&nsnap.data().items)||[]).slice(-19);
    await Promise.all([
      ref.set({items:items,consent:(snap.exists&&snap.data().consent)||null}),
      nref.set({items:prior.concat([{id:id,title:(gone&&gone.title)||'',reason:reason,at:Date.now()}])})
    ]);
    if(state.reading&&state.reading.key===key)state.reading=null;
    note('História removida.');
  }catch(err){note(errText(err),'err')}
}
export 
async function toggleLike(key){
  if(!state.db||!state.uid||state.busyLike)return;
  state.focusKey=key; setTimeout(function(){state.focusKey=null},2500);
  var ids=myLikes().slice(), i=ids.indexOf(key);
  if(i>=0)ids.splice(i,1); else ids.push(key);
  var lb=document.querySelector('.like[data-key="'+CSS.escape(key)+'"]');
  if(lb){var on=!lb.classList.contains('on'); lb.classList.toggle('on',on); lb.setAttribute('aria-pressed',String(on)); lb.setAttribute('aria-busy','true'); var bb=lb.querySelector('b'); if(bb)bb.textContent=Math.max(0,(+bb.textContent||0)+(on?1:-1)); if(lb.firstChild&&lb.firstChild.nodeType===3)lb.firstChild.nodeValue='☞ '+(on?'Curtida':'Curtir')+' · '}
  state.busyLike=true;
  try{await state.db.doc('likes/'+state.uid).set({ids:ids})}
  catch(err){note(errText(err),'err'); render()}
  state.busyLike=false;
}
export 
async function toggleSamples(){
  if(!state.db)return;
  try{await state.db.doc('meta/settings').set({hideSamples:!state.hideSamples})}
  catch(err){note(errText(err),'err')}
}

export function init(){

/* ---------- Foto do perfil ---------- */
PROFILE_PHOTO_SIZE=192;

PROFILE_PHOTO_MAX_CHARACTERS=36000;

PROFILE_PHOTO_MAX_FILE_BYTES=15*1048576;

PROFILE_PHOTO_PATTERN=/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;

state.profilePhotoDraft=undefined;
 state.profileTextDraft=null;

document.addEventListener('change',function(event){if(event.target&&event.target.id==='pf-photo-input')handleProfilePhotoChosen(event.target)});

_render=render;
 __set_render(function(){_render(); restoreFocus(); updateProg(); newsExtras(); cmRestore()});


document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-act]'); if(!t)return;
  var a=t.dataset.act;
  if(a!=='delwork'&&a!=='delstory'&&a!=='revokesub'&&a!=='clearprofile'&&a!=='clearphoto'&&state.armed){state.armed=null; schedule()}
  if(handleSubscriptionAction(a,t)||handleProfileAction(a,t))return;
  switch(a){
    case 'layer': state.layer=t.dataset.v; state.reading=null; if(t.dataset.v==='leituras')state.lsec=null; render(); toTop(); break;
    case 'ltype': state.lsec=t.dataset.v; render(); toTop(); break;
    case 'ltypes': state.lsec=null; render(); break;
    case 'chessreset': chessReset(); break;
    case 'rate': rateItem(t.dataset.key,+t.dataset.n); break;
    case 'cmsend': addComment(t.dataset.key); break;
    case 'cmdel': delComment(t.dataset.uid,t.dataset.id); break;
    case 'secgo': state.layer='leituras'; state.lsec=t.dataset.v; state.reading=null; state.q=''; $('#l-q').value=''; render(); toTop(); break;
    case 'privacy': dlgOpen($('#privacyDlg')); break;
    case 'closeprivacy': dlgClose($('#privacyDlg')); break;
    case 'report': reportStory(t.dataset.key); break;
    case 'dldata': downloadMyData(); break;
    case 'deldata': deleteMyData(); break;
    case 'section': state.section=t.dataset.v; render(); break;
    case 'open': state.reading={kind:t.dataset.kind,key:t.dataset.key}; state.armed=null; markReadUnlessLocked(state.reading); render(); toTop(); break;
    case 'back': state.reading=null; render(); break;
    case 'approve': approveStory(t.dataset.key); break;
    case 'reverify': reverify(t.dataset.key); break;
    case 'audit': auditAll(); break;
    case 'banuser': banUser(t.dataset.uid); break;
    case 'surprise': surprise(); break;
    case 'shelfview': state.layer='leituras'; state.lsec='__shelf'; state.reading=null; state.q=''; $('#l-q').value=''; render(); toTop(); break;
    case 'shelf': toggleShelf(t.dataset.key); break;
    case 'fs': changeFs(+t.dataset.d); break;
    case 'print': window.print(); break;
    case 'clearq': state.q=''; $('#l-q').value=''; render(); break;
    case 'page': state.capaPage=+t.dataset.n; render(); break;
    case 'like': toggleLike(t.dataset.key); break;
    case 'newstory':
      var weeklyBlockMessage=weeklySubmissionBlockMessage();
      if(weeklyBlockMessage){note(weeklyBlockMessage,'err');break}
      if(openTypewriter())break;
      state.composerOpen=true; render();
      var pen=$('#s-pen');
      if(!pen.value){try{pen.value=localStorage.getItem('gazeta-pen')||''}catch(x){}}
      $('#composer').scrollIntoView({block:'start'});
      if(!$('#storyForm').hidden)(pen.value?$('#s-title'):pen).focus();
      break;
    case 'closestory': state.composerOpen=false; render(); break;
    case 'demo': state.demo=!state.demo; state.capaPage=1; state.reading=null; render(); break;
    case 'newwork': openWorkForm(null); break;
    case 'editwork': openWorkForm(t.dataset.key); break;
    case 'cancelwork': state.workFormOpen=false; state.editing=null; render(); break;
    case 'samples': toggleSamples(); break;
    case 'delwork':
      if(state.armed==='w:'+t.dataset.key){state.armed=null; delWork(t.dataset.key)}
      else{state.armed='w:'+t.dataset.key; render()}
      break;
    case 'delstory':
      if(state.armed==='s:'+t.dataset.key){state.armed=null; delStory(t.dataset.key)}
      else{state.armed='s:'+t.dataset.key; render()}
      break;
  }
});

$('#workForm').addEventListener('submit',saveWork);

$('#storyForm').addEventListener('submit',saveStory);

$('#w-genre').addEventListener('change',function(){$('#w-genre-new-wrap').hidden=this.value!=='__new__'});

$('#s-text').addEventListener('input',function(){$('#s-count').textContent=this.value.length+' / 6000'});
}
