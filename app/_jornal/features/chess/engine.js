// Motor de xadrez do puzzle: lances legais, xeque, mate e roque (sem en passant; promoção sempre em dama). Sem DOM.
/* ---------- motor de xadrez do puzzle: lances legais, xeque, mate, roque ---------- */
export var CE={};
CE.parse=function(fen){
  var p=fen.split(' '), rows=p[0].split('/'), b=[], r, f, ch, n;
  for(r=0;r<8;r++){b.push([]); for(f=0;f<rows[r].length;f++){ch=rows[r].charAt(f); if(/\d/.test(ch)){for(n=0;n<+ch;n++)b[r].push(null)}else b[r].push(ch)}}
  return {b:b,turn:p[1]==='w',castle:p[2]||'-'};
};
CE.isW=function(p){return p===p.toUpperCase()};
CE.attacked=function(b,r,c,byW){
  var i,j,rr,cc,pc,dirs,k,pcs,N=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  for(i=0;i<8;i++){rr=r+N[i][0]; cc=c+N[i][1]; if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr][cc]===(byW?'N':'n'))return true}
  for(i=-1;i<=1;i++)for(j=-1;j<=1;j++){if(i||j){rr=r+i; cc=c+j; if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr][cc]===(byW?'K':'k'))return true}}
  for(j=-1;j<=1;j+=2){rr=byW?r+1:r-1; cc=c+j; if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr][cc]===(byW?'P':'p'))return true}
  for(k=0;k<2;k++){
    dirs=k?[[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]]; pcs=k?'BQ':'RQ';
    for(i=0;i<4;i++){rr=r+dirs[i][0]; cc=c+dirs[i][1];
      while(rr>=0&&rr<8&&cc>=0&&cc<8){pc=b[rr][cc]; if(pc){if(CE.isW(pc)===byW&&pcs.indexOf(pc.toUpperCase())>=0)return true; break} rr+=dirs[i][0]; cc+=dirs[i][1]}}
  }
  return false;
};
CE.kingPos=function(b,w){var r,c; for(r=0;r<8;r++)for(c=0;c<8;c++)if(b[r][c]===(w?'K':'k'))return [r,c]; return null};
CE.inCheck=function(b,w){var k=CE.kingPos(b,w); return !!k&&CE.attacked(b,k[0],k[1],!w)};
CE.pseudo=function(S,w){
  var b=S.b, out=[], r, c, p, t, i, d, dr, dc, rr, cc, dirs, ds;
  for(r=0;r<8;r++)for(c=0;c<8;c++){
    p=b[r][c]; if(!p||CE.isW(p)!==w)continue; t=p.toUpperCase();
    if(t==='P'){
      d=w?-1:1;
      if(r+d>=0&&r+d<8&&!b[r+d][c]){out.push([r,c,r+d,c]); if(r===(w?6:1)&&!b[r+2*d][c])out.push([r,c,r+2*d,c])}
      for(dc=-1;dc<=1;dc+=2){rr=r+d; cc=c+dc; if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr][cc]&&CE.isW(b[rr][cc])!==w)out.push([r,c,rr,cc])}
    }else if(t==='N'||t==='K'){
      ds=t==='N'?[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]:[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for(i=0;i<ds.length;i++){rr=r+ds[i][0]; cc=c+ds[i][1]; if(rr>=0&&rr<8&&cc>=0&&cc<8&&(!b[rr][cc]||CE.isW(b[rr][cc])!==w))out.push([r,c,rr,cc])}
    }else{
      dirs=[]; if('RQ'.indexOf(t)>=0)dirs=dirs.concat([[1,0],[-1,0],[0,1],[0,-1]]); if('BQ'.indexOf(t)>=0)dirs=dirs.concat([[1,1],[1,-1],[-1,1],[-1,-1]]);
      for(i=0;i<dirs.length;i++){rr=r+dirs[i][0]; cc=c+dirs[i][1];
        while(rr>=0&&rr<8&&cc>=0&&cc<8){if(b[rr][cc]){if(CE.isW(b[rr][cc])!==w)out.push([r,c,rr,cc]); break} out.push([r,c,rr,cc]); rr+=dirs[i][0]; cc+=dirs[i][1]}}
    }
  }
  var h=w?7:0;
  if(b[h][4]===(w?'K':'k')&&!CE.attacked(b,h,4,!w)){
    if(S.castle.indexOf(w?'K':'k')>=0&&b[h][7]===(w?'R':'r')&&!b[h][5]&&!b[h][6]&&!CE.attacked(b,h,5,!w)&&!CE.attacked(b,h,6,!w))out.push([h,4,h,6]);
    if(S.castle.indexOf(w?'Q':'q')>=0&&b[h][0]===(w?'R':'r')&&!b[h][1]&&!b[h][2]&&!b[h][3]&&!CE.attacked(b,h,3,!w)&&!CE.attacked(b,h,2,!w))out.push([h,4,h,2]);
  }
  return out;
};
CE.apply=function(S,m){
  var b=S.b.map(function(row){return row.slice()}), p=b[m[0]][m[1]], castle=S.castle, w=CE.isW(p);
  b[m[2]][m[3]]=p; b[m[0]][m[1]]=null;
  if(p.toUpperCase()==='K'&&Math.abs(m[3]-m[1])===2){var h=m[0]; if(m[3]===6){b[h][5]=b[h][7]; b[h][7]=null}else{b[h][3]=b[h][0]; b[h][0]=null}}
  if(p==='P'&&m[2]===0)b[m[2]][m[3]]='Q'; if(p==='p'&&m[2]===7)b[m[2]][m[3]]='q';
  if(p.toUpperCase()==='K')castle=castle.replace(w?/[KQ]/g:/[kq]/g,'');
  [[7,0,'Q'],[7,7,'K'],[0,0,'q'],[0,7,'k']].forEach(function(x){if((m[0]===x[0]&&m[1]===x[1])||(m[2]===x[0]&&m[3]===x[1]))castle=castle.replace(x[2],'')});
  return {b:b,turn:!S.turn,castle:castle||'-'};
};
CE.legal=function(S){return CE.pseudo(S,S.turn).filter(function(m){return !CE.inCheck(CE.apply(S,m).b,S.turn)})};
CE.mated=function(S){return CE.inCheck(S.b,S.turn)&&CE.legal(S).length===0};
CE.exists=function(S,n){
  var w=S.turn, ms=CE.pseudo(S,w), i, m, ns, chk, rep;
  for(i=0;i<ms.length;i++){
    m=ms[i]; ns=CE.apply(S,m); if(CE.inCheck(ns.b,w))continue; chk=CE.inCheck(ns.b,!w);
    if(n===1){if(chk&&CE.legal(ns).length===0)return true; continue}
    rep=CE.legal(ns); if(rep.length===0){if(chk)return true; continue}
    if(rep.every(function(d){return CE.exists(CE.apply(ns,d),n-1)}))return true;
  }
  return false;
};
CE.need=function(S,k){for(var t=1;t<=k;t++)if(CE.exists(S,t))return t; return 99};
CE.bestDefense=function(S,k){var reps=CE.legal(S), best=reps[0], bn=-1, i, nd; for(i=0;i<reps.length;i++){nd=CE.need(CE.apply(S,reps[i]),k); if(nd>bn){bn=nd; best=reps[i]}} return best};
export function sqName(r,c){return 'abcdefgh'.charAt(c)+(8-r)}
export function sqRC(n){return [8-(+n.charAt(1)),'abcdefgh'.indexOf(n.charAt(0))]}
export function mvName(m){return sqName(m[0],m[1])+sqName(m[2],m[3])}
export function mvOf(s){var a=sqRC(s.slice(0,2)), b=sqRC(s.slice(2,4)); return [a[0],a[1],b[0],b[1]]}

