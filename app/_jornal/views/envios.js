import { $, state } from '../core/base.js';
import { findItem } from '../core/dados.js';
import { articleHtml } from './html.js';
import { renderComposer } from './capa.js';
import { closeLabel, weekLabel, weekNow } from './semana.js';
import { renderPending } from '../engine.js';
import { mountEnvios, unmountEnvios } from './EnviosView';

/* aba Enviados da semana: o que eu enviei, o que está em análise e quem concorre */
export 
function renderEnvios(){
  var W=weekNow(), box=$('#enBody'); renderComposer(); renderPending();
  $('#enSub').textContent='Semana nº '+W+' · '+weekLabel(W)+'. Fecha em '+closeLabel()+' (domingo, 23h59). Na segunda-feira, o texto mais votado vira a manchete da Capa e os seguintes ocupam as páginas.';
  if(state.reading){
    var it=findItem(state.reading); if(!it){state.reading=null;return renderEnvios()}
    $('#pendingBox').hidden=true; unmountEnvios(box); box.innerHTML=articleHtml(it); return;
  }
  $('#pendingBox').hidden=false; mountEnvios(box);
}
