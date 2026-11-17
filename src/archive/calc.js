/* ================= calculation ================= */
function groups(){const n=Math.max(1,+I.countries||1);if(n===1)return {L:0,M:1,S:0,n,ok:true};const L=+I.nL||0,M=+I.nM||0,S=+I.nS||0;return {L,M,S,n,ok:L+M+S===n};}
function weightTot(){const g=groups();return g.L*P.fL+g.M*P.fM+g.S*P.fS||1;}
function regionsSel(){const r=REG.filter(([k])=>I.regs[k]).map(([k])=>k);return r.length?r:["EM"];}
const SZN={L:"large",M:"medium",S:"small"};
function usersCalc(){
 const g=groups(),how=[];
 if(I.usersKnown==="yes"){const u=+I.users||0;return {u,est:false,how:[["Users or customers in scope","entered",u]]};}
 const refs=(I.refs||[]).filter(r=>+r.users>0);
 if(!refs.length)return {u:0,est:true,how:[["Users in scope","add at least one reference country","–"]]};
 /* per medium-equivalent from all references */
 const perMed=refs.map(r=>(+r.users)/P["f"+r.size]),avgMed=perMed.reduce((a,b)=>a+b,0)/perMed.length;
 refs.forEach(r=>how.push([`Reference: ${r.name?esc(r.name):"(no name)"}`,`${SZN[r.size]}, ${fmt(+r.users)} users`,+r.users]));
 let u=0;const cnt={L:g.L,M:g.M,S:g.S};
 ["L","M","S"].forEach(sz=>{if(!cnt[sz])return;const own=refs.filter(r=>r.size===sz);let per,src;
  if(own.length){per=own.reduce((a,r)=>a+(+r.users),0)/own.length;const mn=Math.min(...own.map(r=>+r.users)),mx=Math.max(...own.map(r=>+r.users));src=own.length>1?`average of ${own.length} ${SZN[sz]} references (range ${fmt(mn)}–${fmt(mx)})`:`from the ${SZN[sz]} reference`;}
  else{per=avgMed*P["f"+sz];src=`no ${SZN[sz]} reference: ${fmt(avgMed)} per medium equivalent × ${P["f"+sz]}`;}
  u+=cnt[sz]*per;how.push([`${cnt[sz]} ${SZN[sz]} countr${cnt[sz]>1?"ies":"y"}`,`${src} → ${fmt(per)} each`,cnt[sz]*per]);});
 how.push(["Estimated users in scope","sum of the size groups",u]);
 return {u,est:true,how};
}
function usersFinal(){const x=usersCalc();if(I.ovUsers!==""&&I.ovUsers!=null&&isFinite(+I.ovUsers)&&+I.ovUsers>0)return Object.assign(x,{u:+I.ovUsers,set:true});return x;}
function sizeCalc(){
 const v=P.valLen,nm=P.nameLen,f=I.fmtType,lines=I.struct==="hdr",hf=I.hdrFields,lf=I.lineFields;
 let pf=null,ov=0,hB,lB,env=P.envB,note;
 if(f==="json"){pf=nm+v+6;ov=3;note=`per field = name ${nm} + value ${v} + 6 (quotes, colon, comma)`;}
 else if(f==="xml"){pf=2*nm+5+v;ov=2*nm+5;note=`per field = 2 × name ${nm} + value ${v} + 5 (tags)`;}
 else if(f==="csv"){pf=v+1;ov=2;env=(lines?lf:hf)*(nm+1);note=`per field = value ${v} + 1 delimiter; envelope = header row`;}
 else note=`segments of ${P.idocSeg} bytes, ~${P.idocFps} fields each; control record ${P.idocCtl} bytes`;
 if(f==="idoc"){hB=Math.max(1,Math.ceil(hf/P.idocFps))*P.idocSeg;lB=Math.max(1,Math.ceil(lf/P.idocFps))*P.idocSeg;env=P.idocCtl;}else{hB=hf*pf+ov;lB=lf*pf+ov;}
 return {pf,hB,lB,env,note,lines,typ:env+hB+(lines?I.linesT*lB:0),big:env+hB+(lines?I.linesM*lB:0)};
}
/* size scale: edges in KB from settings */
function sizeEdges(){return [P.sz1,P.sz2*1024,P.sz3*1024,P.sz4*1024,P.sz5*1024];}
function sizeBands(){const e=sizeEdges(),f=kb=>kb>=1024?(+(kb/1024).toFixed(kb>=10240?0:1))+" MB":Math.round(kb)+" KB";
 return [`Under ${f(e[0])}`,`${f(e[0])} – ${f(e[1])}`,`${f(e[1])} – ${f(e[2])}`,`${f(e[2])} – ${f(e[3])}`,`${f(e[3])} – ${f(e[4])}`,`Over ${f(e[4])}`];}
