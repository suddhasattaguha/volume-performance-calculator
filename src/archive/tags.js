/* ================= part tags (scale only) ================= */
const TG={S:"Standard",N:"Needs attention",C:"Critical"};
function tagFor(k,c){
 if(k==="src"){let t="S";const u=usersFinal();let w=`${groups().n} countr${groups().n>1?"ies":"y"} in ${regionsSel().length} region${regionsSel().length>1?"s":""}${u.u?`, ${u.est&&!u.set?"estimated ":""}${fmt(u.u)} users in scope`:""}.`;
  if(+I.growth>=3){t="N";w+=` Growth ×${I.growth} in 3 years.`;}
  if(c.massRate){if(c.massRate>P.ownRoad){t="C";w+=` Mass load ≈ ${fmt(c.massRate)} per hour: needs its own road.`;}else{t=t==="C"?"C":"N";w+=` Mass load ≈ ${fmt(c.massRate)} per hour.`;}}
  if(multi()&&!groups().ok){t=t==="C"?"C":"N";w+=" Size groups don't add up to the number of countries.";}
  return {t,w,params:["fL","fM","fS","ownRoad"]};}
 if(k==="msg"){const m=c.msgB/MB;let t=m>P.sizeC?"C":m>P.sizeW?"N":"S",w=`Biggest message ≈ ${fmtB(c.msgB)} (${sizeBands()[sizeBandOf(c.msgB/1024)]}).`;
  if(c.rpm>P.recC){t="C";w+=` ${fmt(c.rpm)} records per message.`;}else if(c.rpm>P.recW&&t==="S"){t="N";w+=` ${fmt(c.rpm)} records per message.`;}
  return {t,w,params:["sz1","sz2","sz3","sz4","sz5","sizeW","sizeC","recW","recC"]};}
 if(k==="inf"){const e=c.edges,t=c.msgs>e[2]?"C":c.msgs>e[1]?"N":"S";return {t,w:`Busiest hour ≈ ${fmt(c.msgs)} messages; average ≈ ${fmt(c.avg)} per hour. For ${fmtB(c.msgB)} messages it starts to matter above ~${fmt(niceN(e[1]))} per hour.`,params:["tp1","tp2","tp3","cnt1","cnt2","cnt3","workDays","weekDays","batchWin"]};}
 if(k==="mid"){const t=c.inproc>P.inprocC?"C":c.inproc>P.inprocW?"N":"S";return {t,w:`${CPX[I.work]}: ≈ ${fmt(c.inproc)} messages in process at once (busiest hour × ${fmtS(c.secs)} each).`,params:["t_"+I.work,"inprocW","inprocC"]};}
 if(k==="del"){const d=delFit(c);return {t:d.z==="B"?"C":d.z==="A"?"N":"S",w:d.why,params:["batchMax","massMax"]};}
 if(k==="tgt"){const x=tgtCheck(c);return {t:x.z==="B"?"C":x.z==="A"?"N":"S",w:x.metric+" — "+x.why,params:["cap_"+I.absorb,"tgtT","smallF","bulkF","comfort","slaMin","slaHour"]};}
}
const CPX={w1:"Simple",w2:"Medium",w3:"Complex"};

