/* gerado a partir de engine.js (Etapa 2, passo 0). Corpo igual ao original; só mudou onde cada coisa mora. */
import { $, esc, state } from '../core/base.js';
import { genres } from '../core/dados.js';

export 

/* ---------- mesa do redator ---------- */
function renderTools(){
  var show=state.canEdit&&!!state.db;
  $('#authorTools').hidden=!show;
  $('#btnSamples').textContent=state.hideSamples?'Mostrar textos de exemplo':'Ocultar textos de exemplo';
  $('#workForm').hidden=!(show&&state.workFormOpen);
  $('#workFormTitle').textContent=state.editing?'Editar texto':'Novo texto';
  $('#w-save').textContent=state.editing?'Salvar alterações':'Publicar';
}
export 
function syncOptions(){
  var gs=genres(), key=gs.join('|');
  if(key===state.optsKey)return;
  state.optsKey=key;
  var wSel=$('#w-genre'), sSel=$('#s-genre');
  var wv=wSel.value, sv=sSel.value;
  var opts=gs.map(function(g){return '<option value="'+esc(g)+'">'+esc(g)+'</option>'}).join('');
  wSel.innerHTML=opts+'<option value="__new__">Nova seção…</option>';
  sSel.innerHTML=opts;
  if(wv&&wSel.querySelector('option[value="'+CSS.escape(wv)+'"]'))wSel.value=wv;
  if(sv&&sSel.querySelector('option[value="'+CSS.escape(sv)+'"]'))sSel.value=sv;
}