function sizeRepKB(i){const e=sizeEdges();if(i<=0)return e[0]*0.4;if(i>=5)return e[4]*2;return Math.sqrt(e[i-1]*e[i]);}
function sizeBandOf(kb){const e=sizeEdges();let i=0;while(i<5&&kb>e[i])i++;return i;}
function sizes(){let typ,big;
 if(I.sizeMode==="calc"){const c=sizeCalc();typ=c.typ;big=c.big;}
 else{typ=sizeRepKB(+I.normBand||0)*1024;big=Math.max(typ,sizeRepKB(+I.bigBand||0)*1024);}
 const att=I.att?sizeRepKB(+I.attBand||0)*1024*((I.sizeMode==="calc"&&(I.fmtType==="json"||I.fmtType==="xml"))?P.b64:1):0;
 typ+=att;big+=att;
 let set=false;if(I.ovBig!==""&&I.ovBig!=null&&+I.ovBig>0){big=+I.ovBig*MB;set=true;typ=Math.min(typ,big);}
 return {typ,big,att,set};}
/* dynamic volume scale: messages-per-hour edges from throughput ÷ biggest message, capped by count edges */
function hourEdges(bigB){const b=Math.max(1,bigB);return [1,2,3].map(i=>Math.max(1,Math.min(P["tp"+i]*1073741824/b,P["cnt"+i])));}
function niceN(v){if(v<10)return Math.max(1,Math.round(v));const p=Math.pow(10,Math.floor(Math.log10(v)));const m=v/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p;}
function periodFactor(){const pk=peakShare(I.who);
 if(I.traffic==="batch")return Math.min(1,P.batchWin/60)*1; /* per run ≈ messages in the run window (hours) */
 return {hour:1,day:1/pk,week:P.weekDays/pk,month:P.workDays/pk}[I.per];}
function volEdges(bigB){const f=periodFactor();return hourEdges(bigB).map(e=>niceN(e*f));}
function volBands(bigB){const e=volEdges(bigB);return [`Under ${fmt(e[0])}`,`${fmt(e[0])} – ${fmt(e[1])}`,`${fmt(e[1])} – ${fmt(e[2])}`,`Over ${fmt(e[2])}`];}
function volRep(i,bigB){const e=volEdges(bigB);if(i<=0)return e[0]*0.4;if(i>=3)return e[2]*2;return Math.sqrt(e[i-1]*e[i]);}
function volValue(kind,bigB){const ex=I[kind+"Exact"];if(ex!==""&&ex!=null&&+ex>0)return +ex;const b=I[kind+"Band"];if(b===""||b==null||b<0)return null;return volRep(+b,bigB);}
function hourly(dailyPerMediumEq){const c=CURVE[I.who],H=new Array(24).fill(0),rs=regionsSel(),W=weightTot();
 rs.forEach(r=>{const off=P["o"+r],share=W/rs.length;for(let h=0;h<24;h++)H[h]+=share*dailyPerMediumEq*c[((h+off)%24+24)%24];});return H;}
