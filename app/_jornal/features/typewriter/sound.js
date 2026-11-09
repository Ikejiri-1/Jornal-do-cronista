// Áudio da máquina de escrever e dos teclados. O AudioContext só é criado no primeiro uso (ctx()), que vem de um gesto da pessoa.
export function createSound(getMode){
  var twAC=null, twDest=null, twKbNode=null, twMaster=null, twNB=null;
function twCtx(){try{twAC=twAC||new (window.AudioContext||window.webkitAudioContext)(); if(twAC.state==='suspended')twAC.resume(); return twAC}catch(e){return null}}
function twOut(){
  if(!twMaster){var a=twAC; twMaster=a.createDynamicsCompressor(); var g=a.createGain(); g.gain.value=.95; twMaster.connect(g); g.connect(a.destination)}
  return twDest||twMaster;
}
function twHit(t,o){
  var a=twAC; if(!twNB){var len=a.sampleRate, b=a.createBuffer(1,len,a.sampleRate), x=b.getChannelData(0), i; for(i=0;i<len;i++)x[i]=Math.random()*2-1; twNB=b}
  var s=a.createBufferSource(), f=a.createBiquadFilter(), n=a.createGain();
  s.buffer=twNB; f.type=o.type||'bandpass'; f.frequency.value=o.f; f.Q.value=o.q||1;
  n.gain.setValueAtTime(o.g,t); n.gain.exponentialRampToValueAtTime(.0008,t+o.d);
  s.connect(f); f.connect(n); n.connect(twOut()); s.start(t,Math.random()*.5,o.d+.03);
}
function twThump(t,fq,d,g,ty){
  var a=twAC, o=a.createOscillator(), n=a.createGain(); o.type=ty||'sine';
  o.frequency.setValueAtTime(fq,t); o.frequency.exponentialRampToValueAtTime(fq*.5,t+d);
  n.gain.setValueAtTime(g,t); n.gain.exponentialRampToValueAtTime(.0008,t+d);
  o.connect(n); n.connect(twOut()); o.start(t); o.stop(t+d+.03);
}
function twRing(t,fq,d,g){
  var a=twAC, o=a.createOscillator(), n=a.createGain(); o.type='sine'; o.frequency.value=fq;
  n.gain.setValueAtTime(g,t); n.gain.exponentialRampToValueAtTime(.0008,t+d);
  o.connect(n); n.connect(twOut()); o.start(t); o.stop(t+d+.03);
}
/* teclado de escritório: "tock" macio (batida grave + toque do plástico + soltura da tecla), tudo filtrado */
function twKbOut(){
  var m=twOut();
  if(!twKbNode){var a=twAC, f=a.createBiquadFilter(), g=a.createGain(); f.type='lowpass'; f.frequency.value=4200; f.Q.value=.5; g.gain.value=.85; f.connect(g); g.connect(m); twKbNode=f}
  return twKbNode;
}
/* teclado mecânico (switch azul): "tink" metálico do clique, "clack" do fundo da tecla + "thock" da caixa, e o clique da soltura */
function twMechHit(kind,r){
  var t=twAC.currentTime+.002, g=.9+r*.25, big=kind==='space'||kind==='enter', m=big?.7:kind==='back'?.9:1;
  twHit(t,{d:.025,g:1.3*g,f:4300*m+r*500,q:7});               // tink do clique (ressonância alta = metal)
  twHit(t,{d:.03,g:.9*g,f:2900*m,q:8});
  twHit(t+.014,{d:.05,g:.9*g,f:1700*m+r*200,q:2.5});          // clack: plástico batendo no fundo
  twHit(t+.014,{d:.012,g:.35*g,f:6000,type:'highpass',q:.7}); // estalo do keycap
  twThump(t+.014,230*m+r*30,.08,.32*g,'triangle');            // thock da caixa
  if(big){twHit(t+.03,{d:.06,g:.4*g,f:900,q:3}); twHit(t+.05,{d:.04,g:.25*g,f:1300,q:3})} // estabilizador
  twHit(t+.075+r*.01,{d:.02,g:.8*g,f:3700*m,q:7});            // clique ao soltar
  twHit(t+.085,{d:.03,g:.3*g,f:1400*m,q:2});
}
/* teclado de membrana: baque de borracha abafado, sem clique */
function twMemHit(kind,r){
  var t=twAC.currentTime+.002, g=.85+r*.3, m={space:.7,enter:.8,back:.95}[kind]||1;
  twDest=twKbOut();
  try{
    twThump(t,120*m+r*25,.07,.3*g,'sine');
    twHit(t,{d:.04,g:.16*g,f:700*m+r*100,type:'lowpass',q:.5});
    twHit(t+.045,{d:.025,g:.04*g,f:500,type:'lowpass',q:.5});
  }finally{twDest=null}
}
function twKbHit(kind,r){
  if(getMode()==='mech')return twMechHit(kind,r);
  if(getMode()==='mem')return twMemHit(kind,r);
  twOfficeHit(kind,r);
}
function twOfficeHit(kind,r){
  var t=twAC.currentTime+.002, g=.85+r*.3;
  twDest=twKbOut();
  try{
    if(kind==='space'){
      twThump(t,95+r*12,.12,.26*g,'triangle'); twHit(t,{d:.05,g:.14*g,f:700,type:'lowpass',q:.5});
      twHit(t+.025,{d:.09,g:.05,f:500,type:'lowpass',q:.6}); twHit(t+.085,{d:.03,g:.07,f:1400,type:'lowpass',q:.5});
    }else if(kind==='enter'){
      twThump(t,115+r*10,.11,.28*g,'triangle'); twHit(t,{d:.045,g:.16*g,f:1100,type:'lowpass',q:.6});
      twHit(t+.03,{d:.07,g:.06,f:600,type:'lowpass',q:.6}); twHit(t+.09,{d:.03,g:.07,f:1500,type:'lowpass',q:.5});
    }else if(kind==='back'){
      twThump(t,150+r*15,.07,.18*g,'triangle'); twHit(t,{d:.03,g:.12*g,f:1500,type:'lowpass',q:.6}); twHit(t+.06,{d:.02,g:.05,f:1500,type:'lowpass',q:.5});
    }else{
      twThump(t,150+r*50,.085,.24*g,'triangle'); twHit(t,{d:.032,g:.17*g,f:1600+r*400,type:'lowpass',q:.6});
      twHit(t+.003,{d:.015,g:.04*g,f:2600,q:1.4}); twHit(t+.075+r*.01,{d:.022,g:.07*g,f:1300,type:'lowpass',q:.5});
    }
  }finally{twDest=null}
}
  return {ctx:twCtx, hit:twHit, thump:twThump, ring:twRing, kbHit:twKbHit, ac:function(){return twAC}};
}