const RUNS={month:1/21,week:1/5,day:1,day4:4,hour:24,min15:96};
const FREQN={month:"monthly",week:"weekly",day:"daily",day4:"4× a day",hour:"hourly",min15:"every 15 min"};
function calc(y3){
 const g=y3?(+I.growth||1):1,pk=peakShare(I.who),W=weightTot(),how=[],sz=sizes(),rpm=I.multi?Math.max(1,+I.rpm||1):1;
 const msgT=rpm*sz.typ,msgB=(rpm-1)*sz.typ+sz.big;
 const scopeAll=!multi()||I.globalKnown==="yes",f=scopeAll?1:P["f"+I.typSize],toScope=scopeAll?1:W/f;
 const who=scopeAll?(multi()?"all countries":"the country"):`one typical ${SZN[I.typSize]} country`;
 let busy=volValue("busy",msgB),avgIn=volValue("avg",msgB),R=0,avgH=0,H=new Array(24).fill(0),peakH=0,daily=0,naive=null;
 if(busy==null)busy=0;
 if(I.traffic==="batch"){
  const runs=I.freq==="month"?1/P.workDays:I.freq==="week"?1/P.weekDays:RUNS[I.freq],win=Math.min(P.batchWin,24*60/Math.max(1,runs))/60;
  const bScope=busy*toScope,aScope=(avgIn!=null?avgIn:busy)*toScope;
  how.push([`Busiest run, ${who}`,"entered",busy]);
  if(!scopeAll)how.push(["Busiest run, all countries",`÷ ${f} (its size) × country weight ${fmt(W)}`,bScope]);
  R=bScope/win;how.push(["Peak rate during a run",`busiest run ÷ run window ${fmt(win*60)} min`,R]);
  daily=aScope*runs;avgH=daily/24;how.push(["Per day",`average run × ${fmt(runs)} runs (${FREQN[I.freq]})`,daily],["Average hour","day ÷ 24",avgH]);
  for(let h=0;h<24;h++)H[h]=avgH;peakH=0;
 }else{
  let Dbusy,Davg;const per=I.per,days=per==="week"?P.weekDays:per==="month"?P.workDays:1;
  how.push([`Busiest ${per}, ${who}`,"entered",busy]);
  if(per==="hour"){Dbusy=busy/pk;how.push(["Busiest day",`÷ ${(pk*100).toFixed(0)}% (busiest-hour share of the ${WHO[I.who].toLowerCase()} curve)`,Dbusy]);Davg=avgIn!=null?avgIn*24:Dbusy;}
  else if(per==="day"){Dbusy=busy;Davg=avgIn!=null?avgIn:busy;}
  else{Dbusy=busy/days*I.dayF;how.push(["Busiest day",`÷ ${days} working days × ${I.dayF} (busiest day)`,Dbusy]);Davg=(avgIn!=null?avgIn:busy)/days;}
  if(avgIn!=null)how.push([`Average ${per}`,"entered",avgIn]);
  if(!scopeAll){how.push(["Busiest day, all countries",`÷ ${f} (its size) × country weight ${fmt(W)}`,Dbusy*toScope]);naive=(per==="hour"?busy:Dbusy*pk)/f*W;}
  Dbusy*=toScope;Davg*=toScope;
  if(scopeAll&&per==="hour"){const sh=hourly(1),m=Math.max(...sh)||1;H=sh.map(v=>v/m*busy);}else H=hourly(Dbusy/W);
  R=Math.max(...H);peakH=H.indexOf(R);daily=Davg;avgH=Davg/24;
  how.push(["Busiest hour",`curve${regionsSel().length>1?"s of "+regionsSel().length+" regions":""} summed per UTC hour, peak at ${peakH}:00 UTC`,R]);
  if(naive!=null&&regionsSel().length>1)how.push(["Plain multiplication would say","one country's busiest hour × country weight",naive]);
  how.push(["Average hour",`average day ÷ 24`,avgH]);
 }
 if(I.ovBusy!==""&&I.ovBusy!=null&&+I.ovBusy>0){R=+I.ovBusy;how.push(["Busiest hour (set by you)","override",R]);}
 R*=g;avgH*=g;daily*=g;if(g>1)how.push(["In 3 years",`× ${g}`,R]);
 how.push(["Peak per minute","busiest hour ÷ 60",R/60]);
 const msgs=R,recs=R*rpm,secs=P["t_"+I.work]||5,inproc=R/3600*secs;
 const massRate=(I.who!=="human"&&I.mass==="yes")?(+I.massRec||0)/Math.max(.25,+I.massWin||1):0;
 return {g,H:H.map(v=>v*g),peakH,R,msgs,recs,avg:avgH,daily,ratio:avgH>0?R/avgH:0,rpm,typ:sz.typ,big:sz.big,bigSet:sz.set,msgT,msgB,secs,inproc,massRate,how,users:usersFinal().u,edges:hourEdges(msgB)};
}

